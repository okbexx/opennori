import path from "node:path";
import { defineCommand } from "citty";
import {
  addProfileItem,
  appendEvent,
  ok,
  findCurrentPairs,
  readGoalPayload,
  readProjectProfile,
  refreshSnapshot,
  recomputeWorkflowStatus,
  writeProjectProfile,
  writeGoalDossier
} from "../../../core.ts";
import { goalReviewState, refreshManifest } from "../../../lifecycle.ts";
import { runJsonCommand } from "../../runtime.ts";
import type { ProfileItemInput } from "../../../types.ts";
import {
  jsonArg,
  rootArg,
  profileItemType,
  profileStrength,
} from "./shared.ts";

export const profileAddCommand = defineCommand({
  meta: {
    name: "add",
    description: "Add an execution preference to the OpenNori Project Profile."
  },
  args: {
    root: rootArg,
    id: {
      type: "string",
      description: "Optional stable profile item id."
    },
    type: {
      type: "string",
      description: "Preference type.",
      default: "constraint"
    },
    name: {
      type: "string",
      description: "Skill, stack, or constraint name."
    },
    strength: {
      type: "string",
      description: "must, prefer, or avoid.",
      default: "prefer"
    },
    purpose: {
      type: "string",
      description: "Why this preference matters.",
      default: ""
    },
    scope: {
      type: "string",
      description: "Where this preference applies.",
      default: ""
    },
    installPolicy: {
      type: "string",
      description: "Installation policy.",
      default: "ask_before_install"
    },
    json: jsonArg
  },
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    const item: ProfileItemInput = {
      id: args.id,
      type: profileItemType(args.type),
      name: String(args.name || ""),
      strength: profileStrength(args.strength),
      purpose: args.purpose || "",
      scope: args.scope || "",
      install_policy: args.installPolicy || "ask_before_install"
    };
    const profile = writeProjectProfile(root, addProfileItem(readProjectProfile(root), item));
    const recordedItem = profile.items.find((entry) => entry.id === item.id)
      || profile.items.find((entry) => entry.name === item.name && entry.type === item.type && entry.strength === item.strength)
      || profile.items.at(-1);
    const touchedGoals = [];
    let singleCurrentGoal = null;
    for (const pair of findCurrentPairs(root)) {
      const { contract, ledger } = readGoalPayload(pair);
      recomputeWorkflowStatus(contract, ledger, profile);
      writeGoalDossier(pair.goalDir, contract, ledger);
      const review = goalReviewState(root, contract, ledger);
      touchedGoals.push({ goal_id: contract.goal_id, workflow_status: ledger.status, current_gap: review.current_gap });
      singleCurrentGoal = touchedGoals.length === 1 ? { contract, ledger, review } : null;
      refreshSnapshot(root, { goalId: contract.goal_id });
    }
    refreshManifest(root);
    appendEvent(root, {
      type: "profile.changed",
      actor: { kind: "agent", name: "Agent", skill: "nori-capability-profile" },
      summary: `Recorded Project Profile item ${recordedItem?.name || item.name}.`,
      data: { item_id: recordedItem?.id, type: recordedItem?.type || item.type, strength: recordedItem?.strength || item.strength }
    });
    return ok({
      profile,
      touched_current_goals: touchedGoals,
      compliance: singleCurrentGoal
        ? singleCurrentGoal.review.capability_compliance
        : null,
      goal_id: singleCurrentGoal?.contract.goal_id || null,
      workflow_status: singleCurrentGoal?.ledger.status || null,
      current_gap: singleCurrentGoal?.review.current_gap || null,
      next_recommendation: singleCurrentGoal?.review.next_recommendation || null,
      agent_next: singleCurrentGoal?.review.agent_next || null
    }, [], [], singleCurrentGoal?.review.next_recommendation.actions || []);
  }
});

export async function runProfileAddCommand(rawArgs: string[]) {
  return runJsonCommand(profileAddCommand, rawArgs);
}
