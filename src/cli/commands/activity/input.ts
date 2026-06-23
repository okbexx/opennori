import { inferActivityTarget } from "../../../core.ts";
import type { NoriActivity, NoriActivityInput, NoriActivityTarget } from "../../../types/kernel.ts";

export type ActivityAction = "start" | "heartbeat" | "finish";

export function ttlMs(value: unknown): number {
  const seconds = Number(value || 90);
  if (!Number.isFinite(seconds) || seconds <= 0) return 90_000;
  return Math.min(seconds * 1000, 3_600_000);
}

export function activityInput(args: Record<string, any>): NoriActivityInput {
  return {
    agent: String(args.agent || "Agent"),
    skill: args.skill ? String(args.skill) : undefined,
    state: args.state ? String(args.state) : undefined,
    goal_id: args.goal ? String(args.goal) : undefined,
    gap_id: args.gap ? String(args.gap) : undefined,
    summary: args.summary ? String(args.summary) : undefined,
    ttl_ms: ttlMs(args.ttl)
  };
}

export function activityTarget(root: string, args: Record<string, any>): NoriActivityTarget | null {
  return inferActivityTarget(root, {
    goal_id: args.goal ? String(args.goal) : undefined,
    gap_id: args.gap ? String(args.gap) : undefined
  });
}

export function targetForAction(root: string, args: Record<string, any>, action: ActivityAction, previous: NoriActivity | null): NoriActivityTarget | null {
  if (action !== "start" && !args.goal && previous?.goal_id) {
    return {
      goal_id: previous.goal_id,
      gap_id: previous.gap_id || null,
      inferred: true
    };
  }
  return activityTarget(root, args);
}

export function finishActivityInput(args: Record<string, any>, target: NoriActivityTarget | null): Partial<NoriActivityInput> {
  return {
    agent: args.agent ? String(args.agent) : undefined,
    skill: args.skill ? String(args.skill) : undefined,
    goal_id: args.goal ? String(args.goal) : target?.goal_id,
    gap_id: args.gap ? String(args.gap) : target?.gap_id || undefined,
    summary: args.summary ? String(args.summary) : undefined
  };
}

export function writeActivityInput(args: Record<string, any>, target: NoriActivityTarget | null): NoriActivityInput {
  return {
    ...activityInput(args),
    goal_id: args.goal ? String(args.goal) : target?.goal_id,
    gap_id: args.gap ? String(args.gap) : target?.gap_id || undefined
  };
}

export function targetFromActivity(activity: NoriActivity | null): NoriActivityTarget | null {
  if (!activity?.goal_id) return null;
  return {
    goal_id: activity.goal_id,
    gap_id: activity.gap_id || null,
    inferred: false
  };
}
