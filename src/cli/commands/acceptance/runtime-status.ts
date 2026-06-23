import { defineCommand } from "citty";
import {
  acceptanceBasisView,
  criterionStatusRows,
  currentGap,
  ok,
  readProjectProfile,
  recomputeWorkflowStatus
} from "../../../core.ts";
import { goalReviewState, refreshManifest } from "../../../lifecycle.ts";
import { activeGoalArgs, type ActiveGoalRuntime, runJsonCommand, savePair } from "../../runtime.ts";
import { jsonArg, rootArg } from "./shared.ts";

type CommandRuntimeOverride = Pick<ActiveGoalRuntime, "loadPair"> & Partial<Pick<ActiveGoalRuntime, "savePair" | "refreshManifest">>;

export const nextCommand = defineCommand({
  meta: {
    name: "next",
    description: "Show the next OpenNori acceptance gap or loop recommendation."
  },
  args: {
    ...activeGoalArgs,
    json: jsonArg
  },
  run({ args, data }) {
    const { contract, ledger, root = process.cwd() } = data.loadPair(args);
    const review = goalReviewState(root, contract, ledger);
    return ok({
      goal_id: contract.goal_id,
      presentation: contract.presentation,
      current_gap: review.current_gap,
      complete: review.current_gap === null,
      next_recommendation: review.next_recommendation,
      agent_next: review.agent_next
    }, [], [], review.next_recommendation.actions);
  }
});

export async function runNextCommand(rawArgs: string[], { loadPair }: ActiveGoalRuntime) {
  return runJsonCommand(nextCommand, rawArgs, { loadPair });
}

export const resumeCommand = defineCommand({
  meta: {
    name: "resume",
    description: "Resume the active OpenNori goal with completion state and next actions."
  },
  args: {
    ...activeGoalArgs,
    json: jsonArg
  },
  run({ args, data }) {
    const { contract, ledger, acceptancePath, evidencePath, root } = data.loadPair(args);
    const review = goalReviewState(root, contract, ledger);
    return ok({
      goal_id: contract.goal_id,
      presentation: contract.presentation,
      acceptance_basis: acceptanceBasisView(contract),
      workflow_status: ledger.status,
      current_gap: review.current_gap,
      completion: review.completion,
      intervention: review.intervention,
      acceptance_review: review.acceptance_review,
      evidence_health: review.evidence_health,
      architecture: review.architecture,
      next_recommendation: review.next_recommendation,
      agent_next: review.agent_next,
      acceptance_path: acceptancePath,
      evidence_path: evidencePath
    }, [], [], review.next_recommendation.actions);
  }
});

export async function runResumeCommand(rawArgs: string[], { loadPair }: ActiveGoalRuntime) {
  return runJsonCommand(resumeCommand, rawArgs, { loadPair });
}

export const statusCommand = defineCommand({
  meta: {
    name: "status",
    description: "Show the current OpenNori goal, acceptance status, evidence health, and completion decision."
  },
  args: {
    ...activeGoalArgs,
    json: jsonArg
  },
  run({ args, data }) {
    const { contract, ledger, root } = data.loadPair(args);
    const review = goalReviewState(root, contract, ledger);
    return ok({
      goal_id: contract.goal_id,
      presentation: contract.presentation,
      acceptance_basis: acceptanceBasisView(contract),
      workflow_status: ledger.status,
      current_gap: review.current_gap,
      completion: review.completion,
      intervention: review.intervention,
      acceptance_review: review.acceptance_review,
      evidence_health: review.evidence_health,
      architecture: review.architecture,
      next_recommendation: review.next_recommendation,
      agent_next: review.agent_next,
      criteria: criterionStatusRows(contract, ledger, { root })
    }, [], [], review.next_recommendation.actions);
  }
});

export async function runStatusCommand(rawArgs: string[], { loadPair }: ActiveGoalRuntime) {
  return runJsonCommand(statusCommand, rawArgs, { loadPair });
}

export const evaluateCommand = defineCommand({
  meta: {
    name: "evaluate",
    description: "Recompute the current OpenNori workflow status from recorded acceptance evidence."
  },
  args: {
    ...activeGoalArgs,
    json: jsonArg
  },
  run({ args, data }) {
    const { contract, ledger, acceptancePath, evidencePath, root } = data.loadPair(args);
    const profile = readProjectProfile(root);
    recomputeWorkflowStatus(contract, ledger, profile);
    data.savePair(acceptancePath, evidencePath, contract, ledger);
    refreshManifest(root);
    return ok({
      goal_id: contract.goal_id,
      presentation: contract.presentation,
      workflow_status: ledger.status,
      current_gap: currentGap(contract, ledger, profile)
    });
  }
});

export async function runEvaluateCommand(rawArgs: string[], runtime: CommandRuntimeOverride) {
  return runJsonCommand(evaluateCommand, rawArgs, { savePair, refreshManifest, ...runtime });
}
