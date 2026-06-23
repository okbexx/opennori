import type { EvidenceResult, RiskLevel } from "../types/common.ts";
import type { AcceptanceCriterion } from "../types/contract.ts";
import type { NormalizedEvidence, RiskGateResult } from "../types/evidence.ts";
import { sourceIsContext } from "./evidence-source.ts";

export function applyRiskGate(criterion: AcceptanceCriterion, evidence: NormalizedEvidence): RiskGateResult {
  const requestedResult = evidence.result;
  const confidence = evidence.confidence || confidenceForEvidence(criterion.risk, requestedResult);
  const contextOnly = evidence.sources.length > 0
    && evidence.sources.every((source) => sourceIsContext(source));
  if (
    requestedResult === "passing"
    && contextOnly
    && evidence.kind !== "human-confirmation"
    && evidence.basis !== "human-confirmation"
  ) {
    return {
      result: "failing",
      confidence: "product-evidence-required",
      gate: "downgraded_context_only_requires_product_evidence"
    };
  }
  return { result: requestedResult, confidence, gate: "accepted" };
}

export function confidenceForEvidence(risk: RiskLevel | undefined, result: EvidenceResult): string {
  if (result !== "passing") return "evidence";
  if (risk === "low") return "agent";
  if (risk === "medium") return "verified";
  if (risk === "high") return "review-required";
  return "human-required";
}
