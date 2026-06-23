import type { AgentNext } from "./agent.ts";
import type { ArchitectureState } from "./architecture.ts";
import type { ActiveGoalSummary } from "./manifest.ts";
import type { PluginState } from "./plugin-state.ts";

export type DoctorIssue = {
  goal_id: string;
  message: string;
  path?: string;
};

export type DoctorCheck = {
  name: string;
  ok: boolean;
  summary: string;
  recovery?: string;
  severity?: string;
};

export type DoctorRecoveryAction = {
  check: string;
  severity: string;
  action: string;
  goal_id?: string;
  path?: string;
};

export type DoctorState = {
  status: "ready" | "needs-action" | "broken";
  checks: DoctorCheck[];
  recovery_actions: DoctorRecoveryAction[];
  active_goals: ActiveGoalSummary[];
  current_goal?: ActiveGoalSummary | null;
  draft_goals?: ActiveGoalSummary[];
  legacy_active_goals?: ActiveGoalSummary[];
  active_goal_issues: DoctorIssue[];
  manifest_path: string;
  plugin: PluginState;
  architecture: ArchitectureState;
  agent_next?: AgentNext;
};
