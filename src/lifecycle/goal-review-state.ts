import { agentNextForRecommendation } from "../agent-next-recommendation.ts";
import { reviewAcceptanceQuality } from "../acceptance.ts";
import { architectureState } from "../architecture.ts";
import { completionAnswer } from "../core/completion-answer.ts";
import { currentGap, evidenceHealth } from "../core/evidence.ts";
import { interventionForProfile } from "../core/intervention.ts";
import { nextRecommendation } from "../core/next-recommendation.ts";
import { profileCompliance, readProjectProfile } from "../core/profile.ts";
import type {
  AcceptanceQualityAudit,
  AgentNext,
  ArchitectureState,
  CapabilityProfile,
  ProfileCompliance,
  CompletionAnswer,
  CurrentGap,
  EvidenceHealth,
  EvidenceLedger,
  NextRecommendation,
  NoriContract,
  UserIntervention
} from "../types.ts";

export type GoalReviewState = {
  root: string;
  contract: NoriContract;
  ledger: EvidenceLedger;
  architecture: ArchitectureState;
  profile: CapabilityProfile;
  current_gap: CurrentGap | null;
  completion: CompletionAnswer;
  intervention: UserIntervention;
  acceptance_review: AcceptanceQualityAudit;
  evidence_health: EvidenceHealth;
  capability_compliance: ProfileCompliance;
  next_recommendation: NextRecommendation;
  agent_next: AgentNext;
};

export function goalReviewState(root: string, contract: NoriContract, ledger: EvidenceLedger): GoalReviewState {
  const architecture = architectureState(root, contract.goal_id);
  const profile = readProjectProfile(root);
  const gap = currentGap(contract, ledger, profile);
  const recommendation = nextRecommendation(contract, ledger, { root, architecture, profile });
  return {
    root,
    contract,
    ledger,
    architecture,
    profile,
    current_gap: gap,
    completion: completionAnswer(contract, ledger, { root, architecture, profile }),
    intervention: interventionForProfile(contract, ledger, profile),
    acceptance_review: reviewAcceptanceQuality(contract),
    evidence_health: evidenceHealth(contract, ledger, { root }),
    capability_compliance: profileCompliance(profile, ledger),
    next_recommendation: recommendation,
    agent_next: agentNextForRecommendation(contract.goal_id, gap, recommendation)
  };
}
