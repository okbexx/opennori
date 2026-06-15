import type {
  ActiveGoalSummary,
  AgentNext,
  BootstrapData,
  CurrentGap,
  DoctorState,
  NextRecommendation
} from "./types.ts";

const VERSION = "opennori/agent-next-v1" as const;

type AgentNextInput = {
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

function agentNext(input: AgentNextInput): AgentNext {
  const next: AgentNext = {
    schema_version: VERSION,
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
  return next;
}

function activeGoalCount(doctor: DoctorState | undefined): number {
  return doctor?.active_goals?.filter((goal) => goal.recoverable !== false).length ?? 0;
}

function firstActiveGoal(doctor: DoctorState | undefined): ActiveGoalSummary | undefined {
  return doctor?.active_goals?.find((goal) => goal.recoverable !== false);
}

export function agentNextForBootstrap(data: Pick<BootstrapData, "status" | "root" | "doctor">): AgentNext {
  if (data.status === "needs_confirm") {
    return agentNext({
      state: "setup_preview_needs_confirmation",
      recommendedSkill: "nori-project-health",
      summary: "OpenNori project initialization is only previewed.",
      instruction: "Show the preview to the user and ask for explicit confirmation before writing .opennori state.",
      userVisibleNext: "Confirm initialization or revise the setup target.",
      needsUser: true,
      commands: [`opennori init --root ${data.root} --confirm --json`]
    });
  }

  if (data.doctor.status !== "ready") {
    return agentNextForDoctor(data.root, data.doctor);
  }

  if (activeGoalCount(data.doctor) === 0) {
    return agentNext({
      state: "initialized_no_active_contract",
      recommendedSkill: "nori-acceptance",
      summary: "OpenNori is initialized, and no active Nori Contract exists yet.",
      instruction: "Use the user's already stated natural-language goal if the current conversation includes one; otherwise ask for the goal. Then run acceptance discovery or draft human-centered acceptance criteria before implementation.",
      userVisibleNext: "Continue with acceptance discovery for the stated goal, or ask for the goal if it was not provided.",
      needsUser: true,
      commands: [`opennori doctor --root ${data.root} --json`]
    });
  }

  const goal = firstActiveGoal(data.doctor);
  return agentNext({
    state: "ready_with_active_goals",
    recommendedSkill: "nori-reporting",
    summary: "OpenNori is ready and has active Nori Contracts.",
    instruction: "Resume the active contract and report the current gap, completion decision, and evidence basis.",
    userVisibleNext: goal?.current_gap
      ? `Continue from current gap ${goal.current_gap.id}.`
      : "Resume the active OpenNori goal.",
    goalId: goal?.goal_id,
    currentGapId: goal?.current_gap?.id ?? null,
    needsUser: false,
    commands: goal ? [`opennori resume --root ${data.root} --goal ${goal.goal_id} --json`] : [`opennori list --root ${data.root} --json`]
  });
}

export function agentNextForDoctor(root: string, doctor: DoctorState): AgentNext {
  if (doctor.status !== "ready") {
    const missingProjectState = doctor.checks.some((check) => check.name === "opennori_directory" && !check.ok);
    return agentNext({
      state: "health_needs_recovery",
      recommendedSkill: "nori-project-health",
      summary: missingProjectState
        ? "This project has no .opennori state yet."
        : `OpenNori health is ${doctor.status}.`,
      instruction: missingProjectState
        ? "Run the init preview, summarize the planned .opennori writes in human terms, and ask for confirmation before writing."
        : "Summarize failed checks and recovery actions; preview any lifecycle write before asking the user to confirm.",
      userVisibleNext: missingProjectState
        ? "Preview OpenNori project initialization, then ask for confirmation."
        : "Recover OpenNori bundle readiness before continuing the acceptance loop.",
      needsUser: doctor.recovery_actions.length > 0,
      safeNextCommand: missingProjectState ? `opennori init --root ${root} --json` : undefined,
      commands: [`opennori doctor --root ${root} --json`]
    });
  }

  if (doctor.active_goals.length === 0) {
    return agentNext({
      state: "initialized_no_active_contract",
      recommendedSkill: "nori-acceptance",
      summary: "OpenNori is ready, and no active Nori Contract exists yet.",
      instruction: "Do not implement yet. Use the user's already stated goal if available; otherwise ask for the goal. Run acceptance discovery or draft a Nori Contract before implementation.",
      userVisibleNext: "Turn the stated goal into human-centered acceptance criteria, or ask for the goal if it was not provided.",
      needsUser: true,
      commands: [`opennori doctor --root ${root} --json`]
    });
  }

  const goal = firstActiveGoal(doctor);
  return agentNext({
    state: "ready_with_active_goals",
    recommendedSkill: "nori-reporting",
    summary: "OpenNori is ready and has active Nori Contracts.",
    instruction: "Resume the chosen active goal; if more than one active goal exists, ask the user which goal to continue.",
    userVisibleNext: doctor.active_goals.length > 1
      ? "Choose which active Nori Contract to continue."
      : goal?.current_gap
        ? `Continue from current gap ${goal.current_gap.id}.`
        : "Review the active Nori Contract status.",
    goalId: goal?.goal_id,
    currentGapId: goal?.current_gap?.id ?? null,
    needsUser: doctor.active_goals.length > 1,
    commands: doctor.active_goals.length > 1 || !goal
      ? [`opennori list --root ${root} --json`]
      : [`opennori resume --root ${root} --goal ${goal.goal_id} --json`]
  });
}

export function agentNextForRecommendation(
  goalId: string,
  gap: CurrentGap | null,
  recommendation: NextRecommendation
): AgentNext {
  if (recommendation.status === "user-intervention-required") {
    return agentNext({
      state: "acceptance_needs_user",
      recommendedSkill: "nori-reporting",
      summary: recommendation.summary,
      instruction: "Ask the user for the required decision, permission, waiver, or missing input before claiming progress.",
      userVisibleNext: recommendation.actions[0] ?? "User input is required.",
      goalId,
      currentGapId: gap?.id ?? recommendation.focus,
      needsUser: true
    });
  }

  if (recommendation.status === "acceptance-approval-required") {
    return agentNext({
      state: "acceptance_needs_user",
      recommendedSkill: "nori-acceptance",
      summary: recommendation.summary,
      instruction: "Show the draft acceptance criteria and ask the user to approve or revise them before implementation.",
      userVisibleNext: "Approve or revise the Nori Contract acceptance criteria.",
      goalId,
      currentGapId: gap?.id ?? recommendation.focus,
      needsUser: true
    });
  }

  if (recommendation.status === "work-on-current-gap") {
    const recommendedSkill = recommendation.recommended_skill ?? "nori-evidence";
    return agentNext({
      state: "work_on_current_gap",
      recommendedSkill,
      summary: recommendation.summary,
      instruction: recommendedSkill === "nori-architecture-apply"
        ? "Apply the confirmed Architecture Baseline while working only against the current acceptance gap, then record reviewable evidence with sources, basis, confidence, and limitations."
        : "Work only against the current acceptance gap, then record reviewable evidence with sources, basis, confidence, and limitations.",
      userVisibleNext: recommendation.actions[0] ?? "Verify the current acceptance gap and attach evidence.",
      goalId,
      currentGapId: gap?.id ?? recommendation.focus,
      needsUser: false
    });
  }

  if (recommendation.status === "architecture-review-required") {
    return agentNext({
      state: "architecture_needs_review",
      recommendedSkill: recommendation.recommended_skill ?? "nori-architecture-brainstorm",
      summary: recommendation.summary,
      instruction: "Keep Product AC separate from architecture. Resolve the Architecture Baseline, challenge, or build-vs-buy review before non-trivial implementation continues, unless the user explicitly waives it.",
      userVisibleNext: recommendation.actions[0] ?? "Confirm or resolve the Architecture Baseline before implementation.",
      goalId,
      currentGapId: gap?.id ?? recommendation.focus,
      needsUser: true
    });
  }

  if (recommendation.status === "evidence-review-required") {
    return agentNext({
      state: "evidence_needs_review",
      recommendedSkill: "nori-evidence",
      summary: recommendation.summary,
      instruction: "Review stale or weak evidence with the user; record stronger evidence, a limitation, or a waiver.",
      userVisibleNext: recommendation.actions[0] ?? "Review evidence before accepting completion.",
      goalId,
      currentGapId: gap?.id ?? recommendation.focus,
      needsUser: true
    });
  }

  if (recommendation.status === "completion-review-required") {
    return agentNext({
      state: "completion_needs_review",
      recommendedSkill: "nori-reporting",
      summary: recommendation.summary,
      instruction: "Report objective completion separately from review risks and ask the user whether the remaining risk is acceptable.",
      userVisibleNext: recommendation.actions[0] ?? "Review completion risks before accepting the result.",
      goalId,
      currentGapId: gap?.id ?? recommendation.focus,
      needsUser: true
    });
  }

  if (recommendation.status === "ready-for-next-loop") {
    return agentNext({
      state: "ready_for_next_loop",
      recommendedSkill: "nori-acceptance",
      summary: recommendation.summary,
      instruction: "If the user asked to continue, choose or refine one candidate next human-facing goal and start acceptance discovery; do not treat candidates as approved AC.",
      userVisibleNext: "Choose or refine the next OpenNori goal.",
      goalId,
      currentGapId: null,
      needsUser: false
    });
  }

  if (recommendation.status === "reconcile-workflow-state") {
    return agentNext({
      state: "state_needs_reconcile",
      recommendedSkill: "nori-project-health",
      summary: recommendation.summary,
      instruction: "Reconcile contract, ledger, and workflow state before proceeding.",
      userVisibleNext: recommendation.actions[0] ?? "Repair OpenNori state before continuing.",
      goalId,
      currentGapId: gap?.id ?? recommendation.focus,
      needsUser: true
    });
  }

  return agentNext({
    state: "unknown",
    recommendedSkill: "nori",
    summary: recommendation.summary,
    instruction: "Use the root OpenNori router to choose the next Skill from the recommendation and current project state.",
    userVisibleNext: recommendation.actions[0] ?? "Review OpenNori status.",
    goalId,
    currentGapId: gap?.id ?? recommendation.focus,
    needsUser: false
  });
}
