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
      architecture: {
        decision: "unknown",
        profile: null
      },
      capability_profile: projectProfile,
      capability_compliance: {
        required: projectProfile.items.length > 0,
        complete: false,
        blocking: [],
        review: [],
        statuses: []
      },
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
