import path from "node:path";
import { defineCommand } from "citty";
import { fail, finishActivity, inferActivityTarget, ok, readActivity, refreshSnapshot, snapshotPath, writeActivity } from "../../core.ts";
import type { NoriActivity, NoriActivityTarget, NoriSnapshot } from "../../types.ts";
import { runJsonCommand } from "../runtime.ts";

const rootArg = {
  type: "string",
  description: "Project root.",
  default: process.cwd()
} as const;

const jsonArg = {
  type: "boolean",
  description: "Keep deterministic JSON output for agents.",
  default: false
} as const;

const activityArgs = {
  root: rootArg,
  agent: {
    type: "string",
    description: "Agent display name.",
    default: "Agent"
  },
  skill: {
    type: "string",
    description: "OpenNori Skill currently being used."
  },
  state: {
    type: "string",
    description: "idle, thinking, working, verifying, waiting_user, or blocked.",
    default: "working"
  },
  goal: {
    type: "string",
    description: "Goal id."
  },
  gap: {
    type: "string",
    description: "Current acceptance gap id."
  },
  summary: {
    type: "string",
    description: "Short activity summary.",
    default: ""
  },
  ttl: {
    type: "string",
    description: "Activity TTL in seconds.",
    default: "90"
  },
  json: jsonArg
} as const;

function ttlMs(value: unknown): number {
  const seconds = Number(value || 90);
  if (!Number.isFinite(seconds) || seconds <= 0) return 90_000;
  return Math.min(seconds * 1000, 3_600_000);
}

function activityInput(args: Record<string, any>) {
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

function activityTarget(root: string, args: Record<string, any>) {
  return inferActivityTarget(root, {
    goal_id: args.goal ? String(args.goal) : undefined,
    gap_id: args.gap ? String(args.gap) : undefined
  });
}

function projectSnapshotPath(root: string): string {
  const filePath = snapshotPath(root);
  const relative = path.relative(root, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return filePath;
  return relative;
}

function activitySnapshotSummary(snapshot: NoriSnapshot) {
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

function responseTarget(target: NoriActivityTarget | null) {
  return target
    ? {
        goal_id: target.goal_id,
        gap_id: target.gap_id,
        gap_summary: target.gap_summary,
        inferred: target.inferred
      }
    : null;
}

function targetFromActivity(activity: NoriActivity | null): NoriActivityTarget | null {
  if (!activity?.goal_id) return null;
  return {
    goal_id: activity.goal_id,
    gap_id: activity.gap_id || null,
    inferred: false
  };
}

function activityResponse(root: string, activity: NoriActivity | null, target: NoriActivityTarget | null, snapshot: NoriSnapshot) {
  return ok({
    activity,
    target: responseTarget(target),
    snapshot_summary: activitySnapshotSummary(snapshot),
    snapshot_path: projectSnapshotPath(root),
    side_effect: "dashboard_activity_only"
  });
}

function activityPayload(root: string, args: Record<string, any>, action: "start" | "heartbeat" | "finish") {
  try {
    const previous = readActivity(root);
    const target = action !== "start" && !args.goal && previous?.goal_id
      ? {
          goal_id: previous.goal_id,
          gap_id: previous.gap_id || null,
          inferred: true
        }
      : activityTarget(root, args);
    const activity = action === "finish"
      ? finishActivity(root, {
          agent: args.agent ? String(args.agent) : undefined,
          skill: args.skill ? String(args.skill) : undefined,
          goal_id: args.goal ? String(args.goal) : target?.goal_id,
          gap_id: args.gap ? String(args.gap) : target?.gap_id || undefined,
          summary: args.summary ? String(args.summary) : undefined
        })
      : writeActivity(
          root,
          {
            ...activityInput(args),
            goal_id: args.goal ? String(args.goal) : target?.goal_id,
            gap_id: args.gap ? String(args.gap) : target?.gap_id || undefined
          },
          { mode: action }
        );
    const snapshot = refreshSnapshot(root, { goalId: activity.goal_id });
    return activityResponse(root, activity, target, snapshot);
  } catch (error) {
    return fail(
      "ambiguous_activity_target",
      error instanceof Error ? error.message : String(error),
      "Recover .opennori/current so exactly one current Nori Contract exists before publishing dashboard activity."
    );
  }
}

export const activityStartCommand = defineCommand({
  meta: {
    name: "start",
    description: "Publish current OpenNori agent activity for the local dashboard."
  },
  args: activityArgs,
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    return activityPayload(root, args, "start");
  }
});

export async function runActivityStartCommand(rawArgs: string[]) {
  return runJsonCommand(activityStartCommand, rawArgs);
}

export const activityHeartbeatCommand = defineCommand({
  meta: {
    name: "heartbeat",
    description: "Refresh OpenNori agent activity for the local dashboard."
  },
  args: activityArgs,
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    return activityPayload(root, args, "heartbeat");
  }
});

export async function runActivityHeartbeatCommand(rawArgs: string[]) {
  return runJsonCommand(activityHeartbeatCommand, rawArgs);
}

export const activityFinishCommand = defineCommand({
  meta: {
    name: "finish",
    description: "Mark OpenNori agent activity finished for the local dashboard."
  },
  args: {
    root: rootArg,
    agent: {
      type: "string",
      description: "Agent display name."
    },
    skill: {
      type: "string",
      description: "OpenNori Skill that finished."
    },
    goal: {
      type: "string",
      description: "Goal id."
    },
    gap: {
      type: "string",
      description: "Acceptance gap id."
    },
    summary: {
      type: "string",
      description: "Short finish summary.",
      default: ""
    },
    json: jsonArg
  },
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    return activityPayload(root, args, "finish");
  }
});

export async function runActivityFinishCommand(rawArgs: string[]) {
  return runJsonCommand(activityFinishCommand, rawArgs);
}

export const activityShowCommand = defineCommand({
  meta: {
    name: "show",
    description: "Show current OpenNori agent activity."
  },
  args: {
    root: rootArg,
    json: jsonArg
  },
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    const activity = readActivity(root);
    const snapshot = refreshSnapshot(root, { goalId: activity?.goal_id });
    return activityResponse(root, activity, targetFromActivity(activity), snapshot);
  }
});

export async function runActivityShowCommand(rawArgs: string[]) {
  return runJsonCommand(activityShowCommand, rawArgs);
}
