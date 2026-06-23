import path from "node:path";
import { ok, snapshotPath } from "../../../core.ts";
import type { NoriActivity, NoriActivityTarget, NoriSnapshot } from "../../../types.ts";

function projectSnapshotPath(root: string): string {
  const filePath = snapshotPath(root);
  const relative = path.relative(root, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return filePath;
  return relative;
}

export function activitySnapshotSummary(snapshot: NoriSnapshot) {
  return {
    status: snapshot.status,
    goal_id: snapshot.goal?.id ?? null,
    current_gap_id: snapshot.current_gap?.id ?? null,
    decision: snapshot.decision,
    need_user: snapshot.need_user,
    agent_state: snapshot.agent.state,
    agent_skill: snapshot.agent.skill ?? null,
    generated_at: snapshot.generated_at
  };
}

export function responseTarget(target: NoriActivityTarget | null) {
  return target
    ? {
        goal_id: target.goal_id,
        gap_id: target.gap_id,
        gap_summary: target.gap_summary,
        inferred: target.inferred
      }
    : null;
}

export function activityResponse(root: string, activity: NoriActivity | null, target: NoriActivityTarget | null, snapshot: NoriSnapshot) {
  return ok({
    activity,
    target: responseTarget(target),
    snapshot_summary: activitySnapshotSummary(snapshot),
    snapshot_path: projectSnapshotPath(root),
    side_effect: "dashboard_activity_only"
  });
}
