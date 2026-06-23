import fs from "node:fs";
import { defineCommand } from "citty";
import { architectureState, writeArchitectureRequirement } from "../../../architecture.ts";
import {
  appendEvent,
  ok,
  pathsForGoal,
  readGoalPayload,
  refreshSnapshot
} from "../../../core.ts";
import { goalReviewState, refreshManifest } from "../../../lifecycle.ts";
import type { ArchitectureRequirementStatus } from "../../../types/architecture.ts";
import { runJsonCommand } from "../../runtime.ts";
import { jsonArg, resolveRoot, rootArg } from "./shared.ts";

function requirementStatus(value: unknown): ArchitectureRequirementStatus {
  if (value === "required" || value === "not_required" || value === "waived" || value === "unknown") return value;
  throw new Error("--status must be one of unknown, required, not_required, or waived");
}

export const architectureRequirementCommand = defineCommand({
  meta: {
    name: "requirement",
    description: "Record whether a goal needs Architecture Baseline review."
  },
  args: {
    root: rootArg,
    goalId: {
      type: "string",
      description: "Goal id the requirement decision applies to."
    },
    status: {
      type: "string",
      description: "unknown, required, not_required, or waived."
    },
    reason: {
      type: "string",
      description: "Why the agent or user made this requirement decision."
    },
    decidedBy: {
      type: "string",
      description: "Who made the decision, such as agent or user.",
      default: "agent"
    },
    source: {
      type: "string",
      description: "Optional source for the decision."
    },
    limitations: {
      type: "string",
      description: "Optional limitations or review risk for this decision."
    },
    json: jsonArg
  },
  run({ args }) {
    const root = resolveRoot(args.root);
    const goalId = String(args.goalId || "").trim();
    if (!goalId) throw new Error("--goal-id is required");
    const status = requirementStatus(args.status);
    const requirement = writeArchitectureRequirement(root, {
      goalId,
      status,
      reason: String(args.reason || ""),
      decidedBy: String(args.decidedBy || "agent"),
      source: args.source ? String(args.source) : undefined,
      limitations: args.limitations ? String(args.limitations) : undefined
    });
    refreshManifest(root);
    appendEvent(root, {
      type: "architecture.changed",
      goal_id: goalId,
      actor: { kind: requirement.decided_by === "user" ? "user" : "agent", name: requirement.decided_by || "Agent", skill: "nori-architecture-brainstorm" },
      summary: `Architecture requirement is ${requirement.status}: ${requirement.reason}`,
      data: { requirement }
    });

    const architecture = architectureState(root, goalId);
    const activePaths = pathsForGoal(root, goalId);
    let current_gap;
    let recommendation;
    let agent_next;
    if (fs.existsSync(activePaths.evidencePath)) {
      const payload = readGoalPayload(activePaths);
      const review = goalReviewState(root, payload.contract, payload.ledger);
      current_gap = review.current_gap;
      recommendation = review.next_recommendation;
      agent_next = review.agent_next;
      refreshSnapshot(root, { goalId });
    }

    return ok(
      {
        root,
        goal_id: goalId,
        requirement,
        architecture,
        current_gap,
        next_recommendation: recommendation,
        agent_next,
        side_effect: "write"
      },
      [{ kind: "architecture_requirement", path: requirement.path }],
      requirement.status === "waived"
        ? [{ type: "architecture_requirement", message: "Architecture review was waived. Completion can continue, but report/status will expose architecture_waived review risk." }]
        : [],
      recommendation?.actions || [
        requirement.status === "required"
          ? "Preview and confirm an Architecture Baseline before non-trivial implementation continues."
          : "Continue the current Product AC loop and record reviewable evidence."
      ]
    );
  }
});

export async function runArchitectureRequirementCommand(rawArgs: string[]) {
  return runJsonCommand(architectureRequirementCommand, rawArgs);
}
