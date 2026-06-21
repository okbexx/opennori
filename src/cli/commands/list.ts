import path from "node:path";
import { defineCommand } from "citty";
import { currentGap, findCurrentPairs, findDraftPairs, findHistoryPairs, ok, readGoalPayload } from "../../core.ts";
import { runJsonCommand } from "../runtime.ts";

function summarizePairs(pairs: ReturnType<typeof findCurrentPairs>) {
  return pairs.map((pair) => {
    const payload = readGoalPayload(pair);
    return {
      goal_id: pair.goalId,
      location: pair.location,
      status: payload.ledger?.status || "unknown",
      current_gap: currentGap(payload.contract, payload.ledger),
      acceptance_path: pair.acceptancePath,
      evidence_path: pair.evidencePath
    };
  });
}

export const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List current, draft, and historical OpenNori goals."
  },
  args: {
    root: {
      type: "string",
      description: "Project root.",
      default: process.cwd()
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    const currentGoals = summarizePairs(findCurrentPairs(root));
    return ok({
      root,
      current_goal: currentGoals[0] || null,
      current_goals: currentGoals,
      active_goals: currentGoals,
      draft_goals: summarizePairs(findDraftPairs(root)),
      history_goals: summarizePairs(findHistoryPairs(root))
    });
  }
});

export async function runListCommand(rawArgs: string[]) {
  return runJsonCommand(listCommand, rawArgs);
}
