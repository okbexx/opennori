import fs from "node:fs";
import path from "node:path";
import { inspectClaudeHost } from "./claude-host.ts";
import { OpenNoriError } from "./errors.ts";
import { defaultHostCommandRunner, type HostCommandResult, type HostCommandRunner } from "./host-command.ts";

export const CLAUDE_MARKETPLACE_NAME = "opennori";
export const CLAUDE_PLUGIN_ID = "opennori@opennori";

type ClaudeMarketplace = {
  name?: unknown;
  source?: unknown;
  path?: unknown;
};

type ClaudePlugin = {
  id?: unknown;
  version?: unknown;
  scope?: unknown;
  enabled?: unknown;
};

export type ClaudePluginInspection = {
  platform: "claude";
  display_name: "Claude Code";
  cli_available: boolean;
  version: string | null;
  marketplace_present: boolean;
  marketplace_source_valid: boolean;
  installed: boolean;
  enabled: boolean;
  installed_version: string | null;
  expected_version: string;
  ready: boolean;
};

export type ClaudePluginInstallResult = ClaudePluginInspection & {
  marketplace_added: boolean;
  marketplace_updated: boolean;
  plugin_installed: boolean;
  plugin_updated: boolean;
  plugin_enabled: boolean;
};

function commandError(args: readonly string[], result: HostCommandResult): OpenNoriError {
  const missing = result.error && "code" in result.error && result.error.code === "ENOENT";
  return new OpenNoriError(
    missing ? "claude_cli_missing" : "claude_command_failed",
    missing ? "The Claude Code CLI is not available on PATH." : `Claude Code command failed: claude ${args.join(" ")}`,
    {
      context: {
        command: ["claude", ...args].join(" "),
        exit_code: result.status,
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim()
      },
      recovery: missing
        ? "Install or update Claude Code, then rerun npx opennori setup --platform claude."
        : "Run the reported Claude Code command directly, resolve the host error, and retry."
    }
  );
}

function runClaude(cwd: string, args: readonly string[], runner: HostCommandRunner): string {
  const result = runner("claude", args, cwd);
  if (result.error || result.status !== 0) throw commandError(args, result);
  return result.stdout;
}

function runClaudeJson<T>(cwd: string, args: readonly string[], runner: HostCommandRunner): T {
  const output = runClaude(cwd, args, runner);
  try {
    return JSON.parse(output) as T;
  } catch {
    throw new OpenNoriError("claude_output_invalid", `Claude Code returned invalid JSON for: claude ${args.join(" ")}`, {
      context: { stdout: output.trim() },
      recovery: "Update Claude Code to a version with JSON Plugin commands, then retry."
    });
  }
}

function globalPackageRoot(cwd: string, runner: HostCommandRunner): string {
  const args = ["root", "--global"] as const;
  const result = runner("npm", args, cwd);
  if (result.error || result.status !== 0) {
    throw new OpenNoriError("npm_global_root_unavailable", "npm could not locate the persistent global package directory.", {
      context: { command: "npm root --global", stdout: result.stdout.trim(), stderr: result.stderr.trim() },
      recovery: "Resolve the npm global installation, then rerun npx opennori setup --platform claude."
    });
  }
  const root = path.join(result.stdout.trim(), "opennori");
  if (!fs.existsSync(path.join(root, ".claude-plugin", "marketplace.json"))) {
    throw new OpenNoriError("claude_marketplace_package_missing", "The global OpenNori package does not contain its Claude Code marketplace.", {
      recovery: "Reinstall the matching OpenNori CLI, then rerun setup."
    });
  }
  return root;
}

function validMarketplaceSource(marketplace: ClaudeMarketplace, expectedVersion: string): boolean {
  if (marketplace.source !== "directory" || typeof marketplace.path !== "string") return false;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(marketplace.path, ".claude-plugin", "marketplace.json"), "utf8")) as {
      name?: unknown;
      version?: unknown;
      plugins?: Array<{ name?: unknown; version?: unknown }>;
    };
    const plugin = manifest.plugins?.find((entry) => entry.name === "opennori");
    return manifest.name === CLAUDE_MARKETPLACE_NAME && manifest.version === expectedVersion && plugin?.version === expectedVersion;
  } catch {
    return false;
  }
}

/** Inspect Claude Code and the user-scoped OpenNori Plugin without changing host state. */
export function inspectClaudePlugin(
  cwd: string,
  expectedVersion: string,
  runner: HostCommandRunner = defaultHostCommandRunner
): ClaudePluginInspection {
  const host = inspectClaudeHost(cwd, runner);
  if (!host.ready) {
    return {
      ...host,
      marketplace_present: false,
      marketplace_source_valid: false,
      installed: false,
      enabled: false,
      installed_version: null,
      expected_version: expectedVersion,
      ready: false
    };
  }
  const marketplaces = runClaudeJson<ClaudeMarketplace[]>(cwd, ["plugin", "marketplace", "list", "--json"], runner);
  const plugins = runClaudeJson<ClaudePlugin[]>(cwd, ["plugin", "list", "--json"], runner);
  if (!Array.isArray(marketplaces) || !Array.isArray(plugins)) {
    throw new OpenNoriError("claude_output_invalid", "Claude Code Plugin commands did not return JSON arrays.");
  }
  const marketplace = marketplaces.find((entry) => entry.name === CLAUDE_MARKETPLACE_NAME);
  const plugin = plugins.find((entry) => entry.id === CLAUDE_PLUGIN_ID && entry.scope === "user");
  const installedVersion = typeof plugin?.version === "string" ? plugin.version : null;
  const sourceValid = marketplace ? validMarketplaceSource(marketplace, expectedVersion) : false;
  return {
    ...host,
    marketplace_present: marketplace !== undefined,
    marketplace_source_valid: sourceValid,
    installed: plugin !== undefined,
    enabled: plugin?.enabled === true,
    installed_version: installedVersion,
    expected_version: expectedVersion,
    ready: sourceValid && plugin?.enabled === true && installedVersion === expectedVersion
  };
}

/** Install through public Claude Code Plugin commands without writing host settings or caches. */
export function installClaudePlugin(
  cwd: string,
  expectedVersion: string,
  runner: HostCommandRunner = defaultHostCommandRunner
): ClaudePluginInstallResult {
  let inspection = inspectClaudePlugin(cwd, expectedVersion, runner);
  let marketplaceAdded = false;
  let marketplaceUpdated = false;
  let pluginInstalled = false;
  let pluginUpdated = false;
  let pluginEnabled = false;
  if (inspection.ready) {
    return {
      ...inspection,
      marketplace_added: false,
      marketplace_updated: false,
      plugin_installed: false,
      plugin_updated: false,
      plugin_enabled: false
    };
  }
  if (!inspection.cli_available) {
    throw new OpenNoriError("claude_cli_not_ready", "Claude Code is not available on PATH.", {
      recovery: "Install or update Claude Code, then rerun npx opennori setup --platform claude."
    });
  }
  if (inspection.marketplace_present && !inspection.marketplace_source_valid) {
    throw new OpenNoriError("claude_marketplace_conflict", "Claude Code already has an incompatible marketplace named opennori.", {
      recovery: "Review it with 'claude plugin marketplace list --json'. OpenNori will not replace or remove it automatically."
    });
  }
  if (!inspection.marketplace_present) {
    runClaude(cwd, ["plugin", "marketplace", "add", globalPackageRoot(cwd, runner), "--scope", "user"], runner);
    marketplaceAdded = true;
  } else {
    runClaude(cwd, ["plugin", "marketplace", "update", CLAUDE_MARKETPLACE_NAME], runner);
    marketplaceUpdated = true;
  }

  inspection = inspectClaudePlugin(cwd, expectedVersion, runner);
  if (!inspection.marketplace_source_valid) {
    throw new OpenNoriError("claude_plugin_version_unavailable", `Claude Code marketplace does not expose OpenNori ${expectedVersion}.`, {
      recovery: "Install the matching OpenNori package, then rerun setup."
    });
  }
  if (!inspection.installed) {
    runClaude(cwd, ["plugin", "install", CLAUDE_PLUGIN_ID, "--scope", "user"], runner);
    pluginInstalled = true;
  } else if (inspection.installed_version !== expectedVersion) {
    runClaude(cwd, ["plugin", "update", CLAUDE_PLUGIN_ID, "--scope", "user"], runner);
    pluginUpdated = true;
  }

  inspection = inspectClaudePlugin(cwd, expectedVersion, runner);
  if (inspection.installed && !inspection.enabled) {
    runClaude(cwd, ["plugin", "enable", CLAUDE_PLUGIN_ID, "--scope", "user"], runner);
    pluginEnabled = true;
  }
  inspection = inspectClaudePlugin(cwd, expectedVersion, runner);
  if (!inspection.ready) {
    throw new OpenNoriError("claude_plugin_not_ready", `OpenNori ${expectedVersion} is not installed and enabled in Claude Code.`, {
      context: inspection,
      recovery: `Inspect 'claude plugin list --json', then update ${CLAUDE_PLUGIN_ID}.`
    });
  }
  return {
    ...inspection,
    marketplace_added: marketplaceAdded,
    marketplace_updated: marketplaceUpdated,
    plugin_installed: pluginInstalled,
    plugin_updated: pluginUpdated,
    plugin_enabled: pluginEnabled
  };
}
