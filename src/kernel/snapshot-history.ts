import { findHistoryPairs, readGoalPayload } from "../core/shared.ts";
import type { NoriIdleSummary } from "../types.ts";
import { projectRelative } from "./snapshot-paths.ts";

export function latestHistorySummary(root: string): NoriIdleSummary {
  const history = findHistoryPairs(root)
    .map((pair) => {
      try {
        const payload = readGoalPayload(pair);
        return {
          pair,
          contract: payload.contract,
          ledger: payload.ledger,
          updatedAt: payload.ledger.updated_at || payload.contract.created_at || ""
        };
      } catch {
        return null;
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));

  const latest = history[0];
  return {
    state: "no_current_goal",
    message: "No current Nori Contract is being observed.",
    next: latest
      ? "Review the last report or ask the agent to use OpenNori for the next goal."
      : "Ask the agent to use OpenNori for a goal, then approve a Nori Contract.",
    last_goal: latest
      ? {
          id: latest.contract.goal_id,
          label: latest.contract.goal,
          workflow_status: latest.ledger.status,
          location: latest.pair.location,
          updated_at: latest.ledger.updated_at,
          dossier_path: projectRelative(root, latest.pair.goalDir),
          readme_path: projectRelative(root, latest.pair.acceptancePath),
          report_path: projectRelative(root, latest.pair.reportPath)
        }
      : undefined
  };
}
