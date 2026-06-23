import { fail, ok } from "../core/io.ts";
import type { NoriResult } from "../types/result.ts";
import {
  defaultExternalCommandRunner,
  runExternalCommandAction
} from "./adapters/external-command-runner.ts";
import { summarizeExternalActions } from "./external-actions.ts";
import { buildPluginSyncPlan } from "./plugin-sync-plan.ts";
import type { PluginSyncAction, PluginSyncOptions, PluginSyncPlan } from "./plugin-sync-types.ts";

export function syncPlugin({
  dryRun = true,
  confirmed = false,
  local = false,
  runner = defaultExternalCommandRunner
}: PluginSyncOptions = {}): NoriResult {
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

  const appliedActions = applyPluginSyncActions(plan.actions, runner);
  const failed = appliedActions.find((action) => action.action === "failed");
  if (failed) {
    return fail(
      "plugin_sync_failed",
      `OpenNori plugin sync failed while running ${failed.command_display || failed.kind}.`,
      failed.stderr || "Review the plugin sync preview and rerun opennori plugin sync after resolving the command failure."
    );
  }

  const completedPlan = completePluginSyncPlan(plan, appliedActions);

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

function applyPluginSyncActions(actions: PluginSyncAction[], runner: NonNullable<PluginSyncOptions["runner"]>): PluginSyncAction[] {
  const appliedActions: PluginSyncAction[] = [];
  for (const action of actions) {
    const applied = runExternalCommandAction(action, runner);
    appliedActions.push(applied);
    if (applied.action === "failed") break;
  }
  return appliedActions;
}

function completePluginSyncPlan(plan: PluginSyncPlan, appliedActions: PluginSyncAction[]): PluginSyncPlan {
  return {
    ...plan,
    summary: summarizeExternalActions(appliedActions),
    actions: appliedActions
  };
}
