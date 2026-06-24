import { defineCommand } from "citty";
import fs from "node:fs";
import {
  architectureBaselinePaths,
  architectureState,
  buildArchitectureBaseline,
  writeArchitectureBaseline
} from "../../../architecture.ts";
import { appendEvent, ok, pathsForGoal, readGoalPayload, refreshSnapshot, slugify } from "../../../core.ts";
import { goalReviewState, refreshManifest } from "../../../lifecycle.ts";
import { runJsonCommand } from "../../runtime.ts";
import { jsonArg, relativeTo, resolveRoot, rootArg } from "./shared.ts";

export const architectureBaselineCommand = defineCommand({
  meta: {
    name: "baseline",
    description: "Preview or confirm an Architecture Baseline for a goal."
  },
  args: {
    root: rootArg,
    goal: {
      type: "string",
      description: "Natural language goal the baseline applies to."
    },
    profile: {
      type: "string",
      description: "Architecture Profile id.",
      default: "typescript-agent-state-cli"
    },
    goalId: {
      type: "string",
      description: "Optional stable goal id."
    },
    summary: {
      type: "string",
      description: "Optional baseline summary override."
    },
    confirm: {
      type: "boolean",
      description: "Persist the baseline after user confirmation.",
      default: false
    },
    json: jsonArg
  },
  run({ args }) {
    const root = resolveRoot(args.root);
    const goal = String(args.goal || "").trim();
    const profileId = args.profile || "typescript-agent-state-cli";
    const goalId = args.goalId || slugify(goal || profileId);
    const confirmed = Boolean(args.confirm);
    if (!goal) throw new Error("--goal is required");
    const baseline = buildArchitectureBaseline(root, {
      profileId,
      goal,
      goalId,
      summary: args.summary,
      accepted: confirmed
    });
    const paths = architectureBaselinePaths(root);
    if (confirmed) {
      writeArchitectureBaseline(root, baseline);
      refreshManifest(root);
      appendEvent(root, {
        type: "architecture.changed",
        goal_id: goalId,
        actor: { kind: "agent", name: "Agent", skill: "nori-architecture-brainstorm" },
        summary: `Confirmed Architecture Baseline ${baseline.profile_title || baseline.profile}.`,
        data: { profile: baseline.profile, status: baseline.status }
      });
    }
    const architecture = confirmed ? architectureState(root, goalId) : {
      ...architectureState(root, goalId),
      preview: {
        baseline_path: relativeTo(root, paths.jsonPath),
        markdown_path: relativeTo(root, paths.markdownPath),
        side_effect: "none"
      }
    };
    let current_gap;
    let recommendation;
    let agent_next;
    if (confirmed) {
      const activePaths = pathsForGoal(root, goalId);
      if (fs.existsSync(activePaths.evidencePath)) {
        const payload = readGoalPayload(activePaths);
        const review = goalReviewState(root, payload.contract, payload.ledger);
        current_gap = review.current_gap;
        recommendation = review.next_recommendation;
        agent_next = review.agent_next;
      }
      refreshSnapshot(root, { goalId });
    }
    return ok(
      {
        root,
        confirmed,
        baseline,
        architecture,
        side_effect: confirmed ? "write" : "none",
        current_gap,
        next_recommendation: recommendation,
        agent_next
      },
      confirmed
        ? [
            { kind: "architecture_baseline", path: paths.jsonPath },
            { kind: "architecture_baseline_markdown", path: paths.markdownPath }
          ]
        : [],
      [],
      confirmed
        ? recommendation?.actions || ["Implement Product AC under this Architecture Baseline. Raise an Architecture Challenge if project evidence conflicts with it."]
        : ["Review this Architecture Baseline preview. Rerun with --confirm only after it is accepted."]
    );
  }
});

export async function runArchitectureBaselineCommand(rawArgs: string[]) {
  return runJsonCommand(architectureBaselineCommand, rawArgs);
}
