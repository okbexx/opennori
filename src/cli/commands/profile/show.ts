import path from "node:path";
import { defineCommand } from "citty";
import {
  currentGap,
  findCurrentPairs,
  ok,
  readGoalPayload,
  readProjectProfile,
  profileCompliance
} from "../../../core.ts";
import { runJsonCommand } from "../../runtime.ts";
import {
  jsonArg,
  rootArg
} from "./shared.ts";

export const profileShowCommand = defineCommand({
  meta: {
    name: "show",
    description: "Show the OpenNori Project Profile and current-goal compliance when available."
  },
  args: {
    root: rootArg,
    goal: {
      type: "string",
      description: "Optional current goal id for compliance."
    },
    json: jsonArg
  },
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    const profile = readProjectProfile(root);
    const pair = (args.goal
      ? findCurrentPairs(root).find((entry) => entry.goalId === String(args.goal))
      : findCurrentPairs(root)[0]) || null;
    if (!pair) {
      return ok({
        scope: "project",
        profile,
        compliance: null,
        current_goal: null,
        current_gap: null
      });
    }
    const { contract, ledger } = readGoalPayload(pair);
    return ok({
      scope: "project",
      goal_id: contract.goal_id,
      profile,
      compliance: profileCompliance(profile, ledger),
      workflow_status: ledger.status,
      current_gap: currentGap(contract, ledger, profile)
    });
  }
});

export async function runProfileShowCommand(rawArgs: string[]) {
  return runJsonCommand(profileShowCommand, rawArgs);
}
