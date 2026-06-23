import type {
  EvidenceInput,
  EvidenceLedger,
  NoriContract
} from "../types.ts";
import { applyRiskGate } from "./evidence-risk.ts";
import { normalizeEvidence, VALID_EVIDENCE_RESULTS } from "./evidence-source.ts";
import { recomputeWorkflowStatus } from "./evidence-workflow.ts";
import { nowIso } from "./shared.ts";

export function addEvidence(contract: NoriContract, ledger: EvidenceLedger, criterionId: string, evidence: EvidenceInput): EvidenceLedger {
  const criterion = contract.criteria.find((item) => item.id === criterionId);
  if (!criterion) {
    throw new Error(`Criterion not found: ${criterionId}`);
  }
  if (!VALID_EVIDENCE_RESULTS.has(evidence.result)) {
    throw new Error(`Invalid evidence result: ${evidence.result}`);
  }

  const state = ledger.criteria[criterionId];
  if (!state) throw new Error(`Evidence ledger state not found: ${criterionId}`);
  const now = nowIso();
  const normalized = normalizeEvidence(evidence);
  const accepted = applyRiskGate(criterion, normalized);
  state.evidence.push({
    kind: normalized.kind,
    basis: normalized.basis,
    summary: normalized.summary,
    result: accepted.result,
    confidence: accepted.confidence,
    path: normalized.path,
    sources: normalized.sources,
    reviewability: normalized.reviewability,
    limitations: normalized.limitations,
    gate: accepted.gate,
    created_at: now
  });
  state.status = accepted.result;
  state.confidence = accepted.confidence;
  state.updated_at = now;
  ledger.updated_at = now;
  recomputeWorkflowStatus(contract, ledger);
  return ledger;
}
