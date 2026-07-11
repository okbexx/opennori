import fs from "node:fs";
import path from "node:path";
import { inspectClaudeHost, type ClaudeHostInspection } from "./claude-host.ts";
import { installCodexPlugin, inspectCodexPlugin, type CodexPluginInstallResult, type CodexPluginInspection } from "./codex-plugin.ts";
import { asOpenNoriError, OpenNoriError } from "./errors.ts";
import { defaultHostCommandRunner, type HostCommandResult, type HostCommandRunner } from "./host-command.ts";
import { currentProductVersion } from "./project.ts";
import type { PlatformId } from "./types.ts";

export type { HostCommandOptions, HostCommandResult, HostCommandRunner } from "./host-command.ts";

export type GlobalCliInspection = {
  installed_version: string | null;
  expected_version: string;
  executable_path: string | null;
  executable_ready: boolean;
  path_ready: boolean;
  command_ready: boolean;
  ready: boolean;
};

export type HostSetupResult = {
  cli: GlobalCliInspection;
  platform: ({ platform: "codex"; display_name: "Codex" } & (CodexPluginInspection | CodexPluginInstallResult)) | ClaudeHostInspection;
  applied: boolean;
  cli_installed: boolean;
};

export function inspectPlatformHost(
  cwd: string,
  platform: PlatformId,
  expectedVersion = currentProductVersion(),
  runner: HostCommandRunner = defaultHostCommandRunner
): HostSetupResult["platform"] {
  return platform === "codex"
    ? { platform: "codex", display_name: "Codex", ...inspectCodexPlugin(cwd, expectedVersion) }
    : inspectClaudeHost(cwd, runner);
}

function commandFailure(command: string, args: readonly string[], result: HostCommandResult): OpenNoriError {
  const missing = result.error && "code" in result.error && result.error.code === "ENOENT";
  return new OpenNoriError(
    missing ? "host_command_missing" : "host_command_failed",
    missing ? `${command} is not available on PATH.` : `Host command failed: ${command} ${args.join(" ")}`,
    {
      context: {
        command: [command, ...args].join(" "),
        exit_code: result.status,
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim()
      },
      recovery: missing
        ? `Install ${command}, then rerun npx opennori setup.`
        : "Resolve the reported package-manager error, then rerun npx opennori setup."
    }
  );
}

export function inspectGlobalCli(
  cwd: string,
  expectedVersion = currentProductVersion(),
  runner: HostCommandRunner = defaultHostCommandRunner,
  binaryExists: (filePath: string) => boolean = fs.existsSync
): GlobalCliInspection {
  const args = ["ls", "--global", "opennori", "--depth=0", "--json"] as const;
  const result = runner("npm", args, cwd);
  if (result.error) throw commandFailure("npm", args, result);

  let installedVersion: string | null = null;
  try {
    const payload = JSON.parse(result.stdout || "{}") as { dependencies?: Record<string, { version?: unknown }> };
    const version = payload.dependencies?.opennori?.version;
    installedVersion = typeof version === "string" ? version : null;
  } catch {
    if (result.status === 0) {
      throw new OpenNoriError("npm_output_invalid", "npm returned invalid JSON while inspecting the global OpenNori CLI.", {
        context: { stdout: result.stdout.trim() },
        recovery: "Update npm, then rerun npx opennori setup."
      });
    }
  }

  const prefixArgs = ["prefix", "--global"] as const;
  const prefixResult = runner("npm", prefixArgs, cwd);
  if (prefixResult.error || prefixResult.status !== 0) throw commandFailure("npm", prefixArgs, prefixResult);
  const prefix = prefixResult.stdout.trim();
  const executablePath = prefix
    ? process.platform === "win32"
      ? path.join(prefix, "opennori.cmd")
      : path.join(prefix, "bin", "opennori")
    : null;
  let executableReady = false;
  if (executablePath && binaryExists(executablePath)) {
    const executableResult = runner(executablePath, ["--version"], cwd);
    executableReady = executableResult.status === 0 && executableResult.stdout.includes(expectedVersion);
  }
  const executableDirectory = executablePath ? path.dirname(executablePath) : null;
  const pathReady = executableDirectory
    ? (process.env.PATH || "").split(path.delimiter).some((entry) => {
        const left = path.resolve(entry || ".");
        const right = path.resolve(executableDirectory);
        return process.platform === "win32" ? left.toLowerCase() === right.toLowerCase() : left === right;
      })
    : false;
  const commandResult = runner("opennori", ["--version"], cwd);
  const commandReady = !commandResult.error && commandResult.status === 0 && commandResult.stdout.trim() === expectedVersion;

  return {
    installed_version: installedVersion,
    expected_version: expectedVersion,
    executable_path: executablePath,
    executable_ready: executableReady,
    path_ready: pathReady,
    command_ready: commandReady,
    ready: installedVersion === expectedVersion && executableReady && pathReady && commandReady
  };
}

/** Install host-level capabilities through npm and the public Codex Plugin CLI. */
export function setupHost(
  cwd: string,
  {
    dryRun = false,
    platform = "codex",
    expectedVersion = currentProductVersion(),
    runner = defaultHostCommandRunner,
    binaryExists = fs.existsSync,
    pluginInspector = inspectCodexPlugin,
    pluginInstaller = installCodexPlugin,
    claudeInspector = inspectClaudeHost
  }: {
    dryRun?: boolean;
    platform?: PlatformId;
    expectedVersion?: string;
    runner?: HostCommandRunner;
    binaryExists?: (filePath: string) => boolean;
    pluginInspector?: typeof inspectCodexPlugin;
    pluginInstaller?: typeof installCodexPlugin;
    claudeInspector?: typeof inspectClaudeHost;
  } = {}
): HostSetupResult {
  let cli = inspectGlobalCli(cwd, expectedVersion, runner, binaryExists);
  const inspectPlatform = (): HostSetupResult["platform"] =>
    platform === "codex"
      ? { platform: "codex", display_name: "Codex", ...pluginInspector(cwd, expectedVersion) }
      : claudeInspector(cwd, runner);
  if (dryRun) return { cli, platform: inspectPlatform(), applied: false, cli_installed: false };

  let cliInstalled = false;
  if (!cli.ready) {
    const args = ["install", "--global", `opennori@${expectedVersion}`] as const;
    const result = runner("npm", args, cwd);
    if (result.error || result.status !== 0) throw commandFailure("npm", args, result);
    cliInstalled = true;
    cli = inspectGlobalCli(cwd, expectedVersion, runner, binaryExists);
    if (!cli.ready) {
      throw new OpenNoriError("global_cli_not_ready", `npm did not expose OpenNori ${expectedVersion} as a global CLI.`, {
        context: cli,
        recovery: cli.path_ready
          ? `Inspect 'npm ls --global opennori --depth=0', then rerun npx opennori setup.`
          : `Add ${cli.executable_path ? path.dirname(cli.executable_path) : "the npm global bin directory"} to PATH, then rerun npx opennori setup.`
      });
    }
  }

  let platformResult: HostSetupResult["platform"];
  try {
    platformResult =
      platform === "codex"
        ? { platform: "codex", display_name: "Codex", ...pluginInstaller(cwd, expectedVersion) }
        : requireClaudeReady(claudeInspector(cwd, runner));
  } catch (error) {
    if (!cliInstalled) throw error;
    const failure = asOpenNoriError(error);
    throw new OpenNoriError(
      failure.code,
      `${failure.message} The matching OpenNori CLI was installed successfully before platform setup stopped.`,
      {
        context: {
          ...failure.context,
          host_setup: { cli_installed: true, cli_version: cli.installed_version, platform }
        },
        recovery: `${failure.recovery || `Resolve the reported ${platform} host error, then rerun npx opennori setup.`} The installed CLI will be reused.`
      }
    );
  }

  return { cli, platform: platformResult, applied: true, cli_installed: cliInstalled };
}

function requireClaudeReady(inspection: ClaudeHostInspection): ClaudeHostInspection {
  if (inspection.ready) return inspection;
  throw new OpenNoriError("claude_cli_not_ready", "Claude Code is not available on PATH.", {
    context: inspection,
    recovery: "Install or update Claude Code, then rerun npx opennori setup --platform claude."
  });
}
