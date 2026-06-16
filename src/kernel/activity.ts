import fs from "node:fs";
import path from "node:path";
import { currentGap } from "../core/evidence.ts";
import { findActivePairs, nowIso, readJson, writeJson } from "../core/shared.ts";
import type { NoriActivity, NoriActivityInput, NoriActivityState, NoriActivityTarget, NoriEvidencePayload } from "../types.ts";
import { appendEvent } from "./events.ts";

export const ACTIVITY_SCHEMA_VERSION = "opennori/activity-v1";

const DEFAULT_TTL_MS = 90_000;

function activityDir(root: string): string {
  return path.join(root, ".opennori", "activity");
}

export function activityPath(root: string): string {
  return path.join(activityDir(root), "current.json");
}

function isoFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

function normalizeState(value: unknown): NoriActivityState {
  const state = String(value || "").trim();
  if (["idle", "thinking", "working", "verifying", "waiting_user", "blocked"].includes(state)) {
    return state as NoriActivityState;
  }
  return "working";
}

function normalizeActivity(input: NoriActivityInput, previous?: NoriActivity): NoriActivity {
  const now = nowIso();
  const ttlMs = Number.isFinite(Number(input.ttl_ms)) && Number(input.ttl_ms) > 0
    ? Math.min(Number(input.ttl_ms), 3_600_000)
    : DEFAULT_TTL_MS;
  return {
    schema_version: ACTIVITY_SCHEMA_VERSION,
    agent: input.agent || previous?.agent || "Agent",
    skill: input.skill || previous?.skill,
    state: normalizeState(input.state || previous?.state),
    goal_id: input.goal_id || previous?.goal_id,
    gap_id: input.gap_id || previous?.gap_id,
    summary: input.summary || previous?.summary || "",
    started_at: previous?.started_at || now,
    last_seen_at: now,
    expires_at: isoFromNow(ttlMs)
  };
}

type TargetCandidate = NoriActivityTarget & {
  active: boolean;
};

function readTargetCandidate(pair: ReturnType<typeof findActivePairs>[number]): TargetCandidate | null {
  try {
    const payload = readJson<NoriEvidencePayload>(pair.evidencePath);
    const gap = currentGap(payload.contract, payload.ledger);
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
  return `Multiple active OpenNori goals have current gaps under ${root}: ${choices}. Pass --goal <goal-id> so dashboard activity is not attached to the wrong goal.`;
}

export function inferActivityTarget(root: string, input: Pick<NoriActivityInput, "goal_id" | "gap_id"> = {}): NoriActivityTarget | null {
  const pairs = findActivePairs(root);
  if (input.goal_id) {
    const pair = pairs.find((item) => item.goalId === input.goal_id);
    if (!pair) {
      throw new Error(`No active OpenNori goal found for activity: ${input.goal_id}`);
    }
    const candidate = readTargetCandidate(pair);
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
    .map((pair) => readTargetCandidate(pair))
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

function resolveInputTarget(root: string, input: NoriActivityInput, previous?: NoriActivity): NoriActivityInput {
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

export function readActivity(root: string): NoriActivity | null {
  const filePath = activityPath(root);
  if (!fs.existsSync(filePath)) return null;
  try {
    const activity = readJson<NoriActivity>(filePath);
    if (activity.expires_at && Date.parse(activity.expires_at) < Date.now()) {
      return {
        ...activity,
        state: "idle",
        summary: "No recent OpenNori agent activity.",
        expired: true
      };
    }
    return activity;
  } catch {
    return null;
  }
}

export function writeActivity(root: string, input: NoriActivityInput): NoriActivity {
  const previous = readActivity(root) || undefined;
  const activity = normalizeActivity(resolveInputTarget(root, input, previous), previous);
  fs.mkdirSync(activityDir(root), { recursive: true });
  writeJson(activityPath(root), activity);
  appendEvent(root, {
    type: previous ? "activity.heartbeat" : "activity.started",
    goal_id: activity.goal_id,
    gap_id: activity.gap_id,
    actor: { kind: "agent", name: activity.agent, skill: activity.skill },
    summary: activity.summary || `${activity.agent} is ${activity.state}.`,
    data: {
      state: activity.state,
      expires_at: activity.expires_at
    }
  });
  return activity;
}

export function finishActivity(root: string, input: Partial<NoriActivityInput> = {}): NoriActivity {
  const previous = readActivity(root) || undefined;
  const activity = normalizeActivity(resolveInputTarget(root, {
    ...input,
    state: input.state || "idle",
    summary: input.summary || "OpenNori agent activity finished.",
    ttl_ms: DEFAULT_TTL_MS
  }, previous), previous);
  writeJson(activityPath(root), activity);
  appendEvent(root, {
    type: "activity.finished",
    goal_id: activity.goal_id,
    gap_id: activity.gap_id,
    actor: { kind: "agent", name: activity.agent, skill: activity.skill },
    summary: activity.summary,
    data: {
      state: activity.state
    }
  });
  return activity;
}
