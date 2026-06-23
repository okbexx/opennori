import { agentNextForRecommendation } from "../agent-next-recommendation.ts";
import { architectureState } from "../architecture.ts";
import { readProjectProfile } from "../core/profile.ts";
import { reviewState, type ReviewState } from "../core/review-state.ts";
import type { AgentNext } from "../types/agent.ts";
import type { ArchitectureState } from "../types/architecture.ts";
import type { NoriContract } from "../types/contract.ts";
import type { EvidenceLedger } from "../types/evidence.ts";

export type GoalReviewState = ReviewState & {
  architecture: ArchitectureState;
  agent_next: AgentNext;
};

export function goalReviewState(root: string, contract: NoriContract, ledger: EvidenceLedger): GoalReviewState {
  const architecture = architectureState(root, contract.goal_id);
  const profile = readProjectProfile(root);
  const review = reviewState(contract, ledger, { root, architecture, profile });
  return {
    ...review,
    architecture,
    agent_next: agentNextForRecommendation(contract.goal_id, review.current_gap, review.next_recommendation)
  };
}
