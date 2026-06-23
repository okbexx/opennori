import type { AgentNext } from "./types.ts";
import { agentNext } from "./agent-next-builder.ts";

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
