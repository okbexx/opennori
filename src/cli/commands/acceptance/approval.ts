import { defineCommand } from "citty";
import fs from "node:fs";
import { architectureState } from "../../../architecture.ts";
import { agentNextForRecommendation } from "../../../agent-next.ts";
import {
  currentGap,
  appendEvent,
  fail,
  findCurrentPairs,
  pathsForGoal,
  nextRecommendation,
  ok,
  readProjectProfile,
  refreshSnapshot,
  recomputeWorkflowStatus,
  writeGoalDossier
} from "../../../core.ts";
import { refreshManifest } from "../../../lifecycle.ts";
import { withContractLanguage } from "../../../language.ts";
import { activeGoalArgs, type ActiveGoalRuntime, runJsonCommand } from "../../runtime.ts";
import { jsonArg, rootArg } from "./shared.ts";

export const approveCommand = defineCommand({
  meta: {
    name: "approve",
    description: "Promote a draft Nori Contract to the current user-approved goal."
  },
  args: {
    ...activeGoalArgs,
    fromDraft: {
      type: "boolean",
      description: "Approve a draft contract into the current goal.",
      default: true
    },
    summary: {
      type: "string",
      description: "Human approval summary.",
      default: "User approved acceptance criteria."
    },
    language: {
      type: "string",
      description: "Explicitly approved human-readable Contract language, such as zh-CN or en."
    },
    json: jsonArg
  },
  run({ args, data }) {
    const pair = data.loadPair({ ...args, fromDraft: args.fromDraft !== false });
    const { contract, ledger, root } = pair;
    const currentPairs = findCurrentPairs(root);
    const existingCurrent = currentPairs.find((item) => item.goalId !== contract.goal_id);
    if (existingCurrent) {
      return fail(
        "current_goal_exists",
        `OpenNori already has a current goal: ${existingCurrent.goalId}`,
        "Archive the current goal after completion/blocking, or explicitly choose a different project before approving this draft."
      );
    }
    const targetPaths = pair.location === "current"
      ? pathsForGoal(root, contract.goal_id, "current")
      : pathsForGoal(root, contract.goal_id, "current");
    contract.acceptance_basis = {
      status: "approved",
      summary: args.summary || "User approved acceptance criteria.",
      approved_at: new Date().toISOString()
    };
    if (args.language) {
      contract.presentation = withContractLanguage(contract, String(args.language)).presentation;
    }
    const profile = readProjectProfile(root);
    recomputeWorkflowStatus(contract, ledger, profile);
    writeGoalDossier(targetPaths.goalDir, contract, ledger);
    if (pair.location === "drafts") {
      fs.rmSync(pair.goalDir, { recursive: true, force: true });
    }
    refreshManifest(root);
    const architecture = architectureState(root, contract.goal_id);
    const gap = currentGap(contract, ledger, profile);
    const recommendation = nextRecommendation(contract, ledger, { root, architecture, profile });
    appendEvent(root, {
      type: "contract.approved",
      goal_id: contract.goal_id,
      gap_id: gap?.id,
      actor: { kind: "agent", name: "Agent", skill: "nori-acceptance" },
      summary: String(args.summary || "User approved acceptance criteria."),
      data: {
        workflow_status: ledger.status,
        promoted_from: pair.location,
        acceptance_path: targetPaths.acceptancePath,
        evidence_path: targetPaths.evidencePath
      }
    });
    refreshSnapshot(root, { goalId: contract.goal_id });
    return ok({
      goal_id: contract.goal_id,
      presentation: contract.presentation,
      state: "current",
      acceptance_path: targetPaths.acceptancePath,
      evidence_path: targetPaths.evidencePath,
      acceptance_basis: contract.acceptance_basis,
      workflow_status: ledger.status,
      current_gap: gap,
      architecture,
      next_recommendation: recommendation,
      agent_next: agentNextForRecommendation(contract.goal_id, gap, recommendation)
    }, [], [], recommendation.actions);
  }
});

export async function runApproveCommand(rawArgs: string[], { loadPair }: ActiveGoalRuntime) {
  return runJsonCommand(approveCommand, rawArgs, { loadPair });
}
