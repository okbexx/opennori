import { spawnSync } from "node:child_process";
import path from "node:path";
import { defineCommand } from "citty";
import { currentGap, findCurrentPairs, findDraftPairs, ok, readGoalPayload } from "../../core.ts";
import { runJsonCommand } from "../runtime.ts";

type ChangedFile = {
  status: string;
  path: string;
};

type GitChanges = {
  available: boolean;
  acceptance: ChangedFile[];
  implementation: ChangedFile[];
  raw_error?: string;
};

function classifyChangedFile(filePath: string): "acceptance" | "implementation" {
  if (
    filePath.startsWith(".opennori/") ||
    filePath.startsWith("examples/")
  ) {
    return "acceptance";
  }
  return "implementation";
}

function gitChanges(root: string): GitChanges {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all"], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    return { available: false, acceptance: [], implementation: [], raw_error: result.stderr.trim() };
  }

  const grouped: GitChanges = { available: true, acceptance: [], implementation: [] };
  for (const line of result.stdout.split("\n")) {
    if (!line.trim()) continue;
    const status = line.slice(0, 2).trim() || "modified";
    const rawPath = line.slice(3).trim();
    const filePath = rawPath.includes(" -> ") ? rawPath.split(" -> ").at(-1) || rawPath : rawPath;
    grouped[classifyChangedFile(filePath)].push({ status, path: filePath });
  }
  return grouped;
}

function summarizePairs(pairs: ReturnType<typeof findCurrentPairs>) {
  return pairs.map((pair) => {
    const payload = readGoalPayload(pair);
    return {
      goal_id: pair.goalId,
      location: pair.location,
      workflow_status: payload.ledger?.status || "unknown",
      current_gap: currentGap(payload.contract, payload.ledger)
    };
  });
}

export const changesCommand = defineCommand({
  meta: {
    name: "changes",
    description: "Group current git changes by OpenNori acceptance assets and implementation files."
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
      changed_files: gitChanges(root)
    });
  }
});

export async function runChangesCommand(rawArgs: string[]) {
  return runJsonCommand(changesCommand, rawArgs);
}
