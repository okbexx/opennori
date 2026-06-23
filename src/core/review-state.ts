import { reviewAcceptanceQuality } from "../acceptance.ts";
import type {
  AcceptanceQualityAudit,
  ArchitectureState,
  CapabilityProfile,
  CompletionAnswer,
  CurrentGap,
  EvidenceHealth,
  EvidenceLedger,
  NextRecommendation,
  NoriContract,
  ProfileCompliance,
  UserIntervention
} from "../types.ts";
import { completionAnswer } from "./completion-answer.ts";
import { currentGap, evidenceHealth } from "./evidence.ts";
import { interventionForProfile } from "./intervention.ts";
import { nextRecommendation } from "./next-recommendation.ts";
import { emptyProjectProfile, profileCompliance } from "./profile.ts";

export type ReviewState = {
  root: string;
  contract: NoriContract;
  ledger: EvidenceLedger;
  architecture?: ArchitectureState;
  profile: CapabilityProfile;
  current_gap: CurrentGap | null;
  completion: CompletionAnswer;
  intervention: UserIntervention;
  acceptance_review: AcceptanceQualityAudit;
  evidence_health: EvidenceHealth;
  capability_compliance: ProfileCompliance;
  next_recommendation: NextRecommendation;
};

export function reviewState(
  contract: NoriContract,
  ledger: EvidenceLedger,
  {
    root = process.cwd(),
    architecture = undefined,
    profile = emptyProjectProfile()
  }: {
    root?: string;
    architecture?: ArchitectureState;
    profile?: CapabilityProfile;
  } = {}
): ReviewState {
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
    next_recommendation: recommendation
  };
}
