import { pluginState } from "../plugin.ts";
import type { InstallPlan } from "../types/lifecycle.ts";
import { inspectCodexMarketplace, inspectCodexPlugin } from "./adapters/codex-plugin.ts";
import { inspectGlobalNpmPackage } from "./adapters/npm-global.ts";
import { commandAction } from "./external-actions.ts";
import { PACKAGE_JSON } from "./shared.ts";
import type { SetupCommandRunner, SetupPlanAction } from "./setup-types.ts";

export function setupPackagedSkillsAction(): SetupPlanAction {
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
    recovery: available ? undefined : "Reinstall OpenNori from npm or the source repository, then rerun npx opennori setup."
  };
}

export function buildSetupExternalActions(runner: SetupCommandRunner, confirmed: boolean): SetupPlanAction[] {
  const marketplaceCommand = ["codex", "plugin", "marketplace", "add", "okbexx/opennori", "--ref", "main"];
  const pluginCommand = ["codex", "plugin", "add", "opennori@opennori"];
  const globalCliCommand = ["npm", "install", "-g", `opennori@${PACKAGE_JSON.version}`, "--min-release-age=0"];

  const marketplace = inspectCodexMarketplace(runner);
  const codexAvailable = marketplace.available;
  const marketplaceExists = marketplace.registered;

  const plugin = inspectCodexPlugin(runner, { codexAvailable, unavailableError: marketplace.result.error });
  const installedPlugin = plugin.installed_version;
  const pluginExists = installedPlugin === PACKAGE_JSON.version;

  const globalPackage = inspectGlobalNpmPackage(runner, "opennori");
  const npmAvailable = globalPackage.available;
  const installedVersion = globalPackage.installed_version;
  const globalCliExists = npmAvailable && installedVersion === PACKAGE_JSON.version;

  return [
    commandAction(
      "codex_marketplace",
      "codex-plugin-marketplace",
      marketplaceCommand,
      marketplaceExists
        ? "OpenNori Codex Plugin marketplace is already registered."
        : "Register the OpenNori marketplace through the official Codex Plugin CLI.",
      {
        exists: marketplaceExists,
        available: codexAvailable,
        confirmed,
        recovery: "Install or repair the Codex CLI, then rerun npx opennori setup."
      }
    ),
    commandAction(
      "codex_plugin",
      "codex-plugin",
      pluginCommand,
      pluginExists
        ? `OpenNori Codex Plugin ${installedPlugin} is already installed and enabled.`
        : installedPlugin
          ? `Upgrade the OpenNori Codex Plugin from ${installedPlugin} to ${PACKAGE_JSON.version} so Codex can discover current packaged Skills.`
          : "Install the OpenNori Codex Plugin so Codex can discover packaged Skills.",
      {
        exists: pluginExists,
        available: codexAvailable,
        confirmed,
        recovery: "Install or repair the Codex CLI, then rerun npx opennori setup."
      }
    ),
    setupPackagedSkillsAction(),
    commandAction(
      "global_cli",
      "global-cli",
      globalCliCommand,
      globalCliExists
        ? `Global opennori CLI ${installedVersion} is already installed.`
        : "Install the opennori CLI globally so projects can be initialized with opennori init. The command-local npm release-age override only applies to this OpenNori install.",
      {
        exists: globalCliExists,
        available: npmAvailable,
        confirmed,
        recovery: "Install or repair npm, then rerun npx opennori setup."
      }
    )
  ];
}

export function setupProjectStateAction(installPlan: InstallPlan, confirmed: boolean): SetupPlanAction {
  return {
    id: "project_state",
    kind: "project-state",
    action: installPlan.summary.would_write > 0 ? "will-run" : "exists",
    command: ["opennori", "init"],
    command_display: "opennori init",
    would_write: installPlan.summary.would_write > 0,
    will_write: confirmed && installPlan.summary.would_write > 0,
    destructive: installPlan.summary.destructive > 0,
    reason: installPlan.summary.would_write > 0
      ? "Initialize or refresh the current project .opennori state directory."
      : "Current project OpenNori state is already present."
  };
}

export function setupDoctorAction(confirmed: boolean): SetupPlanAction {
  return {
    id: "doctor",
    kind: "doctor",
    action: "will-run",
    command: ["opennori", "doctor"],
    command_display: "opennori doctor",
    would_write: false,
    will_write: confirmed,
    destructive: false,
    reason: "Run OpenNori doctor after setup so the user can see bundle readiness."
  };
}
