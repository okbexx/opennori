import fs from "node:fs";
import path from "node:path";
import { nowIso, readJson, writeJson } from "../core/shared.ts";
import type { NoriActivity, NoriActivityInput, NoriActivityState } from "../types.ts";

export const ACTIVITY_SCHEMA_VERSION = "opennori/activity-v1";

export const DEFAULT_ACTIVITY_TTL_MS = 90_000;

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

export function normalizeActivity(input: NoriActivityInput, previous?: NoriActivity): NoriActivity {
  const now = nowIso();
  const ttlMs = Number.isFinite(Number(input.ttl_ms)) && Number(input.ttl_ms) > 0
    ? Math.min(Number(input.ttl_ms), 3_600_000)
    : DEFAULT_ACTIVITY_TTL_MS;
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

export function saveActivity(root: string, activity: NoriActivity): void {
  fs.mkdirSync(activityDir(root), { recursive: true });
  writeJson(activityPath(root), activity);
}
