import { defineCommand } from "citty";
import {
  addProfileEvidence,
  appendEvent,
  currentGap,
  ok,
  profileCompliance,
  refreshSnapshot,
  recomputeWorkflowStatus
} from "../../../core.ts";
import { activeGoalArgs, type ActiveGoalRuntime, runJsonCommand } from "../../runtime.ts";
import type { ProfileEvidenceInput } from "../../../types.ts";
import {
  jsonArg,
  profileEvidenceResult
} from "./shared.ts";

export const profileEvidenceCommand = defineCommand({
  meta: {
    name: "evidence",
    description: "Record evidence for a Nori Profile item."
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
    const itemId = args.item;
    if (!itemId) throw new Error("--item is required");
    const evidence: ProfileEvidenceInput = {
      result: profileEvidenceResult(args.result),
      summary: args.summary || "",
      path: args.path
    };
    if (!evidence.summary) throw new Error("--summary is required");
    addProfileEvidence(ledger, itemId, evidence);
    recomputeWorkflowStatus(contract, ledger);
    data.savePair(acceptancePath, evidencePath, contract, ledger);
    data.refreshManifest(root);
    appendEvent(root, {
      type: "profile.changed",
      goal_id: contract.goal_id,
      gap_id: currentGap(contract, ledger)?.id,
      actor: { kind: "agent", name: "Agent", skill: "nori-capability-profile" },
      summary: evidence.summary,
      data: { item_id: itemId, result: evidence.result }
    });
    refreshSnapshot(root, { goalId: contract.goal_id });
    return ok({
      goal_id: contract.goal_id,
      item: itemId,
      compliance: profileCompliance(ledger),
      workflow_status: ledger.status,
      current_gap: currentGap(contract, ledger)
    });
  }
});

export async function runProfileEvidenceCommand(rawArgs: string[], { loadPair, savePair, refreshManifest }: ActiveGoalRuntime) {
  return runJsonCommand(profileEvidenceCommand, rawArgs, { loadPair, savePair, refreshManifest });
}
