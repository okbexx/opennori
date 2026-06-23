import path from "node:path";
import { findCurrentPairs } from "../core/goal-state.ts";
import { ok } from "../core/io.ts";
import { buildSnapshot } from "../kernel/snapshot-builder.ts";
import { buildContextExport } from "../lifecycle/context-export.ts";
import { doctor } from "../lifecycle/doctor.ts";
import type { DoctorState, NoriResult } from "../types/lifecycle.ts";
import type {
  McpCapabilityModel,
  McpContextResource,
  McpDoctorResource,
  McpResourceDescriptor,
  McpResourceName,
  McpResourcePayload,
  McpResourceSummary,
  McpSnapshotResource
} from "./types.ts";

export const MCP_RESOURCE_DESCRIPTORS: McpResourceDescriptor[] = [
  {
    name: "context",
    title: "OpenNori Context",
    uri: "opennori://project/context",
    description: "Current Nori Contract, acceptance checks, evidence health, Project Profile, architecture, report paths, and agent_next routing.",
    mimeType: "application/json"
  },
  {
    name: "snapshot",
    title: "OpenNori Snapshot",
    uri: "opennori://project/snapshot",
    description: "Read-only dashboard-aligned projection of current goal, current gap, activity, events, profile compliance, and completion decision.",
    mimeType: "application/json"
  },
  {
    name: "doctor",
    title: "OpenNori Doctor",
    uri: "opennori://project/doctor",
    description: "Read-only OpenNori project health, recoverability, Plugin state, architecture health, and recovery actions.",
    mimeType: "application/json"
  }
];

export const MCP_CAPABILITY_MODEL: McpCapabilityModel = {
  schema_version: "opennori/mcp-resource-summary-v1",
  side_effect: "none",
  transport: "stdio",
  transports: ["stdio"],
  resource_mode: "read_only",
  write_capability: "none",
  state_authority: ".opennori",
  resources: MCP_RESOURCE_DESCRIPTORS,
  tools: [],
  boundary: "read-only resources only; no MCP write tools are registered",
  tool_policy: "Future MCP tools must be few, controlled, and delegate to existing CLI/core paths with dry-run or explicit confirm for writes."
};

function nextActionsFromDoctor(state: DoctorState): string[] {
  const next = state.agent_next;
  return [
    next?.user_visible_next,
    ...(next?.commands || []),
    next?.safe_next_command,
    ...state.recovery_actions.map((action) => action.action)
  ].filter(Boolean) as string[];
}

function contextStatus(state: DoctorState, currentGoalCount: number): McpContextResource["status"] {
  if (state.status !== "ready") return "health_needs_recovery";
  if (currentGoalCount === 0) return "no_current_goal";
  if (currentGoalCount > 1) return "multiple_current_goals";
  return "ready";
}

export function buildMcpContextResource(rootInput: string): NoriResult<McpContextResource> {
  const root = path.resolve(rootInput);
  const health = doctor(root);
  const pairs = findCurrentPairs(root);
  const status = contextStatus(health, pairs.length);
  const context = pairs.length === 1 && pairs[0]
    ? buildContextExport(root, pairs[0])
    : null;
  return ok({
    schema_version: "opennori/mcp-context-resource-v1",
    root,
    status,
    side_effect: "none",
    context,
    doctor: health,
    next_actions: context?.next_recommendation.actions || nextActionsFromDoctor(health)
  });
}

export function buildMcpSnapshotResource(rootInput: string, goalId?: string): NoriResult<McpSnapshotResource> {
  const root = path.resolve(rootInput);
  return ok({
    schema_version: "opennori/mcp-snapshot-resource-v1",
    root,
    side_effect: "none",
    snapshot: buildSnapshot(root, { goalId })
  });
}

export function buildMcpDoctorResource(rootInput: string): NoriResult<McpDoctorResource> {
  const root = path.resolve(rootInput);
  return ok({
    schema_version: "opennori/mcp-doctor-resource-v1",
    root,
    side_effect: "none",
    doctor: doctor(root)
  });
}

export function buildMcpResource(name: McpResourceName, root: string, options: { goalId?: string } = {}): NoriResult<McpResourcePayload> {
  if (name === "context") return buildMcpContextResource(root);
  if (name === "snapshot") return buildMcpSnapshotResource(root, options.goalId);
  return buildMcpDoctorResource(root);
}

export function mcpResourceText(payload: NoriResult<McpResourcePayload>): string {
  return JSON.stringify(payload, null, 2);
}

export function mcpResourceSummary(rootInput: string): McpResourceSummary {
  const root = path.resolve(rootInput);
  return {
    ...MCP_CAPABILITY_MODEL,
    root,
    resources: MCP_CAPABILITY_MODEL.resources.map(({ name, title, uri, description, mimeType }) => ({
      name,
      title,
      uri,
      description,
      mimeType
    }))
  };
}
