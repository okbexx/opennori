import { readProjectProfile } from "../core/profile.ts";
import type { NoriSnapshot } from "../types.ts";
import { readActivity } from "./activity.ts";
import { latestEvent, readEvents } from "./events.ts";
import { buildActiveSnapshotFromPair, buildNoGoalSnapshot } from "./snapshot-goal.ts";
import { latestHistorySummary } from "./snapshot-history.ts";
import { chooseActivePair } from "./snapshot-paths.ts";

export const SNAPSHOT_SCHEMA_VERSION = "opennori/snapshot-v1";

export function buildSnapshot(root: string, options: { goalId?: string } = {}): NoriSnapshot {
  const activity = readActivity(root);
  const projectProfile = readProjectProfile(root);
  const pair = chooseActivePair(root, options.goalId, activity?.expired ? undefined : activity?.goal_id);
  const event = latestEvent(root);
  const events = readEvents(root, { limit: 50 });
  const generatedAt = new Date().toISOString();

  if (!pair) {
    return buildNoGoalSnapshot(root, {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      generatedAt,
      idleSummary: latestHistorySummary(root),
      projectProfile,
      activity,
      event,
      events
    });
  }

  return buildActiveSnapshotFromPair(root, {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    generatedAt,
    pair,
    activity,
    event,
    events
  });
}
