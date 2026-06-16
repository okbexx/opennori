import path from "node:path";
import { defineCommand } from "citty";
import { finishActivity, ok, readActivity, refreshSnapshot, writeActivity } from "../../core.ts";
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

export const activityStartCommand = defineCommand({
  meta: {
    name: "start",
    description: "Publish current OpenNori agent activity for the local dashboard."
  },
  args: activityArgs,
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    const activity = writeActivity(root, activityInput(args));
    const snapshot = refreshSnapshot(root, { goalId: activity.goal_id });
    return ok({
      activity,
      snapshot
    });
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
    const activity = writeActivity(root, activityInput(args));
    const snapshot = refreshSnapshot(root, { goalId: activity.goal_id });
    return ok({
      activity,
      snapshot
    });
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
    const activity = finishActivity(root, {
      agent: args.agent ? String(args.agent) : undefined,
      skill: args.skill ? String(args.skill) : undefined,
      goal_id: args.goal ? String(args.goal) : undefined,
      gap_id: args.gap ? String(args.gap) : undefined,
      summary: args.summary ? String(args.summary) : undefined
    });
    const snapshot = refreshSnapshot(root, { goalId: activity.goal_id });
    return ok({
      activity,
      snapshot
    });
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
    return ok({
      activity: readActivity(root),
      snapshot: refreshSnapshot(root)
    });
  }
});

export async function runActivityShowCommand(rawArgs: string[]) {
  return runJsonCommand(activityShowCommand, rawArgs);
}
