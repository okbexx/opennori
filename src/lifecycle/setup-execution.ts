import path from "node:path";
import { fail, ok } from "../core/io.ts";
import type { NoriResult } from "../types/lifecycle.ts";
import { bootstrap } from "./bootstrap.ts";
import { doctor } from "./doctor.ts";
import {
  defaultExternalCommandRunner,
  runExternalCommandAction
} from "./adapters/external-command-runner.ts";
import { summarizeExternalActions } from "./external-actions.ts";
import { buildSetupPlan } from "./setup-plan.ts";
import type { SetupOptions, SetupPlan, SetupPlanAction } from "./setup-types.ts";

export function setup(
  root: string,
  { dryRun = true, confirmed = false, runner = defaultExternalCommandRunner }: SetupOptions = {}
): NoriResult {
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

  const appliedActions = applyExternalSetupActions(plan.actions, runner);
  const failed = appliedActions.find((action) => action.action === "failed");
  if (failed) {
    return fail(
      "setup_failed",
      `OpenNori setup failed while running ${failed.command_display || failed.kind}.`,
      failed.stderr || "Review the setup preview and rerun npx opennori setup after resolving the command failure."
    );
  }

  const project = bootstrap(projectRoot, { confirmed: true });
  if (!project.ok) return project;
  const health = doctor(projectRoot);
  const completedPlan = completeSetupPlan(plan, appliedActions, project.data.status);

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

function applyExternalSetupActions(actions: SetupPlanAction[], runner: NonNullable<SetupOptions["runner"]>): SetupPlanAction[] {
  const appliedActions: SetupPlanAction[] = [];
  for (const action of actions) {
    if (action.id === "project_state" || action.id === "doctor") {
      appliedActions.push(action);
      continue;
    }
    const applied = runExternalCommandAction(action, runner);
    appliedActions.push(applied);
    if (applied.action === "failed") break;
  }
  return appliedActions;
}

function completeSetupPlan(plan: SetupPlan, appliedActions: SetupPlanAction[], projectStatus: unknown): SetupPlan {
  return {
    ...plan,
    summary: summarizeExternalActions(appliedActions),
    actions: appliedActions.map((action) => {
      if (action.id === "project_state") {
        return {
          ...action,
          action: projectStatus === "ready" ? "exists" : "applied",
          will_write: projectStatus !== "ready"
        };
      }
      if (action.id === "doctor") return { ...action, action: "applied" };
      return action;
    })
  };
}
