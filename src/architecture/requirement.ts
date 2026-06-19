import fs from "node:fs";
import { nowIso, readJson, writeJson } from "../core.ts";
import type { ArchitectureRequirement, ArchitectureRequirementStatus } from "../types.ts";
import {
  ARCHITECTURE_REQUIREMENT_SCHEMA_VERSION,
  architectureRequirementPath,
  errorMessage,
  relativeTo
} from "./shared.ts";

export type ArchitectureRequirementInput = {
  goalId: string;
  status: ArchitectureRequirementStatus;
  reason: string;
  decidedBy?: string;
  source?: string;
  limitations?: string;
};

export function unknownArchitectureRequirement(root: string, goalId: string | undefined): ArchitectureRequirement {
  return {
    schema_version: ARCHITECTURE_REQUIREMENT_SCHEMA_VERSION,
    goal_id: goalId,
    status: "unknown",
    reason: goalId
      ? "Architecture requirement has not been decided by the agent or user for this goal."
      : "No goal is selected for architecture requirement evaluation.",
    recorded: false,
    path: goalId ? relativeTo(root, architectureRequirementPath(root, goalId)) : undefined
  };
}

function normalizeStatus(value: unknown): ArchitectureRequirementStatus {
  if (value === "required" || value === "not_required" || value === "waived" || value === "unknown") return value;
  throw new Error(`Invalid architecture requirement status: ${String(value)}`);
}

export function readArchitectureRequirement(root: string, goalId: string | undefined): ArchitectureRequirement {
  if (!goalId) return unknownArchitectureRequirement(root, goalId);
  const filePath = architectureRequirementPath(root, goalId);
  if (!fs.existsSync(filePath)) return unknownArchitectureRequirement(root, goalId);
  try {
    const payload = readJson<Partial<ArchitectureRequirement>>(filePath);
    return {
      schema_version: ARCHITECTURE_REQUIREMENT_SCHEMA_VERSION,
      goal_id: String(payload.goal_id || goalId),
      status: normalizeStatus(payload.status),
      reason: String(payload.reason || "Architecture requirement was recorded without a reason."),
      decided_by: payload.decided_by ? String(payload.decided_by) : undefined,
      decided_at: payload.decided_at ? String(payload.decided_at) : undefined,
      source: payload.source ? String(payload.source) : undefined,
      limitations: payload.limitations ? String(payload.limitations) : undefined,
      recorded: true,
      path: relativeTo(root, filePath)
    };
  } catch (error) {
    return {
      schema_version: ARCHITECTURE_REQUIREMENT_SCHEMA_VERSION,
      goal_id: goalId,
      status: "unknown",
      reason: `Architecture requirement state is unreadable: ${errorMessage(error)}`,
      recorded: false,
      path: relativeTo(root, filePath)
    };
  }
}

export function writeArchitectureRequirement(root: string, input: ArchitectureRequirementInput): ArchitectureRequirement {
  const goalId = String(input.goalId || "").trim();
  if (!goalId) throw new Error("--goal-id is required");
  const status = normalizeStatus(input.status);
  const reason = String(input.reason || "").trim();
  if (status !== "unknown" && !reason) throw new Error("--reason is required when recording an architecture requirement decision");
  const requirement: ArchitectureRequirement = {
    schema_version: ARCHITECTURE_REQUIREMENT_SCHEMA_VERSION,
    goal_id: goalId,
    status,
    reason: reason || "Architecture requirement returned to unknown; the agent or user must decide before implementation.",
    decided_by: input.decidedBy || "agent",
    decided_at: nowIso(),
    source: input.source,
    limitations: input.limitations,
    recorded: true,
    path: relativeTo(root, architectureRequirementPath(root, goalId))
  };
  writeJson(architectureRequirementPath(root, goalId), requirement);
  return requirement;
}
