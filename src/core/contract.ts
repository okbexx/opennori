import type {
  AcceptanceCriterion,
  EvidenceLedger,
  NoriBrief,
  NoriContract,
  ValidationIssue
} from "../types.ts";
import { contractLanguageFromBrief } from "../language.ts";
import { inferCriterionLayer, nowIso, slugify, PROTOCOL_VERSION } from "./shared.ts";

export const VALID_STATUSES = new Set(["unknown", "failing", "passing", "blocked", "waived"]);

export function buildContractFromBrief(brief: NoriBrief): NoriContract {
  const goal = String(brief.goal || "").trim();
  const goalId = slugify(brief.goal_id || goal.slice(0, 60));
  const criteria: AcceptanceCriterion[] = (brief.criteria || []).map((criterion, index) => ({
    id: String(criterion.id || `AC-${index + 1}`),
    layer: String(criterion.layer || inferCriterionLayer(criterion.id || `AC-${index + 1}`)),
    user_story: String(criterion.user_story || "").trim(),
    measurement: String(criterion.measurement || "").trim(),
    threshold: String(criterion.threshold || "").trim(),
    required: criterion.required !== false,
    risk: criterion.risk || "medium"
  }));

  return {
    protocol_version: PROTOCOL_VERSION,
    goal_id: goalId,
    goal,
    created_at: nowIso(),
    presentation: {
      ...(brief.presentation || {}),
      language: contractLanguageFromBrief(brief)
    },
    acceptance_basis: brief.acceptance_basis || { status: "draft" },
    criteria
  };
}

export function buildEvidenceLedger(contract: NoriContract): EvidenceLedger {
  const criteria: EvidenceLedger["criteria"] = {};
  const now = nowIso();
  for (const criterion of contract.criteria) {
    criteria[criterion.id] = {
      status: "unknown",
      confidence: "none",
      required: criterion.required !== false,
      risk: criterion.risk || "medium",
      evidence: [],
      updated_at: now
    };
  }

  return {
    protocol_version: PROTOCOL_VERSION,
    goal_id: contract.goal_id,
    status: contract.acceptance_basis?.status === "approved" ? "active" : "draft",
    updated_at: now,
    criteria
  };
}

export function validateContractIntegrity(contract: NoriContract, ledger: EvidenceLedger | null = null): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (contract.protocol_version !== PROTOCOL_VERSION) {
    issues.push({ path: "protocol_version", message: `Must be ${PROTOCOL_VERSION}` });
  }
  if (!contract.goal) {
    issues.push({ path: "goal", message: "Goal is required" });
  }
  if (!Array.isArray(contract.criteria) || contract.criteria.length === 0) {
    issues.push({ path: "criteria", message: "At least one user acceptance criterion is required" });
    return issues;
  }

  const ids = new Set<string>();
  contract.criteria.forEach((criterion, index) => {
    const prefix = `criteria[${index}]`;
    if (!criterion.id) {
      issues.push({ path: `${prefix}.id`, message: "Criterion id is required" });
    } else if (ids.has(criterion.id)) {
      issues.push({ path: `${prefix}.id`, message: `Duplicate criterion id: ${criterion.id}` });
    }
    ids.add(criterion.id);

    for (const field of ["user_story", "measurement", "threshold"]) {
      if (!criterion[field]) {
        issues.push({ path: `${prefix}.${field}`, message: `${field} is required` });
      }
    }

    if (ledger && !ledger.criteria?.[criterion.id]) {
      issues.push({ path: `ledger.criteria.${criterion.id}`, message: "Evidence ledger is missing this criterion" });
    }
  });

  if (ledger) {
    if (ledger.protocol_version !== PROTOCOL_VERSION) {
      issues.push({ path: "ledger.protocol_version", message: `Must be ${PROTOCOL_VERSION}` });
    }
    if (!ledger.criteria || typeof ledger.criteria !== "object" || Array.isArray(ledger.criteria)) {
      issues.push({ path: "ledger.criteria", message: "Evidence ledger criteria object is required" });
      return issues;
    }
    for (const [criterionId, state] of Object.entries(ledger.criteria || {})) {
      if (!ids.has(criterionId)) {
        issues.push({ path: `ledger.criteria.${criterionId}`, message: "Evidence ledger has an unknown criterion" });
      }
      if (!VALID_STATUSES.has(state.status)) {
        issues.push({ path: `ledger.criteria.${criterionId}.status`, message: `Invalid status: ${state.status}` });
      }
    }
  }

  return issues;
}

export const validateContract = validateContractIntegrity;
