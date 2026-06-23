import type { NoriSnapshot } from "../types/kernel.ts";
import type { ContextExport, DoctorState } from "../types/lifecycle.ts";

export type McpResourceName = "context" | "snapshot" | "doctor";

export type McpResourceDescriptor = {
  name: McpResourceName;
  title: string;
  uri: `opennori://project/${McpResourceName}`;
  description: string;
  mimeType: "application/json";
};

export type McpContextResource = {
  schema_version: "opennori/mcp-context-resource-v1";
  root: string;
  status: "ready" | "no_current_goal" | "multiple_current_goals" | "health_needs_recovery";
  side_effect: "none";
  context: ContextExport | null;
  doctor: DoctorState;
  next_actions: string[];
};

export type McpSnapshotResource = {
  schema_version: "opennori/mcp-snapshot-resource-v1";
  root: string;
  side_effect: "none";
  snapshot: NoriSnapshot;
};

export type McpDoctorResource = {
  schema_version: "opennori/mcp-doctor-resource-v1";
  root: string;
  side_effect: "none";
  doctor: DoctorState;
};

export type McpResourcePayload = McpContextResource | McpSnapshotResource | McpDoctorResource;
