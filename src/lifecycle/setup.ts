import path from "node:path";
import { fail, ok } from "../core.ts";
import { pluginState } from "../plugin.ts";
import type { InstallPlan, LifecyclePlanAction, NoriResult } from "../types.ts";
import { bootstrap } from "./bootstrap.ts";
import { doctor } from "./doctor.ts";
import {
  commandAction,
  defaultExternalCommandRunner,
  runExternalCommandAction,
  summarizeExternalActions,
  type ExternalActionStatus,
  type ExternalCommandAction,
  type ExternalCommandResult,
  type ExternalCommandRunner
} from "./external-actions.ts";
import { installActions } from "./install.ts";
import { buildInstallPlan } from "./plans.ts";
import { PACKAGE_JSON } from "./shared.ts";

export type SetupActionId = "codex_marketplace" | "codex_plugin" | "packaged_skills" | "global_cli" | "project_state" | "doctor";
export type SetupActionStatus = ExternalActionStatus;
export type SetupPlanAction = ExternalCommandAction<SetupActionId>;

export type SetupPlan = {
  schema_version: "opennori/setup-plan-v1";
  root: string;
  dry_run: boolean;
  confirmed: boolean;
  summary: {
    total: number;
    would_write: number;
    will_write: number;
    unavailable: number;
    destructive: number;
  };
  actions: SetupPlanAction[];
  project_install_plan: InstallPlan;
};

export type SetupCommandResult = ExternalCommandResult;
export type SetupCommandRunner = ExternalCommandRunner;

export type SetupOptions = {
  root?: string;
  dryRun?: boolean;
  confirmed?: boolean;
  runner?: SetupCommandRunner;
};

function includesMarketplace(stdout: string): boolean {
  return /^opennori\s/m.test(stdout);
}

function installedPluginVersion(stdout: string): string | null {
  const match = stdout.match(/^opennori@opennori\s+installed,\s+enabled\s+(\S+)/m);
  return match?.[1] || null;
}

function globalPackageVersion(stdout: string): string | null {
  try {
    const payload = JSON.parse(stdout) as { dependencies?: Record<string, { version?: string }> };
    return payload.dependencies?.opennori?.version || null;
  } catch {
    return null;
  }
}

function packagedSkillsAction(): SetupPlanAction {
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

function inspectExternalActions(runner: SetupCommandRunner, confirmed: boolean): SetupPlanAction[] {
  const marketplaceCommand = ["codex", "plugin", "marketplace", "add", "okbexx/opennori", "--ref", "main"];
  const pluginCommand = ["codex", "plugin", "add", "opennori@opennori"];
  const globalCliCommand = ["npm", "install", "-g", `opennori@${PACKAGE_JSON.version}`, "--min-release-age=0"];

  const marketplaceList = runner("codex", ["plugin", "marketplace", "list"]);
  const codexAvailable = marketplaceList.status === 0;
  const marketplaceExists = codexAvailable && includesMarketplace(marketplaceList.stdout);

  const pluginList = codexAvailable ? runner("codex", ["plugin", "list"]) : { status: null, stdout: "", stderr: "", error: marketplaceList.error };
  const installedPlugin = pluginList.status === 0 ? installedPluginVersion(pluginList.stdout) : null;
  const pluginExists = installedPlugin === PACKAGE_JSON.version;

  const globalList = runner("npm", ["ls", "-g", "opennori", "--depth=0", "--json"]);
  const npmAvailable = globalList.error === undefined && globalList.status !== null;
  const installedVersion = globalPackageVersion(globalList.stdout);
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
    packagedSkillsAction(),
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

function projectStateAction(installPlan: InstallPlan, confirmed: boolean): SetupPlanAction {
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

function doctorAction(confirmed: boolean): SetupPlanAction {
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

export function buildSetupPlan(root: string, { dryRun = true, confirmed = false, runner = defaultExternalCommandRunner }: SetupOptions = {}): SetupPlan {
  const willApply = confirmed && !dryRun;
  const projectActions = installActions(root, { dryRun: !willApply, force: false, mergeAgentRoute: false });
  const projectInstallPlan = buildInstallPlan(root, projectActions, { dryRun: !willApply, force: false, mergeAgentRoute: false });
  const actions = [
    ...inspectExternalActions(runner, willApply),
    projectStateAction(projectInstallPlan, willApply),
    doctorAction(willApply)
  ];
  return {
    schema_version: "opennori/setup-plan-v1",
    root,
    dry_run: !willApply,
    confirmed,
    summary: summarizeExternalActions(actions),
    actions,
    project_install_plan: projectInstallPlan
  };
}

export function setup(root: string, { dryRun = true, confirmed = false, runner = defaultExternalCommandRunner }: SetupOptions = {}): NoriResult {
  const projectRoot = path.resolve(root);
  const plan = buildSetupPlan(projectRoot, { dryRun, confirmed, runner });
  const needsConfirm = !confirmed || dryRun;
  if (needsConfirm) {
    return ok(
      {
        root: projectRoot,
        status: "needs_confirm",
        confirmed,
        setup_plan: plan,
        next: "Show this setup preview to the user and ask for confirmation before installing the OpenNori capability bundle."
      },
      [],
      plan.summary.unavailable > 0 ? [{ type: "setup", message: "Some setup commands are unavailable on this machine." }] : [],
      ["Rerun npx opennori setup --confirm after the user approves this preview."]
    );
  }

  const unavailable = plan.actions.filter((action) => action.action === "unavailable");
  if (unavailable.length > 0) {
    return fail(
      "setup_unavailable",
      `OpenNori setup cannot continue because ${unavailable.map((action) => action.kind).join(", ")} is unavailable.`,
      unavailable.map((action) => action.recovery).filter(Boolean).join(" ")
    );
  }

  const appliedActions: SetupPlanAction[] = [];
  for (const action of plan.actions) {
    if (action.id === "project_state" || action.id === "doctor") {
      appliedActions.push(action);
      continue;
    }
    const applied = runExternalCommandAction(action, runner);
    appliedActions.push(applied);
    if (applied.action === "failed") {
      return fail(
        "setup_failed",
        `OpenNori setup failed while running ${applied.command_display || applied.kind}.`,
        applied.stderr || "Review the setup preview and rerun npx opennori setup after resolving the command failure."
      );
    }
  }

  const project = bootstrap(projectRoot, { confirmed: true });
  if (!project.ok) return project;
  const health = doctor(projectRoot);
  const completedPlan: SetupPlan = {
    ...plan,
    summary: summarizeExternalActions(appliedActions),
    actions: appliedActions.map((action) => {
      if (action.id === "project_state") {
        return {
          ...action,
          action: project.data.status === "ready" ? "exists" : "applied",
          will_write: project.data.status !== "ready"
        };
      }
      if (action.id === "doctor") return { ...action, action: "applied" };
      return action;
    })
  };

  return ok(
    {
      root: projectRoot,
      status: health.status === "ready" ? "ready" : "needs-action",
      confirmed: true,
      setup_plan: completedPlan,
      project,
      doctor: health,
      next: health.status === "ready"
        ? "OpenNori capability bundle is ready. Open a new Codex session and ask the agent to use OpenNori for the goal."
        : "OpenNori setup finished, but doctor found recovery actions."
    },
    [],
    health.status === "ready" ? [] : [{ type: "doctor", message: "OpenNori doctor reported recovery actions after setup." }],
    health.status === "ready"
      ? ["Open a new Codex session so Codex can load the newly installed OpenNori Plugin and Skills."]
      : health.recovery_actions.map((action) => action.action)
  );
}
