import path from "node:path";
import type { ExternalCommandResult, ExternalCommandRunner } from "../external-actions.ts";

const DEFAULT_MARKETPLACE_NAME = "opennori";
const DEFAULT_PLUGIN_ID = "opennori@opennori";

export type CodexMarketplaceProbe = {
  available: boolean;
  root: string | null;
  registered: boolean;
  result: ExternalCommandResult;
};

export type CodexPluginProbe = {
  codex_available: boolean;
  installed_version: string | null;
  result: ExternalCommandResult;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseCodexMarketplaceRoot(stdout: string, marketplaceName = DEFAULT_MARKETPLACE_NAME): string | null {
  const matcher = new RegExp(`^${escapeRegExp(marketplaceName)}\\s+(.+)$`);
  const line = stdout.split(/\r?\n/).find((entry) => matcher.test(entry));
  if (!line) return null;
  return line.replace(matcher, "$1").trim() || null;
}

export function sameResolvedPath(left: string | null, right: string): boolean {
  if (!left) return false;
  return path.resolve(left) === path.resolve(right);
}

export function parseInstalledCodexPluginVersion(stdout: string, pluginId = DEFAULT_PLUGIN_ID): string | null {
  const line = stdout.split(/\r?\n/).find((entry) => entry.trim().startsWith(`${pluginId} `));
  if (!line) return null;
  const cells = line.trim().split(/\s+/);
  const version = cells.find((cell, index) => {
    if (index === 0) return false;
    if (cell === "installed" || cell === "enabled" || cell === "disabled") return false;
    if (cell.endsWith(",")) return false;
    return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(cell);
  });
  return version || null;
}

export function inspectCodexMarketplace(
  runner: ExternalCommandRunner,
  marketplaceName = DEFAULT_MARKETPLACE_NAME
): CodexMarketplaceProbe {
  const result = runner("codex", ["plugin", "marketplace", "list"]);
  const available = result.status === 0;
  const root = available ? parseCodexMarketplaceRoot(result.stdout, marketplaceName) : null;
  return {
    available,
    root,
    registered: Boolean(root),
    result
  };
}

export function inspectCodexPlugin(
  runner: ExternalCommandRunner,
  { codexAvailable, unavailableError }: { codexAvailable: boolean; unavailableError?: Error }
): CodexPluginProbe {
  const result = codexAvailable
    ? runner("codex", ["plugin", "list"])
    : { status: null, stdout: "", stderr: "", error: unavailableError };
  return {
    codex_available: codexAvailable,
    installed_version: result.status === 0 ? parseInstalledCodexPluginVersion(result.stdout) : null,
    result
  };
}
