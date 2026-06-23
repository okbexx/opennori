import { agentNextForRecommendation } from "../agent-next.ts";
import { reviewAcceptanceQuality } from "../acceptance.ts";
import { architectureState } from "../architecture.ts";
import {
  completionAnswer,
  criterionStatusRows,
  currentGap,
  evidenceHealth,
  interventionForProfile,
  nextRecommendation,
  profileCompliance,
  readGoalPayload,
  readProjectProfile
} from "../core.ts";
import type {
  AcceptanceQualityAudit,
  AgentNext,
  ArchitectureState,
  CapabilityProfile,
  CompletionAnswer,
  ContextExportPair,
  CriterionStatusRow,
  CurrentGap,
  EvidenceHealth,
  EvidenceLedger,
  NextRecommendation,
  NoriContract,
  ProfileCompliance,
  UserIntervention
} from "../types.ts";

export type ContextExportState = {
  root: string;
  pair: ContextExportPair;
  contract: NoriContract;
  ledger: EvidenceLedger;
  architecture: ArchitectureState;
  profile: CapabilityProfile;
  current_gap: CurrentGap | null;
  completion: CompletionAnswer;
  intervention: UserIntervention;
  acceptance_review: AcceptanceQualityAudit;
  evidence_health: EvidenceHealth;
  next_recommendation: NextRecommendation;
  agent_next: AgentNext;
  criteria: CriterionStatusRow[];
  capability_compliance: ProfileCompliance;
};

export function collectContextExportState(root: string, pair: ContextExportPair): ContextExportState {
  const { contract, ledger } = readGoalPayload(pair);
  const architecture = architectureState(root, contract.goal_id);
  const profile = readProjectProfile(root);
  const gap = currentGap(contract, ledger, profile);
  const recommendation = nextRecommendation(contract, ledger, { root, architecture, profile });
  return {
    root,
    pair,
    contract,
    ledger,
    architecture,
    profile,
    current_gap: gap,
    completion: completionAnswer(contract, ledger, { root, architecture, profile }),
    intervention: interventionForProfile(contract, ledger, profile),
    acceptance_review: reviewAcceptanceQuality(contract),
    evidence_health: evidenceHealth(contract, ledger, { root }),
    next_recommendation: recommendation,
    agent_next: agentNextForRecommendation(contract.goal_id, gap, recommendation),
    criteria: criterionStatusRows(contract, ledger, { root }),
    capability_compliance: profileCompliance(profile, ledger)
  };
}
