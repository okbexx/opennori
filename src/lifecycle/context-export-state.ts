import { criterionStatusRows, readGoalPayload } from "../core.ts";
import type {
  ContextExportPair,
  CriterionStatusRow,
} from "../types.ts";
import { goalReviewState, type GoalReviewState } from "./goal-review-state.ts";

export type ContextExportState = GoalReviewState & {
  pair: ContextExportPair;
  criteria: CriterionStatusRow[];
};

export function collectContextExportState(root: string, pair: ContextExportPair): ContextExportState {
  const { contract, ledger } = readGoalPayload(pair);
  const review = goalReviewState(root, contract, ledger);
  return {
    ...review,
    pair,
    criteria: criterionStatusRows(contract, ledger, { root }),
  };
}
