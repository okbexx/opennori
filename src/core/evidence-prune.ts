import type {
  AcceptanceStatus,
  EvidenceLedger,
  EvidencePruneSummary,
  EvidenceRecord,
  NoriContract
} from "../types.ts";
import { confidenceForEvidence } from "./evidence-risk.ts";
import { evidencePathExists, sourceIsStillReviewable } from "./evidence-source.ts";
import { evidenceView } from "./evidence-view.ts";
import { recomputeWorkflowStatus } from "./evidence-workflow.ts";
import { nowIso } from "./shared.ts";

export function pruneInvalidEvidence(contract: NoriContract, ledger: EvidenceLedger, { root = process.cwd() } = {}): EvidencePruneSummary {
  let changed = false;
  let removedRecords = 0;
  let removedSources = 0;

  for (const criterion of contract.criteria || []) {
    const state = ledger.criteria?.[criterion.id];
    if (!state || !Array.isArray(state.evidence)) continue;
    let criterionChanged = false;
    const nextEvidence: EvidenceRecord[] = [];
    for (const evidence of state.evidence) {
      const originalSources = Array.isArray(evidence.sources) ? evidence.sources : [];
      const sources = originalSources.filter((source) => sourceIsStillReviewable(source, root));
      const pathStillExists = evidence.path ? evidencePathExists(root, evidence.path) : true;
      const pathRemoved = Boolean(evidence.path && !pathStillExists);
      const removedForRecord = originalSources.length - sources.length + (pathRemoved ? 1 : 0);
      removedSources += removedForRecord;
      const view = evidenceView(evidence, { root });
      if (!view) {
        changed = true;
        criterionChanged = true;
        removedRecords += 1;
        continue;
      }
      const nextRecord: EvidenceRecord = {
        ...evidence,
        path: pathStillExists ? evidence.path : undefined,
        sources
      };
      if (removedForRecord > 0) {
        changed = true;
        criterionChanged = true;
      }
      nextEvidence.push(nextRecord);
    }

    if (nextEvidence.length !== state.evidence.length) {
      changed = true;
      criterionChanged = true;
    }
    state.evidence = nextEvidence;
    const latest = nextEvidence.at(-1);
    if (latest) {
      const nextStatus = latest.result as AcceptanceStatus;
      const nextConfidence = latest.confidence || confidenceForEvidence(criterion.risk, latest.result);
      if (state.status !== nextStatus || state.confidence !== nextConfidence) criterionChanged = true;
      state.status = nextStatus;
      state.confidence = nextConfidence;
    } else {
      if (state.status !== "unknown" || state.confidence !== "none") {
        changed = true;
        criterionChanged = true;
      }
      state.status = "unknown";
      state.confidence = "none";
    }
    if (criterionChanged) state.updated_at = nowIso();
  }

  if (changed) {
    ledger.updated_at = nowIso();
    recomputeWorkflowStatus(contract, ledger);
  }

  return {
    changed,
    removed_records: removedRecords,
    removed_sources: removedSources
  };
}

export function pruneCriterionEvidence(
  contract: NoriContract,
  ledger: EvidenceLedger,
  criterionId: string,
  { reason = "Evidence no longer proves the current acceptance criterion." } = {}
): EvidencePruneSummary {
  const criterion = contract.criteria.find((item) => item.id === criterionId);
  if (!criterion) throw new Error(`Criterion not found: ${criterionId}`);
  const state = ledger.criteria?.[criterionId];
  if (!state) throw new Error(`Evidence ledger state not found: ${criterionId}`);
  const removedRecords = Array.isArray(state.evidence) ? state.evidence.length : 0;
  const changed = removedRecords > 0 || state.status !== "unknown" || state.confidence !== "none";
  state.status = "unknown";
  state.confidence = "none";
  state.required = criterion.required !== false;
  state.risk = criterion.risk || "medium";
  state.evidence = [];
  const now = nowIso();
  state.updated_at = now;
  ledger.updated_at = now;
  recomputeWorkflowStatus(contract, ledger);
  return {
    changed,
    removed_records: removedRecords,
    removed_sources: 0,
    criteria: [criterionId],
    reason
  };
}
