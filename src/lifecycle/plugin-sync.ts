import { spawnSync } from "node:child_process";
import path from "node:path";
import { fail, ok } from "../core.ts";
import { packageRoot } from "../package-root.ts";
import { pluginState } from "../plugin.ts";
import type { NoriResult } from "../types.ts";
import { PACKAGE_JSON } from "./shared.ts";

export type PluginSyncActionStatus = "exists" | "will-run" | "unavailable" | "applied" | "failed";

export type PluginSyncAction = {
  id: "codex_marketplace" | "codex_plugin" | "packaged_skills";
  kind: string;
  action: PluginSyncActionStatus;
  command?: string[];
  command_display?: string;
  would_write: boolean;
  will_write: boolean;
  destructive: boolean;
  reason: string;
  recovery?: string;
  stdout?: string;
  stderr?: string;
};

export type PluginSyncPlan = {
  schema_version: "opennori/plugin-sync-plan-v1";
  dry_run: boolean;
  confirmed: boolean;
  local: boolean;
  summary: {
    total: number;
    would_write: number;
    will_write: number;
    unavailable: number;
    destructive: number;
  };
  actions: PluginSyncAction[];
};

export type PluginSyncCommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
};

export type PluginSyncCommandRunner = (command: string, args: string[]) => PluginSyncCommandResult;

export type PluginSyncOptions = {
  dryRun?: boolean;
  confirmed?: boolean;
  local?: boolean;
  runner?: PluginSyncCommandRunner;
};

function defaultRunner(command: string, args: string[]): PluginSyncCommandResult {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error
  };
}

function commandDisplay(command: string[]): string {
  return command.map((part) => (/^[a-zA-Z0-9_./@:=,-]+$/.test(part) ? part : JSON.stringify(part))).join(" ");
}

function marketplaceRoot(stdout: string): string | null {
  const line = stdout.split(/\r?\n/).find((entry) => /^opennori\s+/.test(entry));
  if (!line) return null;
  return line.replace(/^opennori\s+/, "").trim() || null;
}

function samePath(left: string | null, right: string): boolean {
  if (!left) return false;
  return path.resolve(left) === path.resolve(right);
}

function installedPluginVersion(stdout: string): string | null {
  const match = stdout.match(/^opennori@opennori\s+installed,\s+enabled\s+(\S+)/m);
  return match?.[1] || null;
}

function commandAction(
  id: PluginSyncAction["id"],
  kind: string,
  command: string[],
  reason: string,
  { exists = false, available = true, confirmed = false, recovery }: { exists?: boolean; available?: boolean; confirmed?: boolean; recovery?: string } = {}
): PluginSyncAction {
  if (!available) {
    return {
      id,
      kind,
      action: "unavailable",
      command,
      command_display: commandDisplay(command),
      would_write: false,
      will_write: false,
      destructive: false,
      reason,
      recovery
    };
  }
  if (exists) {
    return {
      id,
      kind,
      action: "exists",
      command,
      command_display: commandDisplay(command),
      would_write: false,
      will_write: false,
      destructive: false,
      reason
    };
  }
  return {
    id,
    kind,
    action: "will-run",
    command,
    command_display: commandDisplay(command),
    would_write: true,
    will_write: confirmed,
    destructive: false,
    reason
  };
}

function packagedSkillsAction(): PluginSyncAction {
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

function marketplaceAction(runner: PluginSyncCommandRunner, confirmed: boolean, local: boolean): { action: PluginSyncAction; codexAvailable: boolean; root: string | null } {
  const localRoot = packageRoot();
  const marketplaceCommand = local
    ? ["codex", "plugin", "marketplace", "add", localRoot]
    : ["codex", "plugin", "marketplace", "add", "okbexx/opennori", "--ref", "main"];
  const marketplaceList = runner("codex", ["plugin", "marketplace", "list"]);
  const codexAvailable = marketplaceList.status === 0;
  const root = codexAvailable ? marketplaceRoot(marketplaceList.stdout) : null;
  const exists = local ? samePath(root, localRoot) : Boolean(root);

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

function pluginAction(runner: PluginSyncCommandRunner, codexAvailable: boolean, confirmed: boolean): PluginSyncAction {
  const pluginCommand = ["codex", "plugin", "add", "opennori@opennori"];
  const pluginList = codexAvailable ? runner("codex", ["plugin", "list"]) : { status: null, stdout: "", stderr: "" };
  const installedPlugin = pluginList.status === 0 ? installedPluginVersion(pluginList.stdout) : null;
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

function summarize(actions: PluginSyncAction[]) {
  return {
    total: actions.length,
    would_write: actions.filter((action) => action.would_write).length,
    will_write: actions.filter((action) => action.will_write).length,
    unavailable: actions.filter((action) => action.action === "unavailable").length,
    destructive: actions.filter((action) => action.destructive).length
  };
}

export function buildPluginSyncPlan({ dryRun = true, confirmed = false, local = false, runner = defaultRunner }: PluginSyncOptions = {}): PluginSyncPlan {
  const willApply = confirmed && !dryRun;
  const marketplace = marketplaceAction(runner, willApply, local);
  const actions = [
    marketplace.action,
    pluginAction(runner, marketplace.codexAvailable, willApply),
    packagedSkillsAction()
  ];
  return {
    schema_version: "opennori/plugin-sync-plan-v1",
    dry_run: !willApply,
    confirmed,
    local,
    summary: summarize(actions),
    actions
  };
}

function runPluginSyncAction(action: PluginSyncAction, runner: PluginSyncCommandRunner): PluginSyncAction {
  if (!action.command || !action.will_write || action.action !== "will-run") return action;
  const [command, ...args] = action.command;
  if (!command) return action;
  const result = runner(command, args);
  if (result.status === 0) {
    return {
      ...action,
      action: "applied",
      stdout: result.stdout.trim() || undefined,
      stderr: result.stderr.trim() || undefined
    };
  }
  return {
    ...action,
    action: "failed",
    stdout: result.stdout.trim() || undefined,
    stderr: result.stderr.trim() || result.error?.message || undefined
  };
}

export function syncPlugin({ dryRun = true, confirmed = false, local = false, runner = defaultRunner }: PluginSyncOptions = {}): NoriResult {
  const plan = buildPluginSyncPlan({ dryRun, confirmed, local, runner });
  const needsConfirm = !confirmed || dryRun;
  if (needsConfirm) {
    return ok(
      {
        status: "needs_confirm",
        confirmed,
        plugin_sync_plan: plan,
        next: "Show this plugin sync preview to the user and ask for confirmation before updating the Codex Plugin cache."
      },
      [],
      plan.summary.unavailable > 0 ? [{ type: "plugin-sync", message: "Some plugin sync commands are unavailable on this machine." }] : [],
      ["Rerun opennori plugin sync --confirm after the user approves this preview."]
    );
  }

  const unavailable = plan.actions.filter((action) => action.action === "unavailable");
  if (unavailable.length > 0) {
    return fail(
      "plugin_sync_unavailable",
      `OpenNori plugin sync cannot continue because ${unavailable.map((action) => action.kind).join(", ")} is unavailable.`,
      unavailable.map((action) => action.recovery).filter(Boolean).join(" ")
    );
  }

  const appliedActions: PluginSyncAction[] = [];
  for (const action of plan.actions) {
    const applied = runPluginSyncAction(action, runner);
    appliedActions.push(applied);
    if (applied.action === "failed") {
      return fail(
        "plugin_sync_failed",
        `OpenNori plugin sync failed while running ${applied.command_display || applied.kind}.`,
        applied.stderr || "Review the plugin sync preview and rerun opennori plugin sync after resolving the command failure."
      );
    }
  }

  const completedPlan: PluginSyncPlan = {
    ...plan,
    summary: summarize(appliedActions),
    actions: appliedActions
  };

  return ok(
    {
      status: "synced",
      confirmed: true,
      plugin_sync_plan: completedPlan,
      next: "OpenNori Codex Plugin cache is synced. Open a new Codex session so Codex can load the current packaged Skills."
    },
    [],
    [],
    ["Open a new Codex session so Codex can load the synced OpenNori Plugin and Skills."]
  );
}
