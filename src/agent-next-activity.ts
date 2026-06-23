import type { AgentNext } from "./types/agent.ts";

export type AgentNextActivityInput = {
  state: AgentNext["state"];
  recommendedSkill: AgentNext["recommended_skill"];
  summary: string;
  goalId?: string;
  currentGapId?: string | null;
  needsUser?: boolean;
};

function shellArg(value: string): string {
  return /^[A-Za-z0-9._:/=@+-]+$/.test(value) ? value : JSON.stringify(value);
}

function activityStateFor(input: AgentNextActivityInput): string {
  if (input.needsUser) return "waiting_user";
  if (input.state === "evidence_ready_for_recording" || input.state === "evidence_needs_review") return "verifying";
  if (input.state === "architecture_needs_review" || input.state === "architecture_requirement_needs_decision") return "thinking";
  if (input.state === "ready_for_next_loop") return "thinking";
  if (input.state === "state_needs_reconcile" || input.state === "health_needs_recovery") return "blocked";
  return "working";
}

export function dashboardActivityFor(input: AgentNextActivityInput): AgentNext["dashboard_activity"] {
  if (!input.goalId && !input.currentGapId) return undefined;
  const skill = input.recommendedSkill || "nori";
  const state = activityStateFor(input);
  const goalPart = input.goalId ? ` --goal ${shellArg(input.goalId)}` : "";
  const gapPart = input.currentGapId ? ` --gap ${shellArg(input.currentGapId)}` : "";
  const skillPart = ` --skill ${shellArg(skill)}`;
  const statePart = ` --state ${shellArg(state)}`;
  const summary = shellArg(input.summary);
  return {
    recommended: !input.needsUser || state === "waiting_user",
    target: {
      goal_id: input.goalId,
      gap_id: input.currentGapId
    },
    start_command: `opennori activity start --root <repo>${goalPart}${gapPart}${skillPart}${statePart} --summary ${summary} --json`,
    heartbeat_command: `opennori activity heartbeat --root <repo>${skillPart}${statePart} --summary ${summary} --json`,
    finish_command: `opennori activity finish --root <repo>${goalPart}${gapPart}${skillPart} --summary "OpenNori activity finished." --json`,
    note: "Optional live dashboard signal for Skills. Activity is not Product AC evidence, not a process log, and not completion proof."
  };
}
