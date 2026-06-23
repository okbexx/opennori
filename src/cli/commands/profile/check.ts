import path from "node:path";
import { defineCommand } from "citty";
import {
  appendEvent,
  findCurrentPairs,
  ok,
  readGoalPayload,
  readProjectProfile,
  refreshSnapshot,
  recomputeWorkflowStatus
} from "../../../core.ts";
import { autoProfileChecks, goalReviewState, recordAutoProfileChecks } from "../../../lifecycle.ts";
import { savePair, runJsonCommand } from "../../runtime.ts";
import {
  jsonArg,
  rootArg
} from "./shared.ts";

export const profileCheckCommand = defineCommand({
  meta: {
    name: "check",
    description: "Check Project Profile preferences against local project state."
  },
  args: {
    root: rootArg,
    goal: {
      type: "string",
      description: "Optional current goal id for recording compliance evidence."
    },
    record: {
      type: "boolean",
      description: "Record automatic profile checks into the evidence ledger.",
      default: false
    },
    json: jsonArg
  },
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    const profile = readProjectProfile(root);
    const checks = autoProfileChecks(root, profile);
    const pair = (args.goal
      ? findCurrentPairs(root).find((entry) => entry.goalId === String(args.goal))
      : findCurrentPairs(root)[0]) || null;
    let recordedGoal = null;
    let compliance = null;
    let workflowStatus = null;
    let gap = null;
    let review = null;
    if (args.record) {
      if (!pair) {
        throw new Error("No current OpenNori goal is available for recording Project Profile compliance evidence.");
      }
      const { contract, ledger } = readGoalPayload(pair);
      recordAutoProfileChecks(profile, ledger, checks);
      recomputeWorkflowStatus(contract, ledger, profile);
      savePair(pair.acceptancePath, pair.evidencePath, contract, ledger);
      review = goalReviewState(root, contract, ledger);
      appendEvent(root, {
        type: "profile.changed",
        goal_id: contract.goal_id,
        gap_id: review.current_gap?.id,
        actor: { kind: "agent", name: "Agent", skill: "nori-capability-profile" },
        summary: "Recorded automatic Project Profile compliance checks.",
        data: { check_count: checks.length }
      });
      refreshSnapshot(root, { goalId: contract.goal_id });
      recordedGoal = contract.goal_id;
      compliance = review.capability_compliance;
      workflowStatus = ledger.status;
      gap = review.current_gap;
    }

    return ok({
      goal_id: recordedGoal,
      recorded: args.record,
      checks,
      profile,
      compliance,
      workflow_status: workflowStatus,
      current_gap: gap,
      next_recommendation: review?.next_recommendation || null,
      agent_next: review?.agent_next || null
    }, [], [], review?.next_recommendation.actions || []);
  }
});

export async function runProfileCheckCommand(rawArgs: string[]) {
  return runJsonCommand(profileCheckCommand, rawArgs);
}
