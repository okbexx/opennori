import type { AgentNext, NextRecommendation } from "./types/agent.ts";
import type { CurrentGap } from "./types/contract.ts";
import { agentNext } from "./agent-next-builder.ts";

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
