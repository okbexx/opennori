import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { OpenNoriError } from "./errors.ts";

export const CODEX_MARKETPLACE_NAME = "opennori";
export const CODEX_PLUGIN_ID = "opennori@opennori";
const CODEX_MARKETPLACE_SOURCE = "okbexx/opennori";
const CODEX_MARKETPLACE_REF = "main";
const COMMAND_OUTPUT_LIMIT = 4 * 1024 * 1024;

type CodexMarketplace = {
  name?: unknown;
  marketplaceSource?: {
    sourceType?: unknown;
    source?: unknown;
  };
};

type CodexPlugin = {
  pluginId?: unknown;
  version?: unknown;
  installed?: unknown;
  enabled?: unknown;
  source?: {
    source?: unknown;
    version?: unknown;
    path?: unknown;
  };
};

type MarketplaceList = { marketplaces?: CodexMarketplace[] };
type PluginList = { installed?: CodexPlugin[]; available?: CodexPlugin[] };

export type CodexPluginInspection = {
  cli: true;
  marketplace_present: boolean;
  marketplace_source_valid: boolean;
  marketplace_source_type: "official" | "local" | "invalid" | null;
  installed: boolean;
  enabled: boolean;
  installed_version: string | null;
  available_version: string | null;
  version: string | null;
  expected_version: string;
  ready: boolean;
};

export type CodexPluginInstallResult = CodexPluginInspection & {
  marketplace_added: boolean;
  marketplace_upgraded: boolean;
  plugin_reinstalled: boolean;
};

function runCodexJson<T>(cwd: string, args: string[]): T {
  const result = spawnSync("codex", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: COMMAND_OUTPUT_LIMIT,
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.error) {
    const missing = "code" in result.error && result.error.code === "ENOENT";
    throw new OpenNoriError(
      missing ? "codex_cli_missing" : "codex_command_failed",
      missing ? "The Codex CLI is not available on PATH." : `Codex CLI failed to start: ${result.error.message}`,
      {
        context: { command: ["codex", ...args].join(" ") },
        recovery: missing
          ? "Install or update the Codex CLI, then rerun npx opennori setup."
          : "Run the reported Codex command directly, resolve the host error, and retry."
      }
    );
  }
  if (result.status !== 0) {
    throw new OpenNoriError("codex_command_failed", `Codex command failed: codex ${args.join(" ")}`, {
      context: {
        command: ["codex", ...args].join(" "),
        exit_code: result.status,
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim()
      },
      recovery: "Run the reported Codex command directly, resolve the host error, and retry."
    });
  }
  try {
    return JSON.parse(result.stdout) as T;
  } catch {
    throw new OpenNoriError("codex_output_invalid", `Codex returned invalid JSON for: codex ${args.join(" ")}`, {
      context: { stdout: result.stdout.trim() },
      recovery: "Update the Codex CLI to a version with JSON Plugin commands, then retry."
    });
  }
}

function normalizeGitSource(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^https?:\/\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

function inspectMarketplaceSource(
  marketplace: CodexMarketplace,
  plugins: PluginList,
  expectedVersion: string
): Pick<CodexPluginInspection, "marketplace_source_valid" | "marketplace_source_type"> {
  const source = marketplace.marketplaceSource?.source;
  if (typeof source !== "string") {
    return { marketplace_source_valid: false, marketplace_source_type: "invalid" };
  }
  if (normalizeGitSource(source) === "github.com/okbexx/opennori") {
    return { marketplace_source_valid: true, marketplace_source_type: "official" };
  }
  if (marketplace.marketplaceSource?.sourceType !== "local") {
    return { marketplace_source_valid: false, marketplace_source_type: "invalid" };
  }

  const plugin = [...(plugins.available ?? []), ...(plugins.installed ?? [])].find(
    (entry) => entry.pluginId === CODEX_PLUGIN_ID && entry.source?.source === "local"
  );
  const pluginRoot = plugin?.source?.path;
  if (typeof pluginRoot !== "string") {
    return { marketplace_source_valid: false, marketplace_source_type: "local" };
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8")) as {
      name?: unknown;
      version?: unknown;
    };
    return {
      marketplace_source_valid: manifest.name === "opennori" && manifest.version === expectedVersion,
      marketplace_source_type: "local"
    };
  } catch {
    return { marketplace_source_valid: false, marketplace_source_type: "local" };
  }
}

export function inspectCodexPlugin(cwd: string, expectedVersion: string): CodexPluginInspection {
  const marketplaces = runCodexJson<MarketplaceList>(cwd, ["plugin", "marketplace", "list", "--json"]);
  if (!Array.isArray(marketplaces.marketplaces)) {
    throw new OpenNoriError("codex_output_invalid", "Codex marketplace output does not contain a marketplaces array.");
  }
  const marketplace = marketplaces.marketplaces.find((entry) => entry.name === CODEX_MARKETPLACE_NAME);
  const plugins = runCodexJson<PluginList>(cwd, ["plugin", "list", "--available", "--json"]);
  if (!Array.isArray(plugins.installed) || !Array.isArray(plugins.available)) {
    throw new OpenNoriError("codex_output_invalid", "Codex Plugin output does not contain installed and available arrays.");
  }
  const installedPlugin = plugins.installed.find((entry) => entry.pluginId === CODEX_PLUGIN_ID);
  const availablePlugin = plugins.available.find((entry) => entry.pluginId === CODEX_PLUGIN_ID);
  const installed = installedPlugin?.installed === true;
  const enabled = installedPlugin?.enabled === true;
  const installedVersion = typeof installedPlugin?.version === "string" ? installedPlugin.version : null;
  // Codex excludes installed plugins from available[]; npm source.version is
  // the refreshed marketplace target while version remains the installed cache.
  const discoveredAvailableVersion =
    typeof availablePlugin?.version === "string"
      ? availablePlugin.version
      : installedPlugin?.source?.source === "npm" && typeof installedPlugin.source.version === "string"
        ? installedPlugin.source.version
        : null;
  const marketplacePresent = marketplace !== undefined;
  const sourceInspection = marketplace
    ? inspectMarketplaceSource(marketplace, plugins, expectedVersion)
    : { marketplace_source_valid: false, marketplace_source_type: null };
  const sourceValid = sourceInspection.marketplace_source_valid;
  const availableVersion =
    sourceInspection.marketplace_source_type === "local" && sourceValid ? expectedVersion : discoveredAvailableVersion;
  return {
    cli: true,
    marketplace_present: marketplacePresent,
    marketplace_source_valid: sourceValid,
    marketplace_source_type: sourceInspection.marketplace_source_type,
    installed,
    enabled,
    installed_version: installedVersion,
    available_version: availableVersion,
    version: installedVersion,
    expected_version: expectedVersion,
    ready: marketplacePresent && sourceValid && installed && enabled && installedVersion === expectedVersion
  };
}

/** Install through public Codex commands, never by writing host config or cache files. */
export function installCodexPlugin(cwd: string, expectedVersion: string): CodexPluginInstallResult {
  let inspection = inspectCodexPlugin(cwd, expectedVersion);
  let marketplaceAdded = false;
  let marketplaceUpgraded = false;
  let pluginReinstalled = false;
  if (inspection.ready) {
    return {
      ...inspection,
      marketplace_added: false,
      marketplace_upgraded: false,
      plugin_reinstalled: false
    };
  }
  if (inspection.marketplace_present && !inspection.marketplace_source_valid) {
    if (inspection.marketplace_source_type === "local") {
      throw new OpenNoriError(
        "codex_local_marketplace_invalid",
        `The configured local ${CODEX_MARKETPLACE_NAME} marketplace does not expose a readable OpenNori ${expectedVersion} Plugin manifest.`,
        {
          recovery: `Inspect '${CODEX_PLUGIN_ID}' with 'codex plugin list --available --json', then fix its .codex-plugin/plugin.json name and version.`
        }
      );
    }
    throw new OpenNoriError("codex_marketplace_conflict", `Codex already has a marketplace named ${CODEX_MARKETPLACE_NAME} from another source.`, {
      recovery: `Review it with 'codex plugin marketplace list --json'. OpenNori will not replace or remove it automatically.`
    });
  }

  if (!inspection.marketplace_present) {
    runCodexJson<unknown>(cwd, [
      "plugin",
      "marketplace",
      "add",
      CODEX_MARKETPLACE_SOURCE,
      "--ref",
      CODEX_MARKETPLACE_REF,
      "--json"
    ]);
    marketplaceAdded = true;
  } else if (inspection.marketplace_source_type === "official") {
    runCodexJson<unknown>(cwd, ["plugin", "marketplace", "upgrade", CODEX_MARKETPLACE_NAME, "--json"]);
    marketplaceUpgraded = true;
  }

  inspection = inspectCodexPlugin(cwd, expectedVersion);
  if (inspection.ready) {
    return {
      ...inspection,
      marketplace_added: marketplaceAdded,
      marketplace_upgraded: marketplaceUpgraded,
      plugin_reinstalled: false
    };
  }
  if (!inspection.marketplace_present || !inspection.marketplace_source_valid || inspection.available_version !== expectedVersion) {
    throw new OpenNoriError("codex_plugin_version_unavailable", `Codex marketplace does not expose OpenNori ${expectedVersion}.`, {
      context: { expected_version: expectedVersion, available_version: inspection.available_version, installed_version: inspection.installed_version },
      recovery: "Retry after the matching OpenNori release is available from the configured marketplace."
    });
  }

  // Codex add is idempotent for an installed Plugin and refreshes it without a
  // destructive remove-first window. The host command owns its install commit.
  runCodexJson<unknown>(cwd, ["plugin", "add", CODEX_PLUGIN_ID, "--json"]);
  pluginReinstalled = true;

  inspection = inspectCodexPlugin(cwd, expectedVersion);
  if (!inspection.ready) {
    throw new OpenNoriError("codex_plugin_not_ready", `OpenNori ${expectedVersion} is not installed and enabled in Codex.`, {
      context: inspection,
      recovery: `Inspect 'codex plugin list --available --json', then reinstall ${CODEX_PLUGIN_ID}.`
    });
  }
  return {
    ...inspection,
    marketplace_added: marketplaceAdded,
    marketplace_upgraded: marketplaceUpgraded,
    plugin_reinstalled: pluginReinstalled
  };
}
