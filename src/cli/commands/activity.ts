import path from "node:path";
import { defineCommand } from "citty";
import { runJsonCommand } from "../runtime.ts";
import { activityArgs, activityFinishArgs, activityShowArgs } from "./activity/args.ts";
import { activityPayload, activityShowPayload } from "./activity/payload.ts";

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
  args: activityFinishArgs,
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
  args: activityShowArgs,
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    return activityShowPayload(root);
  }
});

export async function runActivityShowCommand(rawArgs: string[]) {
  return runJsonCommand(activityShowCommand, rawArgs);
}
