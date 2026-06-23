import { architectureState } from "../architecture.ts";
import { reviewAcceptanceQuality } from "../acceptance.ts";
import { currentGap, evidenceHealth } from "../core/evidence.ts";
import { profileCompliance, readProjectProfile } from "../core/profile.ts";
import { completionAnswer, interventionForProfile } from "../core/report.ts";
import { findHistoryPairs, readGoalPayload } from "../core/shared.ts";
import type { EvidenceLedger, NoriIdleSummary, NoriSnapshot } from "../types.ts";
import { readActivity } from "./activity.ts";
import { latestEvent, readEvents } from "./events.ts";
import {
  chooseActivePair,
  criterionDossier,
  goalDossier,
  projectRelative,
  type SnapshotGoalPair
} from "./snapshot-paths.ts";
import { activeOutcomeSummary, noGoalOutcomeSummary } from "./snapshot-outcome.ts";

export const SNAPSHOT_SCHEMA_VERSION = "opennori/snapshot-v1";

function latestEvidenceSummary(ledger: EvidenceLedger, gapId?: string): string {
  if (!gapId) return "";
  const state = ledger.criteria?.[gapId];
  const latest = state?.evidence?.at(-1);
  return latest?.summary || "";
}

function latestHistorySummary(root: string): NoriIdleSummary {
  const history = findHistoryPairs(root)
    .map((pair) => {
      try {
        const payload = readGoalPayload(pair);
        return {
          pair,
          contract: payload.contract,
          ledger: payload.ledger,
          updatedAt: payload.ledger.updated_at || payload.contract.created_at || ""
        };
      } catch {
        return null;
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));

  const latest = history[0];
  return {
    state: "no_current_goal",
    message: "No current Nori Contract is being observed.",
    next: latest
      ? "Review the last report or ask the agent to use OpenNori for the next goal."
      : "Ask the agent to use OpenNori for a goal, then approve a Nori Contract.",
    last_goal: latest
      ? {
          id: latest.contract.goal_id,
          label: latest.contract.goal,
          workflow_status: latest.ledger.status,
          location: latest.pair.location,
          updated_at: latest.ledger.updated_at,
          dossier_path: projectRelative(root, latest.pair.goalDir),
          readme_path: projectRelative(root, latest.pair.acceptancePath),
          report_path: projectRelative(root, latest.pair.reportPath)
        }
      : undefined
  };
}

function defaultAgentSummary(message: string) {
  return {
    name: "Agent",
    state: "idle" as const,
    summary: message
  };
}

function activityAgentSummary(activity: ReturnType<typeof readActivity>, fallback: string) {
  return activity
    ? {
        name: activity.agent,
        skill: activity.skill,
        state: activity.state,
        summary: activity.summary,
        last_seen_at: activity.last_seen_at,
        expires_at: activity.expires_at,
        expired: activity.expired === true
      }
    : defaultAgentSummary(fallback);
}

function buildNoGoalSnapshot(root: string, input: {
  generatedAt: string;
  idleSummary: NoriIdleSummary;
  projectProfile: ReturnType<typeof readProjectProfile>;
  activity: ReturnType<typeof readActivity>;
  event: ReturnType<typeof latestEvent>;
}): NoriSnapshot {
  const capabilityCompliance = {
    required: input.projectProfile.items.length > 0,
    complete: false,
    blocking: [],
    review: [],
    statuses: []
  };
  return {
    schema_version: SNAPSHOT_SCHEMA_VERSION,
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
    events: readEvents(root, { limit: 50 }),
    criteria: []
  };
}

function buildActiveSnapshot(root: string, input: {
  generatedAt: string;
  pair: SnapshotGoalPair;
  projectProfile: ReturnType<typeof readProjectProfile>;
  activity: ReturnType<typeof readActivity>;
  event: ReturnType<typeof latestEvent>;
}): NoriSnapshot {
  const payload = readGoalPayload(input.pair);
  const { contract, ledger } = payload;
  const architecture = architectureState(root, contract.goal_id);
  const gap = currentGap(contract, ledger, input.projectProfile);
  const completion = completionAnswer(contract, ledger, { root, architecture, profile: input.projectProfile });
  const userIntervention = interventionForProfile(contract, ledger, input.projectProfile);
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const evidence = evidenceHealth(contract, ledger, { root });
  const capabilityCompliance = profileCompliance(input.projectProfile, ledger);
  const activityState = input.activity?.state || "idle";
  const decision = completion.complete
    ? completion.confidence === "review-risk" ? "review_risk" : "complete"
    : "not_complete";
  const evidenceState = gap ? "needs_evidence" : evidence.status === "clear" ? "ready" : "review";
  const contractState = contract.acceptance_basis?.status === "approved" ? "approved" : "draft";

  return {
    schema_version: SNAPSHOT_SCHEMA_VERSION,
    generated_at: input.generatedAt,
    root,
    status: "active",
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
      projectProfile: input.projectProfile,
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
    capability_profile: input.projectProfile,
    capability_compliance: capabilityCompliance,
    loop: {
      goal: "ready",
      contract: contractState,
      gap: gap ? "active" : "clear",
      evidence: evidenceState,
      decision: completion.complete ? "decided" : "pending"
    },
    last_event: input.event,
    criteria: contract.criteria.map((criterion) => {
      const ledgerState = ledger.criteria?.[criterion.id];
      return {
        id: criterion.id,
        layer: criterion.layer,
        user_story: criterion.user_story,
        measurement: criterion.measurement,
        threshold: criterion.threshold,
        required: criterion.required,
        status: ledgerState?.status || criterion.status || "unknown",
        confidence: ledgerState?.confidence || "unknown",
        evidence: ledgerState?.evidence || [],
        dossier: criterionDossier(root, input.pair, criterion.id)
      };
    }),
    events: readEvents(root, { limit: 50 })
  };
}

export function buildSnapshot(root: string, options: { goalId?: string } = {}): NoriSnapshot {
  const activity = readActivity(root);
  const projectProfile = readProjectProfile(root);
  const pair = chooseActivePair(root, options.goalId, activity?.expired ? undefined : activity?.goal_id);
  const event = latestEvent(root);
  const generatedAt = new Date().toISOString();

  if (!pair) {
    return buildNoGoalSnapshot(root, {
      generatedAt,
      idleSummary: latestHistorySummary(root),
      projectProfile,
      activity,
      event
    });
  }

  return buildActiveSnapshot(root, {
    generatedAt,
    pair,
    projectProfile,
    activity,
    event
  });
}
