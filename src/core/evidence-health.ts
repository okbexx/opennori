import type { NoriContract } from "../types/contract.ts";
import type { EvidenceHealth, EvidenceHealthFinding, EvidenceLedger, EvidenceRecord } from "../types/evidence.ts";
import { EVIDENCE_HEALTH_STALE_DAYS, evidencePathExists, sourceIsProductEvidence } from "./evidence-source.ts";
import { evidenceView } from "./evidence-view.ts";

function evidenceAgeDays(evidence: EvidenceRecord | null | undefined, now = Date.now()): number | null {
  if (!evidence?.created_at) return null;
  const timestamp = Date.parse(evidence.created_at);
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, Math.floor((now - timestamp) / 86400000));
}

function evidenceHasReviewableSource(evidence: EvidenceRecord | null | undefined): boolean {
  const sources = Array.isArray(evidence?.sources) ? evidence.sources : [];
  return sources.some((source) => sourceIsProductEvidence(source)) || Boolean(evidence?.path);
}

function evidenceHasReviewability(evidence: EvidenceRecord | null | undefined): boolean {
  const value = String(evidence?.reviewability || "").trim();
  return value.length > 0 && value !== "summary-only";
}

export function evidenceHealth(contract: NoriContract, ledger: EvidenceLedger, { now = Date.now(), staleDays = EVIDENCE_HEALTH_STALE_DAYS, root = process.cwd() } = {}): EvidenceHealth {
  const findings: EvidenceHealthFinding[] = [];
  for (const criterion of contract.criteria || []) {
    if (criterion.required === false) continue;
    const state = ledger.criteria?.[criterion.id];
    const latest = state?.evidence?.at(-1);
    if (!state || !["passing", "waived"].includes(state.status)) continue;
    if (!latest) continue;

    const ageDays = evidenceAgeDays(latest, now);
    if (ageDays === null) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "missing-evidence-date",
        message: "Latest passing evidence has no created_at timestamp.",
        recovery: "Record fresh evidence with a timestamp before relying on completion."
      });
    } else if (ageDays > staleDays) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "stale-evidence",
        message: `Latest passing evidence is ${ageDays} days old.`,
        recovery: "Refresh the evidence if the changed code, docs, website, package, or project state has moved since then."
      });
    }

    const missingSources = [
      ...(latest.path && !evidencePathExists(root, latest.path) ? [latest.path] : []),
      ...(Array.isArray(latest.sources) ? latest.sources
        .filter((source) => (source.type === "artifact" || source.path) && source.path && !evidencePathExists(root, source.path))
        .map((source) => source.path || source.label || "<unknown>") : [])
    ];
    for (const missing of missingSources) {
      findings.push({
        criterion_id: criterion.id,
        severity: "broken",
        issue: "missing-evidence-source",
        message: `Latest passing evidence references a missing local artifact: ${missing}.`,
        recovery: "Remove the stale evidence source and record fresh reviewable evidence."
      });
    }

    if (!evidenceHasReviewableSource(latest) || !evidenceView(latest, { root })) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "missing-reviewable-source",
        message: "Latest passing evidence has no command, artifact, URL, or path source.",
        recovery: "Add a source that a human or review tool can inspect."
      });
    }

    if (!evidenceHasReviewability(latest)) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "missing-reviewability",
        message: "Latest passing evidence does not explain how to review it.",
        recovery: "Add a short reviewability note."
      });
    }

    if (!String(latest.limitations || "").trim()) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "missing-limitations",
        message: "Latest passing evidence has no stated limitations.",
        recovery: "State what the evidence does not prove."
      });
    }

    if (criterion.risk === "high" && latest.result === "passing" && latest.basis === "agent-observation") {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "high-risk-agent-observation",
        message: "Latest high-risk passing evidence is based on agent observation.",
        recovery: "Review whether this needs a tool-observation, artifact-review, human-confirmation, explicit limitation, or user-approved waiver before claiming confident completion."
      });
    }
  }

  return {
    status: findings.length === 0 ? "clear" : "review",
    summary: findings.length === 0
      ? "Latest evidence is reviewable enough for the current contract."
      : `${findings.length} evidence health finding(s) need review.`,
    stale_days: staleDays,
    findings
  };
}
