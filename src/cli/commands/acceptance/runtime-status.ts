import { defineCommand } from "citty";
import { reviewAcceptanceQuality } from "../../../acceptance.ts";
import { architectureState } from "../../../architecture.ts";
import { agentNextForRecommendation } from "../../../agent-next.ts";
import {
  completionAnswer,
  acceptanceBasisView,
  criterionStatusRows,
  currentGap,
  evidenceHealth,
  interventionForProfile,
  nextRecommendation,
  ok,
  readProjectProfile,
  recomputeWorkflowStatus
} from "../../../core.ts";
import { refreshManifest } from "../../../lifecycle.ts";
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
    const architecture = architectureState(root, contract.goal_id);
    const profile = readProjectProfile(root);
    const gap = currentGap(contract, ledger, profile);
    const recommendation = nextRecommendation(contract, ledger, { root, architecture, profile });
    return ok({
      goal_id: contract.goal_id,
      presentation: contract.presentation,
      current_gap: gap,
      complete: gap === null,
      next_recommendation: recommendation,
      agent_next: agentNextForRecommendation(contract.goal_id, gap, recommendation)
    }, [], [], recommendation.actions);
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
    const architecture = architectureState(root, contract.goal_id);
    const profile = readProjectProfile(root);
    const gap = currentGap(contract, ledger, profile);
    const recommendation = nextRecommendation(contract, ledger, { root, architecture, profile });
    return ok({
      goal_id: contract.goal_id,
      presentation: contract.presentation,
      acceptance_basis: acceptanceBasisView(contract),
      workflow_status: ledger.status,
      current_gap: gap,
      completion: completionAnswer(contract, ledger, { root, architecture, profile }),
      intervention: interventionForProfile(contract, ledger, profile),
      acceptance_review: reviewAcceptanceQuality(contract),
      evidence_health: evidenceHealth(contract, ledger, { root }),
      architecture,
      next_recommendation: recommendation,
      agent_next: agentNextForRecommendation(contract.goal_id, gap, recommendation),
      acceptance_path: acceptancePath,
      evidence_path: evidencePath
    }, [], [], recommendation.actions);
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
    const architecture = architectureState(root, contract.goal_id);
    const profile = readProjectProfile(root);
    const gap = currentGap(contract, ledger, profile);
    const recommendation = nextRecommendation(contract, ledger, { root, architecture, profile });
    return ok({
      goal_id: contract.goal_id,
      presentation: contract.presentation,
      acceptance_basis: acceptanceBasisView(contract),
      workflow_status: ledger.status,
      current_gap: gap,
      completion: completionAnswer(contract, ledger, { root, architecture, profile }),
      intervention: interventionForProfile(contract, ledger, profile),
      acceptance_review: reviewAcceptanceQuality(contract),
      evidence_health: evidenceHealth(contract, ledger, { root }),
      architecture,
      next_recommendation: recommendation,
      agent_next: agentNextForRecommendation(contract.goal_id, gap, recommendation),
      criteria: criterionStatusRows(contract, ledger, { root })
    }, [], [], recommendation.actions);
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
