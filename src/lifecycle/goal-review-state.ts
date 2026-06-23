import { agentNextForRecommendation } from "../agent-next-recommendation.ts";
import { architectureState } from "../architecture.ts";
import { readProjectProfile } from "../core/profile.ts";
import { reviewState, type ReviewState } from "../core/review-state.ts";
import type {
  AgentNext,
  ArchitectureState,
  EvidenceLedger,
  NoriContract
} from "../types.ts";

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
