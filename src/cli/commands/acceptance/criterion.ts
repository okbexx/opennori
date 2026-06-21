import { defineCommand } from "citty";
import {
  currentGap,
  inferCriterionLayer,
  ok,
  readProjectProfile,
  recomputeWorkflowStatus,
  validateContract
} from "../../../core.ts";
import { refreshManifest } from "../../../lifecycle.ts";
import { activeGoalArgs, type ActiveGoalRuntime, runJsonCommand, savePair } from "../../runtime.ts";
import type { AcceptanceBasis, AcceptanceCriterion } from "../../../types.ts";
import { jsonArg, rootArg } from "./shared.ts";

type CommandRuntimeOverride = Pick<ActiveGoalRuntime, "loadPair"> & Partial<Pick<ActiveGoalRuntime, "savePair" | "refreshManifest">>;

function revisedAcceptanceBasis(pairLocation: string, existing: AcceptanceBasis | undefined, summary: unknown, fallbackSummary: string): AcceptanceBasis {
  const summaryText = String(summary || fallbackSummary);
  if (pairLocation === "drafts") {
    const { approved_at: _approvedAt, ...basis } = existing || {};
    return {
      ...basis,
      status: "draft",
      summary: summaryText
    };
  }
  return {
    ...(existing || {}),
    status: "approved",
    summary: summaryText,
    approved_at: new Date().toISOString()
  };
}

export const criterionAddCommand = defineCommand({
  meta: {
    name: "criterion-add",
    description: "Add a user acceptance criterion to a current or draft OpenNori contract."
  },
  args: {
    ...activeGoalArgs,
    id: {
      type: "string",
      description: "New criterion id."
    },
    userStory: {
      type: "string",
      description: "Human-facing user story."
    },
    measurement: {
      type: "string",
      description: "How the user or reviewer measures this criterion."
    },
    threshold: {
      type: "string",
      description: "Passing threshold."
    },
    risk: {
      type: "string",
      description: "Risk level.",
      default: "medium"
    },
    required: {
      type: "boolean",
      description: "Whether this criterion is required.",
      default: true
    },
    layer: {
      type: "string",
      description: "Optional criterion layer such as protocol, operator, productization, architecture, or acceptance."
    },
    summary: {
      type: "string",
      description: "Human revision summary."
    },
    json: jsonArg
  },
  run({ args, data }) {
    const { contract, ledger, acceptancePath, evidencePath, root, location } = data.loadPair(args);
    const criterionId = String(args.id || "").trim();
    if (!criterionId) throw new Error("--id is required");
    if (contract.criteria.some((item: AcceptanceCriterion) => item.id === criterionId)) {
      throw new Error(`Criterion already exists: ${criterionId}`);
    }

    const criterion: AcceptanceCriterion = {
      id: criterionId,
      layer: args.layer ? String(args.layer) : inferCriterionLayer(criterionId),
      user_story: String(args.userStory || "").trim(),
      measurement: String(args.measurement || "").trim(),
      threshold: String(args.threshold || "").trim(),
      required: args.required !== false,
      risk: String(args.risk || "medium")
    };
    contract.criteria.push(criterion);
    ledger.criteria[criterionId] = {
      status: "unknown",
      confidence: "none",
      required: criterion.required !== false,
      risk: criterion.risk || "medium",
      evidence: []
    };
    contract.acceptance_basis = revisedAcceptanceBasis(location, contract.acceptance_basis, args.summary, `User added ${criterionId}.`);

    const issues = validateContract(contract, ledger);
    if (issues.length > 0) {
      contract.criteria = contract.criteria.filter((item: AcceptanceCriterion) => item.id !== criterionId);
      delete ledger.criteria[criterionId];
      return {
        ok: false,
        error: {
          type: "invalid_acceptance",
          message: "New criterion failed validation",
          fix: "Provide id, user story, measurement, and threshold"
        },
        issues
      };
    }

    const profile = readProjectProfile(root);
    recomputeWorkflowStatus(contract, ledger, profile);
    data.savePair(acceptancePath, evidencePath, contract, ledger);
    refreshManifest(root);
    return ok({
      goal_id: contract.goal_id,
      criterion,
      acceptance_basis: contract.acceptance_basis,
      workflow_status: ledger.status,
      current_gap: currentGap(contract, ledger, profile)
    });
  }
});

export const criterionUpdateCommand = defineCommand({
  meta: {
    name: "criterion-update",
    description: "Update a user acceptance criterion and clear stale evidence when the criterion changes."
  },
  args: {
    ...activeGoalArgs,
    criterion: {
      type: "string",
      description: "Criterion id to update."
    },
    userStory: {
      type: "string",
      description: "Updated human-facing user story."
    },
    measurement: {
      type: "string",
      description: "Updated measurement."
    },
    threshold: {
      type: "string",
      description: "Updated passing threshold."
    },
    risk: {
      type: "string",
      description: "Updated risk level."
    },
    summary: {
      type: "string",
      description: "Human revision summary."
    },
    json: jsonArg
  },
  run({ args, data }) {
    const { contract, ledger, acceptancePath, evidencePath, root, location } = data.loadPair(args);
    const criterionId = args.criterion;
    if (!criterionId) throw new Error("--criterion is required");
    const criterion = contract.criteria.find((item: AcceptanceCriterion) => item.id === criterionId);
    if (!criterion) throw new Error(`Criterion not found: ${criterionId}`);

    const before = {
      user_story: criterion.user_story,
      measurement: criterion.measurement,
      threshold: criterion.threshold,
      risk: criterion.risk
    };
    criterion.user_story = args.userStory || criterion.user_story;
    criterion.measurement = args.measurement || criterion.measurement;
    criterion.threshold = args.threshold || criterion.threshold;
    criterion.risk = args.risk || criterion.risk;
    const changed = (
      before.user_story !== criterion.user_story ||
      before.measurement !== criterion.measurement ||
      before.threshold !== criterion.threshold ||
      before.risk !== criterion.risk
    );
    if (changed && ledger.criteria[criterionId]) {
      ledger.criteria[criterionId] = {
        status: "unknown",
        confidence: "none",
        required: criterion.required !== false,
        risk: criterion.risk || "medium",
        evidence: []
      };
    }
    contract.acceptance_basis = revisedAcceptanceBasis(location, contract.acceptance_basis, args.summary, `User revised ${criterionId}.`);
    const issues = validateContract(contract, ledger);
    if (issues.length > 0) {
      return {
        ok: false,
        error: {
          type: "invalid_acceptance",
          message: "Updated criterion failed validation",
          fix: "Provide id, user story, measurement, threshold, and matching ledger structure"
        },
        issues
      };
    }

    const profile = readProjectProfile(root);
    recomputeWorkflowStatus(contract, ledger, profile);
    data.savePair(acceptancePath, evidencePath, contract, ledger);
    refreshManifest(root);
    return ok({
      goal_id: contract.goal_id,
      criterion,
      acceptance_basis: contract.acceptance_basis,
      workflow_status: ledger.status,
      current_gap: currentGap(contract, ledger, profile)
    });
  }
});

export async function runCriterionUpdateCommand(rawArgs: string[], runtime: CommandRuntimeOverride) {
  return runJsonCommand(criterionUpdateCommand, rawArgs, { savePair, refreshManifest, ...runtime });
}

export async function runCriterionAddCommand(rawArgs: string[], runtime: CommandRuntimeOverride) {
  return runJsonCommand(criterionAddCommand, rawArgs, { savePair, refreshManifest, ...runtime });
}
