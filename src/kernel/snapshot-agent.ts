import type { NoriActivity } from "../types/kernel.ts";

export function defaultAgentSummary(message: string) {
  return {
    name: "Agent",
    state: "idle" as const,
    summary: message
  };
}

export function activityAgentSummary(activity: NoriActivity | null, fallback: string) {
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
