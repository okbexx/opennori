import type { AcceptanceStatus, EvidenceBasis, EvidenceResult, RiskLevel, WorkflowStatus } from "./common.ts";
import type { AcceptanceCriterion, NoriContract } from "./contract.ts";
import type { CapabilityProfileEvidence } from "./profile.ts";

export type EvidenceSource = {
  type?: string;
  label?: string;
  command?: string;
  path?: string;
  url?: string;
  summary?: string;
  [key: string]: unknown;
};

export type EvidenceInput = {
  kind?: string;
  basis?: EvidenceBasis;
  summary?: string;
  result: EvidenceResult;
  confidence?: string;
  path?: string;
  sources?: Array<EvidenceSource | string>;
  reviewability?: string;
  limitations?: string;
  [key: string]: any;
};

export type NormalizedEvidence = Omit<EvidenceInput, "kind" | "basis" | "sources" | "reviewability" | "limitations"> & {
  kind: string;
  basis: EvidenceBasis;
  sources: EvidenceSource[];
  reviewability: string;
  limitations: string;
  result: EvidenceResult;
};

export type RiskGateResult = {
  result: EvidenceResult;
  confidence: string;
  gate: "accepted" | "downgraded_context_only_requires_product_evidence" | (string & {});
};

export type EvidenceRecord = {
  kind: string;
  basis: EvidenceBasis;
  summary?: string;
  result: EvidenceResult;
  confidence?: string;
  path?: string;
  sources?: EvidenceSource[];
  reviewability?: string;
  limitations?: string;
  gate?: string;
  created_at?: string;
  [key: string]: any;
};

export type CriterionLedgerState = {
  status: AcceptanceStatus;
  confidence: string;
  required: boolean;
  risk: RiskLevel;
  evidence: EvidenceRecord[];
  [key: string]: unknown;
};

export type EvidenceLedger = {
  protocol_version: string;
  goal_id: string;
  status: WorkflowStatus;
  updated_at: string;
  criteria: Record<string, CriterionLedgerState>;
  profile_evidence?: CapabilityProfileEvidence[];
  [key: string]: unknown;
};

export type NoriEvidencePayload = {
  contract: NoriContract;
  ledger: EvidenceLedger;
};

export type EvidenceView = {
  kind: string;
  basis: EvidenceBasis;
  summary: string;
  result: EvidenceResult | "unknown";
  confidence?: string;
  sources: EvidenceSource[];
  reviewability: string;
  limitations: string;
  path?: string;
  gate?: string;
  created_at?: string;
};

export type EvidencePruneSummary = {
  changed: boolean;
  removed_records: number;
  removed_sources: number;
  criteria?: string[];
  reason?: string;
};

export type CriterionStatusRow = {
  id: string;
  layer: string;
  user_story: string;
  status: AcceptanceStatus;
  confidence: string;
  latest_evidence: EvidenceView | null;
};

export type EvidenceHealthFinding = {
  criterion_id: string;
  severity: "review" | "needs-action" | "broken" | (string & {});
  issue: string;
  message: string;
  recovery: string;
};

export type EvidenceHealth = {
  status: "clear" | "review" | (string & {});
  summary: string;
  stale_days: number;
  findings: EvidenceHealthFinding[];
};

export type ParsedAcceptanceCriterion = AcceptanceCriterion & {
  status: AcceptanceStatus | string;
};

export type ParsedGeneratedAcceptanceReviewMarkdown = {
  schema_version: "opennori/generated-acceptance-review-markdown-v1";
  authority: "review-surface-only";
  side_effect: "none";
  generated_by: "opennori";
  source: "generated-acceptance-review-markdown";
  goal: string;
  criteria: ParsedAcceptanceCriterion[];
  warnings: string[];
};
