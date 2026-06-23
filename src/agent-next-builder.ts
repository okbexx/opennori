import type { AgentNext } from "./types.ts";
import { dashboardActivityFor } from "./agent-next-activity.ts";

export const AGENT_NEXT_SCHEMA_VERSION = "opennori/agent-next-v1" as const;

export type AgentNextInput = {
  state: AgentNext["state"];
  recommendedSkill: AgentNext["recommended_skill"];
  summary: string;
  instruction: string;
  userVisibleNext: string;
  goalId?: string;
  currentGapId?: string | null;
  needsUser?: boolean;
  safeNextCommand?: string;
  commands?: string[];
};

export function agentNext(input: AgentNextInput): AgentNext {
  const next: AgentNext = {
    schema_version: AGENT_NEXT_SCHEMA_VERSION,
    state: input.state,
    recommended_skill: input.recommendedSkill,
    summary: input.summary,
    instruction: input.instruction,
    user_visible_next: input.userVisibleNext
  };
  if (input.goalId) next.goal_id = input.goalId;
  if (input.currentGapId !== undefined) next.current_gap_id = input.currentGapId;
  if (input.needsUser !== undefined) next.needs_user = input.needsUser;
  if (input.safeNextCommand) next.safe_next_command = input.safeNextCommand;
  if (input.commands?.length) next.commands = input.commands;
  const dashboardActivity = dashboardActivityFor(input);
  if (dashboardActivity) next.dashboard_activity = dashboardActivity;
  return next;
}
