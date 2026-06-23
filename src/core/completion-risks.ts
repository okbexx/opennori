import type { AcceptanceQualityAudit } from "../types/acceptance.ts";
import type { AgentSkill } from "../types/agent.ts";
import type { ArchitectureState } from "../types/architecture.ts";
import type { EvidenceLedger } from "../types/evidence.ts";
import type { CapabilityProfile } from "../types/profile.ts";
import { emptyProjectProfile, profileCompliance } from "./profile.ts";

export type CompletionContext = {
  root?: string;
  architecture?: ArchitectureState;
  profile?: CapabilityProfile;
};

export function reviewRiskSources(acceptanceReview: AcceptanceQualityAudit, health = { status: "clear" }): string[] {
  const risks: string[] = [];
  if (acceptanceReview.status !== "clear") risks.push("acceptance_review");
  if (health.status !== "clear") risks.push("evidence_health");
  return risks;
}

export function projectProfile(context: CompletionContext = {}): CapabilityProfile {
  return context.profile || emptyProjectProfile();
}

export function profileReviewRisks(ledger: EvidenceLedger, context: CompletionContext = {}): string[] {
  return profileCompliance(projectProfile(context), ledger).review.length > 0 ? ["profile_review"] : [];
}

export function architectureReviewRisks(architecture: ArchitectureState | undefined): string[] {
  if (!architecture) return [];
  const risks: string[] = [];
  if (architecture.requirement.status === "unknown" && architecture.requirement.goal_id) {
    risks.push("architecture_requirement");
  }
  if (architecture.requirement.status === "waived") {
    risks.push("architecture_waived");
  }
  if (architecture.required_for_goal && architecture.decision !== "valid") {
    risks.push("architecture_review");
  }
  if (architecture.agent_surface && (!architecture.agent_surface.guide.installed || !architecture.agent_surface.guide.in_sync)) {
    risks.push("architecture_review");
  }
  if (architecture.build_vs_buy.status !== "clear") {
    risks.push("build_vs_buy");
  }
  if (architecture.evidence_health.status !== "clear") {
    risks.push("architecture_evidence");
  }
  return [...new Set(risks)];
}

export function architectureReviewSkill(architecture: ArchitectureState): AgentSkill {
  if (architecture.requirement.status === "unknown") return "nori-architecture-brainstorm";
  if (architecture.decision === "challenged") return "nori-architecture-challenge";
  if (architecture.evidence_health.status !== "clear") return "nori-project-health";
  if (architecture.build_vs_buy.status !== "clear") return "nori-build-vs-buy";
  if (architecture.decision === "valid") return "nori-architecture-apply";
  return "nori-architecture-brainstorm";
}

export function architectureReviewActions(architecture: ArchitectureState): string[] {
  if (architecture.requirement.status === "unknown") {
    return [
      "Decide whether this goal needs Architecture Baseline review before the current acceptance gap is implemented.",
      "Record required, not_required, or waived with a reason; do not let CLI infer this from the goal text."
    ];
  }
  if (architecture.requirement.status === "waived") {
    return [
      `Architecture review was waived: ${architecture.requirement.reason}`,
      "Continue Product AC evidence, but report this waiver as a review risk unless the user accepts it."
    ];
  }
  if (architecture.decision === "missing") {
    return [
      "Preview an Architecture Baseline from the current goal, Product AC, Project Profile, project evidence, and available profiles.",
      "Ask the user to confirm the baseline or explicitly waive architecture review before non-trivial implementation continues."
    ];
  }
  if (architecture.decision === "draft") {
    return [
      "Show the draft Architecture Baseline to the user.",
      "Ask the user to confirm, revise, or waive the baseline before non-trivial implementation continues."
    ];
  }
  if (architecture.decision === "challenged") {
    return [
      "Review the open Architecture Challenge with the user.",
      "Resolve, revise, or waive the challenge before treating the architecture as complete."
    ];
  }
  if (architecture.decision === "invalid") {
    return [
      "Repair the invalid Architecture Baseline state before implementation continues.",
      "Run OpenNori check or doctor again after the baseline is recoverable."
    ];
  }
  if (architecture.evidence_health.status !== "clear") {
    return [
      "Clean invalid files from .opennori/architecture/evidence before treating architecture state as recoverable.",
      "Move profile/source/temp JSON out of architecture evidence, or replace it with a valid architecture apply record."
    ];
  }
  if (architecture.build_vs_buy.status !== "clear") {
    return [
      "Review build_vs_buy findings before custom infrastructure work continues.",
      "Record reusable alternatives or the reason self-build is justified."
    ];
  }
  return [
    "Apply the confirmed Architecture Baseline while working on the current acceptance gap."
  ];
}

export function reviewRiskSkill(input: {
  acceptanceReview: AcceptanceQualityAudit;
  architecture?: ArchitectureState;
}): AgentSkill {
  if (input.architecture && architectureReviewRisks(input.architecture).includes("architecture_evidence")) return "nori-project-health";
  if (input.acceptanceReview.status !== "clear") return "nori-acceptance";
  return "nori-reporting";
}
