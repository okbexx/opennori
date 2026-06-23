import type { NoriIdleSummary, NoriSnapshot } from "../types.ts";
import type { currentGap } from "../core/evidence.ts";
import type { profileCompliance, readProjectProfile } from "../core/profile.ts";
import type { completionAnswer, interventionForProfile } from "../core/report.ts";

export function profileOutcomeSummary(input: {
  hasCurrentGoal: boolean;
  profile: ReturnType<typeof readProjectProfile>;
  compliance: ReturnType<typeof profileCompliance>;
}) {
  if (!input.profile.items.length) {
    return {
      scope: "project_only" as const,
      state: "idle" as const,
      label: "No Project Profile items",
      detail: "No project-level Skill, stack, avoid, or install policy preferences are configured."
    };
  }
  if (!input.hasCurrentGoal) {
    return {
      scope: "project_only" as const,
      state: "idle" as const,
      label: "Project Profile loaded",
      detail: "Project Profile is project-level source data. Compliance is evaluated only against a current goal."
    };
  }
  if (input.compliance.blocking.length > 0) {
    return {
      scope: "current_goal_compliance" as const,
      state: "blocked" as const,
      label: "Project Profile blocks completion",
      detail: `${input.compliance.blocking.length} must/avoid item needs evidence, revision, or waiver.`
    };
  }
  if (input.compliance.review.length > 0) {
    return {
      scope: "current_goal_compliance" as const,
      state: "review" as const,
      label: "Project Profile needs review",
      detail: `${input.compliance.review.length} preferred or avoid item still needs review before confident completion.`
    };
  }
  return {
    scope: "current_goal_compliance" as const,
    state: "clear" as const,
    label: "Project Profile clear",
    detail: "Current goal has no blocking Project Profile compliance gaps."
  };
}

export function noGoalOutcomeSummary(
  idleSummary: NoriIdleSummary,
  projectProfile: ReturnType<typeof readProjectProfile>,
  capabilityCompliance: ReturnType<typeof profileCompliance>
) {
  return {
    decision: {
      state: "no_active_goal" as const,
      label: "No current goal",
      detail: idleSummary.message
    },
    current_gap: {
      id: null,
      label: "No current acceptance gap",
      detail: idleSummary.last_goal
        ? `Last outcome: ${idleSummary.last_goal.label}`
        : "Approve a Nori Contract before OpenNori can track a current gap."
    },
    need_user: {
      required: true,
      label: "Start in agent chat",
      action: idleSummary.next
    },
    next: {
      label: "Next",
      action: idleSummary.next
    },
    profile: profileOutcomeSummary({
      hasCurrentGoal: false,
      profile: projectProfile,
      compliance: capabilityCompliance
    })
  };
}

export function activeOutcomeSummary(input: {
  decision: NoriSnapshot["decision"];
  gap: ReturnType<typeof currentGap>;
  completion: ReturnType<typeof completionAnswer>;
  userIntervention: ReturnType<typeof interventionForProfile>;
  projectProfile: ReturnType<typeof readProjectProfile>;
  capabilityCompliance: ReturnType<typeof profileCompliance>;
}) {
  const decisionLabel = input.completion.complete
    ? input.completion.confidence === "review-risk" ? "Complete with review risk" : "Complete"
    : "Not complete yet";
  const gapSummary = input.gap
    ? {
        id: input.gap.id,
        label: input.gap.user_story,
        detail: `${input.gap.id} is ${input.gap.status}: ${input.gap.reason}`
      }
    : {
        id: null,
        label: "No open acceptance gap",
        detail: input.completion.complete
          ? "All required acceptance checks have completion evidence or waiver."
          : "OpenNori has no current gap, but workflow status still needs review."
      };
  const nextAction = input.userIntervention.required
    ? input.userIntervention.action
    : input.gap
      ? `Work on ${input.gap.id}, then attach reviewable evidence.`
      : input.completion.complete
        ? "Review the report and decide whether to accept the outcome or start the next Nori Contract."
        : "Review status and evidence before making a completion decision.";
  return {
    decision: {
      state: input.decision,
      label: decisionLabel,
      detail: input.completion.answer
    },
    current_gap: gapSummary,
    need_user: {
      required: input.userIntervention.required,
      label: input.userIntervention.required ? "User decision needed" : "No user action needed",
      action: input.userIntervention.action
    },
    next: {
      label: input.userIntervention.required ? "Reply in agent chat" : "Next",
      action: nextAction
    },
    profile: profileOutcomeSummary({
      hasCurrentGoal: true,
      profile: input.projectProfile,
      compliance: input.capabilityCompliance
    })
  };
}
