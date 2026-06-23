import { currentGap } from "../core/evidence.ts";
import { readProjectProfile } from "../core/profile.ts";
import { findCurrentPairs, readGoalPayload } from "../core/shared.ts";
import type { NoriActivity, NoriActivityInput, NoriActivityTarget } from "../types/kernel.ts";

type TargetCandidate = NoriActivityTarget & {
  active: boolean;
};

function readTargetCandidate(root: string, pair: ReturnType<typeof findCurrentPairs>[number]): TargetCandidate | null {
  try {
    const payload = readGoalPayload(pair);
    const profile = readProjectProfile(root);
    const gap = currentGap(payload.contract, payload.ledger, profile);
    return {
      goal_id: payload.contract.goal_id || pair.goalId,
      gap_id: gap?.id ?? null,
      gap_summary: gap?.user_story,
      active: payload.ledger.status !== "complete" && gap !== null,
      inferred: true
    };
  } catch {
    return null;
  }
}

function ambiguousTargetMessage(root: string, candidates: NoriActivityTarget[]): string {
  const choices = candidates
    .map((candidate) => candidate.gap_id ? `${candidate.goal_id}:${candidate.gap_id}` : candidate.goal_id)
    .join(", ");
  return `OpenNori current state is invalid under ${root}: multiple current goals have gaps (${choices}). Run opennori doctor before publishing dashboard activity.`;
}

export function inferActivityTarget(root: string, input: Pick<NoriActivityInput, "goal_id" | "gap_id"> = {}): NoriActivityTarget | null {
  const pairs = findCurrentPairs(root);
  if (input.goal_id) {
    const pair = pairs.find((item) => item.goalId === input.goal_id);
    if (!pair) {
      throw new Error(`No current OpenNori goal found for activity: ${input.goal_id}`);
    }
    const candidate = readTargetCandidate(root, pair);
    if (!candidate) {
      throw new Error(`OpenNori activity target is not recoverable: ${input.goal_id}`);
    }
    return {
      ...candidate,
      gap_id: input.gap_id || candidate.gap_id,
      inferred: false
    };
  }

  const candidates = pairs
    .map((pair) => readTargetCandidate(root, pair))
    .filter((candidate): candidate is TargetCandidate => candidate !== null);
  if (candidates.length === 0) return null;

  const activeCandidates = candidates.filter((candidate) => candidate.active);
  if (activeCandidates.length === 1) return activeCandidates[0] || null;
  if (candidates.length === 1) return candidates[0] || null;
  if (activeCandidates.length > 1) {
    throw new Error(ambiguousTargetMessage(root, activeCandidates));
  }
  throw new Error(ambiguousTargetMessage(root, candidates));
}

export function resolveInputTarget(root: string, input: NoriActivityInput, previous?: NoriActivity): NoriActivityInput {
  if (input.goal_id && input.gap_id) return input;
  if (!input.goal_id && previous?.goal_id) {
    return {
      ...input,
      goal_id: previous.goal_id,
      gap_id: input.gap_id || previous.gap_id
    };
  }
  const target = inferActivityTarget(root, input);
  if (!target) return input;
  return {
    ...input,
    goal_id: input.goal_id || target.goal_id,
    gap_id: input.gap_id || target.gap_id || undefined
  };
}
