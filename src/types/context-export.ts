import type { AcceptanceQualityAudit } from "./acceptance.ts";
import type { AgentNext, NextRecommendation } from "./agent.ts";
import type { ArchitectureState } from "./architecture.ts";
import type { ContractLanguage, WorkflowStatus } from "./common.ts";
import type { AcceptanceBasis, CompletionAnswer, CurrentGap, UserIntervention } from "./contract.ts";
import type { CriterionStatusRow, EvidenceHealth } from "./evidence.ts";
import type { Manifest } from "./manifest.ts";
import type { CapabilityProfile, ProfileCompliance } from "./profile.ts";

export type ContextExportPair = {
  goalDir: string;
  contractPath: string;
  ledgerPath: string;
  acceptancePath: string;
  evidencePath: string;
};

export type ContextExport = {
  schema_version: "opennori/context-export-v1";
  exported_at: string;
  root: string;
  goal_id: string;
  goal: string;
  presentation?: {
    language?: ContractLanguage;
    [key: string]: unknown;
  };
  acceptance_basis: AcceptanceBasis;
  workflow_status: WorkflowStatus;
  current_gap: CurrentGap | null;
  completion: CompletionAnswer;
  intervention: UserIntervention;
  acceptance_review: AcceptanceQualityAudit;
  evidence_health: EvidenceHealth;
  next_recommendation: NextRecommendation;
  agent_next: AgentNext;
  criteria: CriterionStatusRow[];
  capability_profile: CapabilityProfile;
  capability_compliance: ProfileCompliance;
  architecture: ArchitectureState;
  paths: ContextExportPaths;
  manifest: Manifest | null;
};

export type ContextExportPaths = {
  acceptance: string;
  evidence: string;
  report: string;
  report_exists: boolean;
  manifest: string;
};
