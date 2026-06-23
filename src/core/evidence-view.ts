import type { NoriContract } from "../types/contract.ts";
import type { CriterionStatusRow, EvidenceRecord, EvidenceView, EvidenceLedger } from "../types/evidence.ts";
import { basisForEvidenceKind, evidencePathExists, sourceIsInspectable, sourceIsStillReviewable } from "./evidence-source.ts";
import { inferCriterionLayer } from "./shared.ts";

export function evidenceView(evidence: EvidenceRecord | null | undefined, { root = process.cwd() } = {}): EvidenceView | null {
  return prunedEvidenceView(evidence, root);
}

export function criterionStatusRows(contract: NoriContract, ledger: EvidenceLedger, { root = process.cwd() } = {}): CriterionStatusRow[] {
  return contract.criteria.map((criterion) => {
    const state = ledger.criteria[criterion.id];
    return {
      id: criterion.id,
      layer: criterion.layer || inferCriterionLayer(criterion.id),
      user_story: criterion.user_story,
      status: state?.status || "unknown",
      confidence: state?.confidence || "none",
      latest_evidence: evidenceView(state?.evidence?.at(-1), { root })
    };
  });
}

function prunedEvidenceView(evidence: EvidenceRecord | null | undefined, root: string | undefined): EvidenceView | null {
  if (!evidence) return null;
  const originalSources = Array.isArray(evidence.sources) ? evidence.sources : [];
  const sources = originalSources.filter((source) => sourceIsStillReviewable(source, root));
  const evidencePath = evidence.path && evidencePathExists(root, evidence.path) ? evidence.path : undefined;
  const hadLocalPath = Boolean(evidence.path) || originalSources.some((source) => Boolean(source.path));
  const hasInspectableAfterPrune = sources.some((source) => sourceIsInspectable(source)) || Boolean(evidencePath);
  if (hadLocalPath && !hasInspectableAfterPrune) return null;

  const kind = evidence.kind || "manual";
  const basis = evidence.basis || basisForEvidenceKind(kind) || "agent-observation";
  return {
    kind,
    basis,
    summary: evidence.summary || "<none>",
    result: evidence.result || "unknown",
    confidence: evidence.confidence,
    sources,
    reviewability: evidence.reviewability || (sources.length > 0 || evidencePath ? "source-provided" : "summary-only"),
    limitations: evidence.limitations || "",
    path: evidencePath,
    gate: evidence.gate,
    created_at: evidence.created_at
  };
}
