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

export type McpToolDescriptor = {
  name: string;
  title: string;
  description: string;
  write_capability: "dry_run" | "confirmed_write";
  state_authority: "cli-core";
};

export type McpCapabilityModel = {
  schema_version: "opennori/mcp-resource-summary-v1";
  side_effect: "none";
  transport: "stdio";
  transports: readonly ["stdio"];
  resource_mode: "read_only";
  write_capability: "none";
  state_authority: ".opennori";
  resources: readonly McpResourceDescriptor[];
  tools: readonly McpToolDescriptor[];
  boundary: string;
  tool_policy: string;
};

export type McpResourceSummary = McpCapabilityModel & {
  root: string;
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
