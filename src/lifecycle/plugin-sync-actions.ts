import { packageRoot } from "../package-root.ts";
import { pluginState } from "../plugin.ts";
import { inspectCodexMarketplace, inspectCodexPlugin, sameResolvedPath } from "./adapters/codex-plugin.ts";
import { commandAction } from "./external-actions.ts";
import { PACKAGE_JSON } from "./shared.ts";
import type { PluginSyncAction, PluginSyncCommandRunner } from "./plugin-sync-types.ts";

export function pluginSyncPackagedSkillsAction(): PluginSyncAction {
  const plugin = pluginState();
  const available = plugin.packaged && plugin.skill_count > 0 && plugin.skills.some((skill) => skill.name === "nori");
  return {
    id: "packaged_skills",
    kind: "packaged-skills",
    action: available ? "exists" : "unavailable",
    would_write: false,
    will_write: false,
    destructive: false,
    reason: available
      ? `OpenNori package includes ${plugin.skill_count} packaged Skill assets for Codex discovery.`
      : "OpenNori package is missing packaged Skill assets.",
    recovery: available ? undefined : "Reinstall OpenNori from npm or the source repository, then rerun opennori plugin sync."
  };
}

export function pluginSyncMarketplaceAction(
  runner: PluginSyncCommandRunner,
  confirmed: boolean,
  local: boolean
): { action: PluginSyncAction; codexAvailable: boolean; root: string | null } {
  const localRoot = packageRoot();
  const marketplaceCommand = local
    ? ["codex", "plugin", "marketplace", "add", localRoot]
    : ["codex", "plugin", "marketplace", "add", "okbexx/opennori", "--ref", "main"];
  const marketplace = inspectCodexMarketplace(runner);
  const codexAvailable = marketplace.available;
  const root = marketplace.root;
  const exists = local ? sameResolvedPath(root, localRoot) : marketplace.registered;

  return {
    codexAvailable,
    root,
    action: commandAction(
      "codex_marketplace",
      "codex-plugin-marketplace",
      marketplaceCommand,
      exists
        ? local
          ? "OpenNori local Codex Plugin marketplace already points to this package root."
          : "OpenNori Codex Plugin marketplace is already registered."
        : local
          ? "Register this OpenNori package root as the Codex Plugin marketplace before syncing the plugin cache."
          : "Register the OpenNori marketplace through the official Codex Plugin CLI before syncing the plugin cache.",
      {
        exists,
        available: codexAvailable,
        confirmed,
        recovery: "Install or repair the Codex CLI, then rerun opennori plugin sync."
      }
    )
  };
}

export function pluginSyncPluginAction(
  runner: PluginSyncCommandRunner,
  codexAvailable: boolean,
  confirmed: boolean
): PluginSyncAction {
  const pluginCommand = ["codex", "plugin", "add", "opennori@opennori"];
  const plugin = inspectCodexPlugin(runner, { codexAvailable });
  const installedPlugin = plugin.installed_version;
  const packageVersion = String(PACKAGE_JSON.version);
  const reason = installedPlugin === packageVersion
    ? `Refresh the OpenNori Codex Plugin cache at ${packageVersion} so Codex can discover current packaged Skills.`
    : installedPlugin
      ? `Upgrade the OpenNori Codex Plugin from ${installedPlugin} to ${packageVersion} so Codex can discover current packaged Skills.`
      : "Install the OpenNori Codex Plugin so Codex can discover packaged Skills.";

  return commandAction("codex_plugin", "codex-plugin", pluginCommand, reason, {
    exists: false,
    available: codexAvailable,
    confirmed,
    recovery: "Install or repair the Codex CLI, then rerun opennori plugin sync."
  });
}
