import type { ArchitectureState } from "./architecture.ts";
import type { WorkflowStatus } from "./common.ts";
import type { CurrentGap } from "./contract.ts";
import type { PluginState } from "./plugin-state.ts";

export type ManifestManagedFile = {
  path: string;
  kind: string;
  required: boolean;
  exists: boolean;
};

export type ActiveGoalSummary = {
  goal_id: string;
  location?: "current" | "drafts" | "completed" | "blocked" | "active" | string;
  status: WorkflowStatus | "unknown" | "unreadable" | string;
  current_gap: CurrentGap | null;
  acceptance_path: string;
  evidence_path: string;
  recoverable: boolean;
  schema_valid?: boolean;
  error?: string;
};

export type Manifest = {
  schema_version: string;
  protocol_version: string;
  opennori_version: string;
  created_at: string;
  updated_at: string;
  capabilities: string[];
  managed_files: ManifestManagedFile[];
  active_goals: ActiveGoalSummary[];
  current_goal?: ActiveGoalSummary | null;
  draft_goals?: ActiveGoalSummary[];
  history_goals?: ActiveGoalSummary[];
  legacy_active_goals?: ActiveGoalSummary[];
  plugin: PluginState;
  architecture: ArchitectureState;
  [key: string]: unknown;
};
