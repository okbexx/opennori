import { defineCommand } from "citty";
import {
  addProfileEvidence,
  appendEvent,
  ok,
  readProjectProfile,
  refreshSnapshot,
  recomputeWorkflowStatus
} from "../../../core.ts";
import { goalReviewState } from "../../../lifecycle.ts";
import { activeGoalArgs, type ActiveGoalRuntime, runJsonCommand } from "../../runtime.ts";
import type { ProfileEvidenceInput } from "../../../types.ts";
import {
  jsonArg,
  profileEvidenceResult
} from "./shared.ts";

export const profileEvidenceCommand = defineCommand({
  meta: {
    name: "evidence",
    description: "Record current-goal evidence for a Project Profile item."
  },
  args: {
    ...activeGoalArgs,
    item: {
      type: "string",
      description: "Profile item id."
    },
    result: {
      type: "string",
      description: "satisfied, violated, or waived.",
      default: "satisfied"
    },
    summary: {
      type: "string",
      description: "Evidence summary.",
      default: ""
    },
    path: {
      type: "string",
      description: "Optional evidence path."
    },
    json: jsonArg
  },
  run({ args, data }) {
    const { contract, ledger, acceptancePath, evidencePath, root } = data.loadPair(args);
    const profile = readProjectProfile(root);
    const itemId = args.item;
    if (!itemId) throw new Error("--item is required");
    const evidence: ProfileEvidenceInput = {
      result: profileEvidenceResult(args.result),
      summary: args.summary || "",
      path: args.path
    };
    if (!evidence.summary) throw new Error("--summary is required");
    addProfileEvidence(profile, ledger, itemId, evidence);
    recomputeWorkflowStatus(contract, ledger, profile);
    data.savePair(acceptancePath, evidencePath, contract, ledger);
    data.refreshManifest(root);
    const review = goalReviewState(root, contract, ledger);
    appendEvent(root, {
      type: "profile.changed",
      goal_id: contract.goal_id,
      gap_id: review.current_gap?.id,
      actor: { kind: "agent", name: "Agent", skill: "nori-capability-profile" },
      summary: evidence.summary,
      data: { item_id: itemId, result: evidence.result }
    });
    refreshSnapshot(root, { goalId: contract.goal_id });
    return ok({
      goal_id: contract.goal_id,
      item: itemId,
      profile,
      compliance: review.capability_compliance,
      workflow_status: ledger.status,
      current_gap: review.current_gap,
      next_recommendation: review.next_recommendation,
      agent_next: review.agent_next
    }, [], [], review.next_recommendation.actions);
  }
});

export async function runProfileEvidenceCommand(rawArgs: string[], { loadPair, savePair, refreshManifest }: ActiveGoalRuntime) {
  return runJsonCommand(profileEvidenceCommand, rawArgs, { loadPair, savePair, refreshManifest });
}
