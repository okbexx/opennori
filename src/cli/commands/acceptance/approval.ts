import { defineCommand } from "citty";
import { architectureState } from "../../../architecture.ts";
import { agentNextForRecommendation } from "../../../agent-next.ts";
import {
  currentGap,
  appendEvent,
  nextRecommendation,
  ok,
  refreshSnapshot,
  recomputeWorkflowStatus,
  syncAcceptanceMarkdown,
  writeJson
} from "../../../core.ts";
import { refreshManifest } from "../../../lifecycle.ts";
import { activeGoalArgs, type ActiveGoalRuntime, runJsonCommand } from "../../runtime.ts";
import { jsonArg, rootArg } from "./shared.ts";

export const approveCommand = defineCommand({
  meta: {
    name: "approve",
    description: "Mark the current OpenNori acceptance criteria as user-approved."
  },
  args: {
    ...activeGoalArgs,
    summary: {
      type: "string",
      description: "Human approval summary.",
      default: "User approved acceptance criteria."
    },
    json: jsonArg
  },
  run({ args, data }) {
    const { contract, ledger, acceptancePath, evidencePath, root } = data.loadPair(args);
    contract.acceptance_basis = {
      status: "approved",
      summary: args.summary || "User approved acceptance criteria.",
      approved_at: new Date().toISOString()
    };
    recomputeWorkflowStatus(contract, ledger);
    writeJson(evidencePath, { contract, ledger });
    syncAcceptanceMarkdown(acceptancePath, contract, ledger);
    refreshManifest(root);
    const architecture = architectureState(root, contract.goal_id);
    const gap = currentGap(contract, ledger);
    const recommendation = nextRecommendation(contract, ledger, { root, architecture });
    appendEvent(root, {
      type: "contract.approved",
      goal_id: contract.goal_id,
      gap_id: gap?.id,
      actor: { kind: "agent", name: "Agent", skill: "nori-acceptance" },
      summary: String(args.summary || "User approved acceptance criteria."),
      data: { workflow_status: ledger.status }
    });
    refreshSnapshot(root, { goalId: contract.goal_id });
    return ok({
      goal_id: contract.goal_id,
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
