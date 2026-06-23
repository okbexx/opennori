import type { NoriActivity } from "../types.ts";
import { appendEvent } from "./events.ts";

function sameAcTarget(left?: Pick<NoriActivity, "goal_id" | "gap_id">, right?: Pick<NoriActivity, "goal_id" | "gap_id">): boolean {
  return !!left?.goal_id && !!left?.gap_id && left.goal_id === right?.goal_id && left.gap_id === right?.gap_id;
}

function hasAcTarget(activity?: Pick<NoriActivity, "goal_id" | "gap_id">): activity is Pick<NoriActivity, "goal_id" | "gap_id"> & { goal_id: string; gap_id: string } {
  return !!activity?.goal_id && !!activity.gap_id;
}

export function publishActivityChange(root: string, input: {
  previous?: NoriActivity;
  activity: NoriActivity;
  mode: "start" | "heartbeat";
}): void {
  const { previous, activity, mode } = input;
  if (hasAcTarget(previous) && hasAcTarget(activity) && !sameAcTarget(previous, activity)) {
    appendEvent(root, {
      type: "ac.finished",
      goal_id: previous.goal_id,
      gap_id: previous.gap_id,
      actor: { kind: "agent", name: activity.agent, skill: activity.skill },
      summary: `Stopped working on acceptance gap ${previous.gap_id}.`,
      data: {
        state: activity.state,
        next_goal_id: activity.goal_id,
        next_gap_id: activity.gap_id
      }
    });
  }
  if (hasAcTarget(activity) && (mode === "start" || !sameAcTarget(previous, activity))) {
    appendEvent(root, {
      type: "ac.started",
      goal_id: activity.goal_id,
      gap_id: activity.gap_id,
      actor: { kind: "agent", name: activity.agent, skill: activity.skill },
      summary: activity.summary || `Started working on acceptance gap ${activity.gap_id}.`,
      data: {
        state: activity.state,
        previous_goal_id: previous?.goal_id,
        previous_gap_id: previous?.gap_id
      }
    });
  }
  appendEvent(root, {
    type: mode === "start" ? "activity.started" : "activity.heartbeat",
    goal_id: activity.goal_id,
    gap_id: activity.gap_id,
    actor: { kind: "agent", name: activity.agent, skill: activity.skill },
    summary: activity.summary || `${activity.agent} is ${activity.state}.`,
    data: {
      state: activity.state,
      expires_at: activity.expires_at
    }
  });
}

export function publishActivityFinished(root: string, input: {
  previous?: NoriActivity;
  activity: NoriActivity;
}): void {
  const { previous, activity } = input;
  if (previous?.goal_id && previous.gap_id) {
    appendEvent(root, {
      type: "ac.finished",
      goal_id: previous.goal_id,
      gap_id: previous.gap_id,
      actor: { kind: "agent", name: activity.agent, skill: activity.skill },
      summary: activity.summary || `Finished working on acceptance gap ${previous.gap_id}.`,
      data: {
        state: activity.state,
        next_goal_id: activity.goal_id,
        next_gap_id: activity.gap_id
      }
    });
  }
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
}
