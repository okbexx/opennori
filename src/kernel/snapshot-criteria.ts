import type { AcceptanceCriterion } from "../types/contract.ts";
import type { EvidenceLedger } from "../types/evidence.ts";
import { criterionDossier, type SnapshotGoalPair } from "./snapshot-paths.ts";

export function latestEvidenceSummary(ledger: EvidenceLedger, gapId?: string): string {
  if (!gapId) return "";
  const state = ledger.criteria?.[gapId];
  const latest = state?.evidence?.at(-1);
  return latest?.summary || "";
}

export function snapshotCriteria(root: string, pair: SnapshotGoalPair, input: {
  criteria: AcceptanceCriterion[];
  ledger: EvidenceLedger;
}) {
  return input.criteria.map((criterion) => {
    const ledgerState = input.ledger.criteria?.[criterion.id];
    return {
      id: criterion.id,
      layer: criterion.layer,
      user_story: criterion.user_story,
      measurement: criterion.measurement,
      threshold: criterion.threshold,
      required: criterion.required,
      status: ledgerState?.status || criterion.status || "unknown",
      confidence: ledgerState?.confidence || "unknown",
      evidence: ledgerState?.evidence || [],
      dossier: criterionDossier(root, pair, criterion.id)
    };
  });
}
