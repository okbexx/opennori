import fs from "node:fs";
import path from "node:path";
import { architectureState } from "../architecture.ts";
import { reviewAcceptanceQuality } from "../acceptance.ts";
import { currentGap, evidenceHealth } from "../core/evidence.ts";
import { profileCompliance, readProjectProfile } from "../core/profile.ts";
import { completionAnswer, interventionForProfile } from "../core/report.ts";
import { findCurrentPairs, findHistoryPairs, readGoalPayload, writeJson } from "../core/shared.ts";
import type { EvidenceLedger, NoriIdleSummary, NoriSnapshot } from "../types.ts";
import { readActivity } from "./activity.ts";
import { latestEvent, readEvents } from "./events.ts";

export const SNAPSHOT_SCHEMA_VERSION = "opennori/snapshot-v1";

function snapshotsDir(root: string): string {
  return path.join(root, ".opennori", "snapshots");
}

export function snapshotPath(root: string): string {
  return path.join(snapshotsDir(root), "current.json");
}

function chooseActivePair(root: string, goalId?: string, activityGoalId?: string) {
  const pairs = findCurrentPairs(root);
  if (goalId) return pairs.find((pair) => pair.goalId === goalId) || null;
  if (activityGoalId) {
    const activityPair = pairs.find((pair) => pair.goalId === activityGoalId);
    if (activityPair) return activityPair;
  }
  if (pairs.length === 1) return pairs[0] || null;
  return null;
}

function latestEvidenceSummary(ledger: EvidenceLedger, gapId?: string): string {
  if (!gapId) return "";
  const state = ledger.criteria?.[gapId];
  const latest = state?.evidence?.at(-1);
  return latest?.summary || "";
}

function profileOutcomeSummary(input: {
  hasCurrentGoal: boolean;
  profile: ReturnType<typeof readProjectProfile>;
  compliance: ReturnType<typeof profileCompliance>;
}) {
  if (!input.profile.items.length) {
    return {
      scope: "project_only" as const,
      state: "idle" as const,
      label: "No Project Profile items",
      detail: "No project-level Skill, stack, avoid, or install policy preferences are configured."
    };
  }
  if (!input.hasCurrentGoal) {
    return {
      scope: "project_only" as const,
      state: "idle" as const,
      label: "Project Profile loaded",
      detail: "Project Profile is project-level source data. Compliance is evaluated only against a current goal."
    };
  }
  if (input.compliance.blocking.length > 0) {
    return {
      scope: "current_goal_compliance" as const,
      state: "blocked" as const,
      label: "Project Profile blocks completion",
      detail: `${input.compliance.blocking.length} must/avoid item needs evidence, revision, or waiver.`
    };
  }
  if (input.compliance.review.length > 0) {
    return {
      scope: "current_goal_compliance" as const,
      state: "review" as const,
      label: "Project Profile needs review",
      detail: `${input.compliance.review.length} preferred or avoid item still needs review before confident completion.`
    };
  }
  return {
    scope: "current_goal_compliance" as const,
    state: "clear" as const,
    label: "Project Profile clear",
    detail: "Current goal has no blocking Project Profile compliance gaps."
  };
}

function noGoalOutcomeSummary(
  idleSummary: NoriIdleSummary,
  projectProfile: ReturnType<typeof readProjectProfile>,
  capabilityCompliance: ReturnType<typeof profileCompliance>
) {
  return {
    decision: {
      state: "no_active_goal" as const,
      label: "No current goal",
      detail: idleSummary.message
    },
    current_gap: {
      id: null,
      label: "No current acceptance gap",
      detail: idleSummary.last_goal
        ? `Last outcome: ${idleSummary.last_goal.label}`
        : "Approve a Nori Contract before OpenNori can track a current gap."
    },
    need_user: {
      required: true,
      label: "Start in agent chat",
      action: idleSummary.next
    },
    next: {
      label: "Next",
      action: idleSummary.next
    },
    profile: profileOutcomeSummary({
      hasCurrentGoal: false,
      profile: projectProfile,
      compliance: capabilityCompliance
    })
  };
}

function activeOutcomeSummary(input: {
  decision: NoriSnapshot["decision"];
  gap: ReturnType<typeof currentGap>;
  completion: ReturnType<typeof completionAnswer>;
  userIntervention: ReturnType<typeof interventionForProfile>;
  projectProfile: ReturnType<typeof readProjectProfile>;
  capabilityCompliance: ReturnType<typeof profileCompliance>;
}) {
  const decisionLabel = input.completion.complete
    ? input.completion.confidence === "review-risk" ? "Complete with review risk" : "Complete"
    : "Not complete yet";
  const gapSummary = input.gap
    ? {
        id: input.gap.id,
        label: input.gap.user_story,
        detail: `${input.gap.id} is ${input.gap.status}: ${input.gap.reason}`
      }
    : {
        id: null,
        label: "No open acceptance gap",
        detail: input.completion.complete
          ? "All required acceptance checks have completion evidence or waiver."
          : "OpenNori has no current gap, but workflow status still needs review."
      };
  const nextAction = input.userIntervention.required
    ? input.userIntervention.action
    : input.gap
      ? `Work on ${input.gap.id}, then attach reviewable evidence.`
      : input.completion.complete
        ? "Review the report and decide whether to accept the outcome or start the next Nori Contract."
        : "Review status and evidence before making a completion decision.";
  return {
    decision: {
      state: input.decision,
      label: decisionLabel,
      detail: input.completion.answer
    },
    current_gap: gapSummary,
    need_user: {
      required: input.userIntervention.required,
      label: input.userIntervention.required ? "User decision needed" : "No user action needed",
      action: input.userIntervention.action
    },
    next: {
      label: input.userIntervention.required ? "Reply in agent chat" : "Next",
      action: nextAction
    },
    profile: profileOutcomeSummary({
      hasCurrentGoal: true,
      profile: input.projectProfile,
      compliance: input.capabilityCompliance
    })
  };
}

function projectRelative(root: string, filePath: string): string {
  const relative = path.relative(root, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return filePath;
  return relative;
}

function goalDossier(root: string, pair: NonNullable<ReturnType<typeof chooseActivePair>>) {
  return {
    location: pair.location,
    path: projectRelative(root, pair.goalDir),
    readme_path: projectRelative(root, pair.acceptancePath),
    contract_path: projectRelative(root, pair.contractPath),
    ledger_path: projectRelative(root, pair.ledgerPath),
    criteria_path: projectRelative(root, pair.criteriaDir),
    report_path: projectRelative(root, pair.reportPath)
  };
}

type SnapshotGoalPair = NonNullable<ReturnType<typeof chooseActivePair>>;

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

function criterionDossier(root: string, pair: SnapshotGoalPair, criterionId: string) {
  const dir = path.join(pair.criteriaDir, criterionId);
  return {
    path: projectRelative(root, dir),
    readme_path: projectRelative(root, path.join(dir, "README.md")),
    criterion_path: projectRelative(root, path.join(dir, "criterion.json")),
    status_path: projectRelative(root, path.join(dir, "status.json")),
    evidence_path: projectRelative(root, path.join(dir, "evidence")),
    artifacts_path: projectRelative(root, path.join(dir, "artifacts"))
  };
}

export function buildSnapshot(root: string, options: { goalId?: string } = {}): NoriSnapshot {
  const activity = readActivity(root);
  const projectProfile = readProjectProfile(root);
  const pair = chooseActivePair(root, options.goalId, activity?.expired ? undefined : activity?.goal_id);
  const event = latestEvent(root);
  if (!pair) {
    const idleSummary = latestHistorySummary(root);
    const capabilityCompliance = {
      required: projectProfile.items.length > 0,
      complete: false,
      blocking: [],
      review: [],
      statuses: []
    };
    return {
      schema_version: SNAPSHOT_SCHEMA_VERSION,
      generated_at: new Date().toISOString(),
      root,
      status: "no_active_goal",
      idle_summary: idleSummary,
      agent: activity
        ? {
            name: activity.agent,
            skill: activity.skill,
            state: activity.state,
            summary: activity.summary,
            last_seen_at: activity.last_seen_at,
            expires_at: activity.expires_at,
            expired: activity.expired === true
          }
        : {
            name: "Agent",
            state: "idle",
            summary: idleSummary.message
          },
      goal: null,
      current_gap: null,
      need_user: false,
      decision: "no_active_goal",
      outcome_summary: noGoalOutcomeSummary(idleSummary, projectProfile, capabilityCompliance),
      architecture: {
        decision: "unknown",
        profile: null
      },
      capability_profile: projectProfile,
      capability_compliance: capabilityCompliance,
      loop: {
        goal: "empty",
        contract: "missing",
        gap: "idle",
        evidence: "idle",
        decision: "pending"
      },
      last_event: event,
      /* 简体中文：无活跃契约时，只读 events 列表依然返回最近的事件以供 Console 渲染 */
      events: readEvents(root, { limit: 50 }),
      criteria: []
    };
  }

  const payload = readGoalPayload(pair);
  const { contract, ledger } = payload;
  const architecture = architectureState(root, contract.goal_id);
  const gap = currentGap(contract, ledger, projectProfile);
  const completion = completionAnswer(contract, ledger, { root, architecture, profile: projectProfile });
  const userIntervention = interventionForProfile(contract, ledger, projectProfile);
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const evidence = evidenceHealth(contract, ledger, { root });
  const capabilityCompliance = profileCompliance(projectProfile, ledger);
  const activityState = activity?.state || "idle";
  const decision = completion.complete
    ? completion.confidence === "review-risk" ? "review_risk" : "complete"
    : "not_complete";
  const evidenceState = gap ? "needs_evidence" : evidence.status === "clear" ? "ready" : "review";
  const contractState = contract.acceptance_basis?.status === "approved" ? "approved" : "draft";

  return {
    schema_version: SNAPSHOT_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    root,
    status: "active",
    agent: activity
      ? {
          name: activity.agent,
          skill: activity.skill,
          state: activityState,
          summary: activity.summary,
          last_seen_at: activity.last_seen_at,
          expires_at: activity.expires_at,
          expired: activity.expired === true
        }
      : {
          name: "Agent",
          state: "idle",
          summary: "No recent OpenNori agent activity."
        },
    goal: {
      id: contract.goal_id,
      label: contract.goal,
      workflow_status: ledger.status,
      dossier: goalDossier(root, pair)
    },
    current_gap: gap
      ? {
          id: gap.id,
          label: gap.user_story,
          status: gap.status,
          reason: gap.reason,
          latest_evidence: latestEvidenceSummary(ledger, gap.id),
          dossier: criterionDossier(root, pair, gap.id)
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
      projectProfile,
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
    capability_profile: projectProfile,
    capability_compliance: capabilityCompliance,
    loop: {
      goal: "ready",
      contract: contractState,
      gap: gap ? "active" : "clear",
      evidence: evidenceState,
      decision: completion.complete ? "decided" : "pending"
    },
    last_event: event,
    /* 简体中文：为 snapshot 挂载只读 criteria 状态及 events 历史记录 */
    criteria: contract.criteria.map((c) => {
      const ledgerState = ledger.criteria?.[c.id];
      return {
        id: c.id,
        layer: c.layer,
        user_story: c.user_story,
        measurement: c.measurement,
        threshold: c.threshold,
        required: c.required,
        status: ledgerState?.status || c.status || "unknown",
        confidence: ledgerState?.confidence || "unknown",
        evidence: ledgerState?.evidence || [],
        dossier: criterionDossier(root, pair, c.id)
      };
    }),
    events: readEvents(root, { limit: 50 })
  };
}

export function refreshSnapshot(root: string, options: { goalId?: string } = {}): NoriSnapshot {
  const snapshot = buildSnapshot(root, options);
  fs.mkdirSync(snapshotsDir(root), { recursive: true });
  writeJson(snapshotPath(root), snapshot);
  return snapshot;
}
