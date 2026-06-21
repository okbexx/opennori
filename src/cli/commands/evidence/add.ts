import { defineCommand } from "citty";
import { architectureState } from "../../../architecture.ts";
import { agentNextForRecommendation } from "../../../agent-next.ts";
import {
  addEvidence,
  appendEvent,
  criterionStatusRows,
  currentGap,
  nextRecommendation,
  ok,
  pruneInvalidEvidence,
  readProjectProfile,
  refreshSnapshot,
  recomputeWorkflowStatus,
} from "../../../core.ts";
import { refreshManifest } from "../../../lifecycle.ts";
import { activeGoalArgs, type ActiveGoalRuntime, runJsonCommand, savePair } from "../../runtime.ts";
import type { EvidenceBasis, EvidenceInput } from "../../../types.ts";
import { evidenceResult, evidenceSourcesFromArgs } from "./source-parsing.ts";

type CommandRuntimeOverride = Pick<ActiveGoalRuntime, "loadPair"> & Partial<Pick<ActiveGoalRuntime, "savePair" | "refreshManifest">>;

export const evidenceAddCommand = defineCommand({
  meta: {
    name: "add",
    description: "Record reviewable evidence for an OpenNori acceptance criterion."
  },
  args: {
    ...activeGoalArgs,
    criterion: {
      type: "string",
      description: "Criterion id."
    },
    kind: {
      type: "string",
      description: "Evidence kind.",
      default: "manual"
    },
    basis: {
      type: "string",
      description: "Evidence basis."
    },
    summary: {
      type: "string",
      description: "Human-readable evidence summary.",
      default: ""
    },
    result: {
      type: "string",
      description: "passing, failing, blocked, or waived.",
      default: "passing"
    },
    confidence: {
      type: "string",
      description: "Evidence confidence."
    },
    path: {
      type: "string",
      description: "Optional artifact path."
    },
    source: {
      type: "string",
      description: "Raw evidence source, repeatable."
    },
    sourceCommand: {
      type: "string",
      description: "Command source, repeatable."
    },
    sourcePath: {
      type: "string",
      description: "Artifact source path, repeatable."
    },
    sourceUrl: {
      type: "string",
      description: "URL source, repeatable."
    },
    architectureApply: {
      type: "string",
      description: "Architecture apply record id or path to attach as context, repeatable."
    },
    reviewability: {
      type: "string",
      description: "How a user can review this evidence."
    },
    limitations: {
      type: "string",
      description: "Known evidence limitations."
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args, data }) {
    const { contract, ledger, acceptancePath, evidencePath, root } = data.loadPair(args);
    const profile = readProjectProfile(root);
    const criterionId = args.criterion;
    if (!criterionId) throw new Error("--criterion is required");
    const sources = evidenceSourcesFromArgs(args, data.rawArgs || []);
    const evidence: EvidenceInput = {
      kind: args.kind || "manual",
      basis: args.basis as EvidenceBasis | undefined,
      summary: args.summary || "",
      result: evidenceResult(args.result),
      confidence: args.confidence,
      path: args.path,
      sources,
      reviewability: args.reviewability,
      limitations: args.limitations
    };
    if (!evidence.summary) throw new Error("--summary is required");
    addEvidence(contract, ledger, criterionId, evidence);
    pruneInvalidEvidence(contract, ledger, { root });
    recomputeWorkflowStatus(contract, ledger, profile);
    data.savePair(acceptancePath, evidencePath, contract, ledger);
    refreshManifest(root);
    const architecture = architectureState(root, contract.goal_id);
    const gap = currentGap(contract, ledger, profile);
    const recommendation = nextRecommendation(contract, ledger, { root, architecture, profile });
    appendEvent(root, {
      type: "evidence.added",
      goal_id: contract.goal_id,
      gap_id: criterionId,
      actor: { kind: "agent", name: "Agent", skill: "nori-evidence" },
      summary: evidence.summary,
      data: {
        result: ledger.criteria[criterionId].status,
        confidence: ledger.criteria[criterionId].confidence,
        gate: ledger.criteria[criterionId].evidence.at(-1)?.gate
      }
    });
    refreshSnapshot(root, { goalId: contract.goal_id });
    return ok({
      goal_id: contract.goal_id,
      presentation: contract.presentation,
      criterion: criterionId,
      criterion_status: ledger.criteria[criterionId].status,
      confidence: ledger.criteria[criterionId].confidence,
      latest_evidence: criterionStatusRows(contract, ledger, { root }).find((row) => row.id === criterionId)?.latest_evidence,
      gate: ledger.criteria[criterionId].evidence.at(-1)?.gate,
      workflow_status: ledger.status,
      current_gap: gap,
      next_recommendation: recommendation,
      agent_next: agentNextForRecommendation(contract.goal_id, gap, recommendation)
    }, [], [], recommendation.actions);
  }
});

export async function runEvidenceAddCommand(rawArgs: string[], runtime: CommandRuntimeOverride) {
  return runJsonCommand(evidenceAddCommand, rawArgs, { savePair, refreshManifest, ...runtime, rawArgs });
}
