import { readGoalPayload } from "../core/shared.ts";
import { goalReviewState, type GoalReviewState } from "../lifecycle/goal-review-state.ts";
import type { NoriActivity, NoriEvent, NoriIdleSummary, NoriSnapshot } from "../types/kernel.ts";
import type { profileCompliance, readProjectProfile } from "../core/profile.ts";
import { activityAgentSummary, defaultAgentSummary } from "./snapshot-agent.ts";
import { latestEvidenceSummary, snapshotCriteria } from "./snapshot-criteria.ts";
import { activeOutcomeSummary, noGoalOutcomeSummary } from "./snapshot-outcome.ts";
import { criterionDossier, goalDossier, type SnapshotGoalPair } from "./snapshot-paths.ts";

export function buildNoGoalSnapshot(root: string, input: {
  schemaVersion: string;
  generatedAt: string;
  idleSummary: NoriIdleSummary;
  projectProfile: ReturnType<typeof readProjectProfile>;
  activity: NoriActivity | null;
  event: NoriEvent | null;
  events: NoriEvent[];
}): NoriSnapshot {
  const capabilityCompliance = {
    required: input.projectProfile.items.length > 0,
    complete: false,
    blocking: [],
    review: [],
    statuses: []
  };
  return {
    schema_version: input.schemaVersion,
    generated_at: input.generatedAt,
    root,
    status: "no_active_goal",
    idle_summary: input.idleSummary,
    agent: activityAgentSummary(input.activity, input.idleSummary.message),
    goal: null,
    current_gap: null,
    need_user: false,
    decision: "no_active_goal",
    outcome_summary: noGoalOutcomeSummary(input.idleSummary, input.projectProfile, capabilityCompliance),
    architecture: {
      decision: "unknown",
      profile: null
    },
    capability_profile: input.projectProfile,
    capability_compliance: capabilityCompliance,
    loop: {
      goal: "empty",
      contract: "missing",
      gap: "idle",
      evidence: "idle",
      decision: "pending"
    },
    last_event: input.event,
    events: input.events,
    criteria: []
  };
}

export function buildActiveSnapshot(root: string, input: {
  schemaVersion: string;
  generatedAt: string;
  pair: SnapshotGoalPair;
  review: GoalReviewState;
  activity: NoriActivity | null;
  event: NoriEvent | null;
  events: NoriEvent[];
}): NoriSnapshot {
  const { contract, ledger } = input.review;
  const architecture = input.review.architecture;
  const gap = input.review.current_gap;
  const completion = input.review.completion;
  const userIntervention = input.review.intervention;
  const acceptanceReview = input.review.acceptance_review;
  const evidence = input.review.evidence_health;
  const capabilityCompliance = input.review.capability_compliance;
  const activityState = input.activity?.state || "idle";
  const decision = completion.complete
    ? completion.confidence === "review-risk" ? "review_risk" : "complete"
    : "not_complete";
  const evidenceState = gap ? "needs_evidence" : evidence.status === "clear" ? "ready" : "review";
  const contractState = contract.acceptance_basis?.status === "approved" ? "approved" : "draft";

  return {
    schema_version: input.schemaVersion,
    generated_at: input.generatedAt,
    root,
    status: "active",
    presentation: contract.presentation,
    agent: input.activity
      ? {
          name: input.activity.agent,
          skill: input.activity.skill,
          state: activityState,
          summary: input.activity.summary,
          last_seen_at: input.activity.last_seen_at,
          expires_at: input.activity.expires_at,
          expired: input.activity.expired === true
        }
      : defaultAgentSummary("No recent OpenNori agent activity."),
    goal: {
      id: contract.goal_id,
      label: contract.goal,
      workflow_status: ledger.status,
      dossier: goalDossier(root, input.pair)
    },
    current_gap: gap
      ? {
          id: gap.id,
          label: gap.user_story,
          status: gap.status,
          reason: gap.reason,
          latest_evidence: latestEvidenceSummary(ledger, gap.id),
          dossier: criterionDossier(root, input.pair, gap.id)
        }
      : null,
    need_user: userIntervention.required,
    user_action: userIntervention.action,
    decision,
    outcome_summary: activeOutcomeSummary({
      decision,
      gap,
      completion,
      userIntervention,
      projectProfile: input.review.profile,
      capabilityCompliance
    }),
    completion,
    acceptance_review: {
      status: acceptanceReview.status,
      summary: acceptanceReview.summary
    },
    evidence_health: {
      status: evidence.status,
      summary: evidence.summary
    },
    architecture: {
      decision: architecture.decision,
      profile: architecture.baseline?.profile || null,
      profile_title: architecture.baseline?.profile_title || null,
      open_challenges: architecture.open_challenges?.length || 0
    },
    capability_profile: input.review.profile,
    capability_compliance: capabilityCompliance,
    loop: {
      goal: "ready",
      contract: contractState,
      gap: gap ? "active" : "clear",
      evidence: evidenceState,
      decision: completion.complete ? "decided" : "pending"
    },
    last_event: input.event,
    criteria: snapshotCriteria(root, input.pair, {
      criteria: contract.criteria,
      ledger
    }),
    events: input.events
  };
}

export function buildActiveSnapshotFromPair(root: string, input: {
  schemaVersion: string;
  generatedAt: string;
  pair: SnapshotGoalPair;
  activity: NoriActivity | null;
  event: NoriEvent | null;
  events: NoriEvent[];
}): NoriSnapshot {
  const payload = readGoalPayload(input.pair);
  return buildActiveSnapshot(root, {
    ...input,
    review: goalReviewState(root, payload.contract, payload.ledger)
  });
}
