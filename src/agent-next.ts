import type {
  AgentNext,
  BootstrapData,
  CurrentGap,
  DoctorState,
  NextRecommendation
} from "./types.ts";
import { agentNext } from "./agent-next-builder.ts";
import { activeGoalCount, activeGoals } from "./agent-next-doctor.ts";

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
    const draftCount = data.doctor.draft_goals?.filter((goal) => goal.recoverable !== false).length ?? 0;
    return agentNext({
      state: "initialized_no_active_contract",
      recommendedSkill: "nori-acceptance",
      summary: draftCount > 0
        ? "OpenNori is initialized with draft contracts, but no current Nori Contract is approved yet."
        : "OpenNori is initialized, and no current Nori Contract exists yet.",
      instruction: draftCount > 0
        ? "Do not implement yet. Show a compact draft Nori Contract overview, then start the one-AC-at-a-time AC Review Loop. Review only the first unconfirmed AC with exact entries, objects, fields, states, non-passing examples, and evidence objects. Ask for final approve only after every AC is confirmed one by one."
        : "Use the user's already stated natural-language goal if the current conversation includes one; otherwise ask for the goal. Then run acceptance discovery or draft human-centered acceptance criteria before implementation.",
      userVisibleNext: draftCount > 0
        ? "Review and confirm the draft one AC at a time before final approval."
        : "Continue with acceptance discovery for the stated goal, or ask for the goal if it was not provided.",
      needsUser: true,
      commands: [`opennori doctor --root ${data.root} --json`]
    });
  }

  const goals = activeGoals(data.doctor);
  const goal = goals.length === 1 ? goals[0] : undefined;
  return agentNext({
    state: "ready_with_current_goal",
    recommendedSkill: "nori-reporting",
    summary: "OpenNori is ready and has a current Nori Contract.",
    instruction: goals.length > 1
      ? "Run doctor and recover .opennori/current so exactly one current Nori Contract remains before resuming work."
      : "Resume the current contract and report the current gap, completion decision, and evidence basis.",
    userVisibleNext: goals.length > 1
      ? "Recover OpenNori current state before continuing."
      : goal?.current_gap
      ? `Continue from current gap ${goal.current_gap.id}.`
      : "Resume the current OpenNori goal.",
    goalId: goal?.goal_id,
    currentGapId: goal?.current_gap?.id ?? null,
    needsUser: goals.length > 1,
    commands: goal ? [`opennori resume --root ${data.root} --json`] : [`opennori doctor --root ${data.root} --json`]
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
    const draftCount = doctor.draft_goals?.filter((goal) => goal.recoverable !== false).length ?? 0;
    return agentNext({
      state: "initialized_no_active_contract",
      recommendedSkill: "nori-acceptance",
      summary: draftCount > 0
        ? "OpenNori is ready with draft contracts, but no current Nori Contract is approved yet."
        : "OpenNori is ready, and no current Nori Contract exists yet.",
      instruction: draftCount > 0
        ? "Do not implement yet. Show a compact draft Nori Contract overview, then start the one-AC-at-a-time AC Review Loop. Review only the first unconfirmed AC with exact entries, objects, fields, states, non-passing examples, and evidence objects. Ask for final approve only after every AC is confirmed one by one."
        : "Do not implement yet. Use the user's already stated goal if available; otherwise ask for the goal. Run acceptance discovery or draft a Nori Contract before implementation.",
      userVisibleNext: draftCount > 0
        ? "Review and confirm the draft one AC at a time before final approval."
        : "Turn the stated goal into human-centered acceptance criteria, or ask for the goal if it was not provided.",
      needsUser: true,
      commands: [`opennori doctor --root ${root} --json`]
    });
  }

  const goals = activeGoals(doctor);
  const goal = goals.length === 1 ? goals[0] : undefined;
  return agentNext({
    state: "ready_with_current_goal",
    recommendedSkill: "nori-reporting",
    summary: "OpenNori is ready and has a current Nori Contract.",
    instruction: goals.length > 1
      ? "Run doctor and recover .opennori/current so exactly one current Nori Contract remains before publishing dashboard activity or resuming work."
      : "Resume the current goal and report the current gap, completion decision, and evidence basis.",
    userVisibleNext: goals.length > 1
      ? "Recover OpenNori current state before continuing."
      : goal?.current_gap
        ? `Continue from current gap ${goal.current_gap.id}.`
        : "Review the current Nori Contract status.",
    goalId: goal?.goal_id,
    currentGapId: goal?.current_gap?.id ?? null,
    needsUser: goals.length > 1,
    commands: goals.length > 1 || !goal
      ? [`opennori doctor --root ${root} --json`]
      : [`opennori resume --root ${root} --json`]
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
      instruction: "Show a compact draft acceptance overview, then start the one-AC-at-a-time AC Review Loop. For the current AC only, name exact entries, objects, fields, states, non-passing examples, and evidence objects. Ask the user to confirm or revise that AC, and ask for final approve only after every AC is confirmed one by one.",
      userVisibleNext: "Review and confirm the draft one AC at a time before final approval.",
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

  if (recommendation.status === "architecture-requirement-required") {
    return agentNext({
      state: "architecture_requirement_needs_decision",
      recommendedSkill: recommendation.recommended_skill ?? "nori-architecture-brainstorm",
      summary: recommendation.summary,
      instruction: "Decide whether the current goal needs Architecture Baseline review based on project context and user intent, then record required, not_required, or waived with a reason. Do not infer this from CLI existence of a goal.",
      userVisibleNext: recommendation.actions[0] ?? "Decide whether Architecture Baseline review is needed before implementation.",
      goalId,
      currentGapId: gap?.id ?? recommendation.focus,
      needsUser: false
    });
  }

  if (recommendation.status === "evidence-review-required") {
    return agentNext({
      state: "evidence_needs_review",
      recommendedSkill: "nori-evidence",
      summary: recommendation.summary,
      instruction: "Review evidence health findings with the user; record fresher evidence, a more reviewable source, a limitation, or a waiver.",
      userVisibleNext: recommendation.actions[0] ?? "Review evidence before accepting completion.",
      goalId,
      currentGapId: gap?.id ?? recommendation.focus,
      needsUser: true
    });
  }

  if (recommendation.status === "completion-review-required") {
    const recommendedSkill = recommendation.recommended_skill ?? "nori-reporting";
    const isAcceptanceReview = recommendedSkill === "nori-acceptance";
    return agentNext({
      state: "completion_needs_review",
      recommendedSkill,
      summary: recommendation.summary,
      instruction: isAcceptanceReview
        ? "Do not claim confident completion yet. Explain the unresolved acceptance ambiguity, ask the concrete missing acceptance questions, and revise the affected criteria or record explicit user-approved assumptions before evidence is treated as confidently complete."
        : "Report objective completion separately from review risks and ask the user whether the remaining risk is acceptable.",
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
      instruction: "If the user asked to continue, use OpenNori Skills to prepare the next human-facing NoriBrief from current context and user intent, then run opennori draft --brief. Do not expect the CLI to invent product candidate goals.",
      userVisibleNext: "Ask the agent to prepare the next Nori Contract draft from your intended next outcome.",
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

export function agentNextForArchitectureApply(input: {
  goalId: string;
  criterionId: string;
  applyId: string;
  applyPath: string;
  status: string;
}): AgentNext {
  if (input.status === "needs-challenge") {
    return agentNext({
      state: "architecture_needs_review",
      recommendedSkill: "nori-architecture-challenge",
      summary: `Architecture apply record ${input.applyId} says the current gap needs a challenge before implementation continues.`,
      instruction: "Create a reviewable Architecture Challenge before recording Product AC evidence or claiming progress.",
      userVisibleNext: "Review the architecture challenge before implementation continues.",
      goalId: input.goalId,
      currentGapId: input.criterionId,
      needsUser: true
    });
  }

  return agentNext({
    state: "evidence_ready_for_recording",
    recommendedSkill: "nori-evidence",
    summary: `Architecture context ${input.applyId} is recorded for ${input.criterionId}; Product AC evidence is still required.`,
    instruction: `Record Product AC evidence for ${input.criterionId} with a user-visible verification source. Attach this architecture context with --architecture-apply "${input.applyPath}". Do not treat the architecture context as proof by itself.`,
    userVisibleNext: `Verify ${input.criterionId} from the user's point of view and attach evidence.`,
    goalId: input.goalId,
    currentGapId: input.criterionId,
    needsUser: false,
    commands: [
      `opennori evidence add --goal ${input.goalId} --criterion ${input.criterionId} --architecture-apply "${input.applyPath}" --json`
    ]
  });
}
