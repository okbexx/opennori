import path from "node:path";
import { findCurrentPairs, ok } from "../core.ts";
import { buildSnapshot } from "../kernel/snapshot.ts";
import { buildContextExport, doctor } from "../lifecycle.ts";
import type { DoctorState, JsonObject, NoriResult } from "../types.ts";
import type {
  McpContextResource,
  McpDoctorResource,
  McpResourceDescriptor,
  McpResourceName,
  McpResourcePayload,
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

export function mcpResourceSummary(rootInput: string): JsonObject {
  const root = path.resolve(rootInput);
  return {
    schema_version: "opennori/mcp-resource-summary-v1",
    root,
    side_effect: "none",
    resources: MCP_RESOURCE_DESCRIPTORS.map(({ name, title, uri, description, mimeType }) => ({
      name,
      title,
      uri,
      description,
      mimeType
    })),
    tools: [],
    boundary: "read-only resources only; no MCP write tools are registered"
  };
}
