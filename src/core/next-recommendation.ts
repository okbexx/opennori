import type { NextRecommendation } from "../types/agent.ts";
import type { NoriContract } from "../types/contract.ts";
import type { EvidenceLedger } from "../types/evidence.ts";
import { reviewAcceptanceQuality } from "../acceptance.ts";
import { currentGap, evidenceHealth } from "./evidence.ts";
import { emptyProjectProfile, profileCompliance } from "./profile.ts";
import {
  architectureReviewActions,
  architectureReviewRisks,
  architectureReviewSkill,
  profileReviewRisks,
  reviewRiskSkill,
  reviewRiskSources,
  type CompletionContext
} from "./completion-risks.ts";
import { interventionForProfile } from "./intervention.ts";

export function nextRecommendation(
  contract: NoriContract,
  ledger: EvidenceLedger,
  { root = process.cwd(), architecture = undefined, profile = emptyProjectProfile() }: CompletionContext = {}
): NextRecommendation {
  const gap = currentGap(contract, ledger, profile);
  const needed = interventionForProfile(contract, ledger, profile);
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const health = evidenceHealth(contract, ledger, { root });
  const profileStatus = profileCompliance(profile, ledger);

  if (needed.required) {
    return {
      status: "user-intervention-required",
      focus: needed.criterion || null,
      summary: `${needed.criterion || "OpenNori"} needs user input before the agent continues.`,
      actions: [
        needed.action,
        "After the decision or external condition is available, record evidence and rerun OpenNori status."
      ]
    };
  }

  const architectureRisks = architectureReviewRisks(architecture);
  if (
    gap
    && gap.id !== "ACCEPTANCE-BASIS"
    && architecture
    && architecture.requirement.status === "unknown"
    && architecture.requirement.goal_id
  ) {
    return {
      status: "architecture-requirement-required",
      focus: gap.id,
      recommended_skill: "nori-architecture-brainstorm",
      summary: "Product AC is ready, but the agent/user has not recorded whether this goal needs Architecture Baseline review.",
      actions: architectureReviewActions(architecture)
    };
  }

  if (
    gap
    && gap.id !== "ACCEPTANCE-BASIS"
    && architecture
    && architecture.required_for_goal
    && (architecture.decision !== "valid" || architecture.build_vs_buy.status !== "clear" || architecture.evidence_health.status !== "clear")
  ) {
    const skill = architectureReviewSkill(architecture);
    return {
      status: "architecture-review-required",
      focus: gap.id,
      recommended_skill: skill,
      summary: `Product AC is ready, but architecture needs review before non-trivial implementation continues: ${architectureRisks.join(", ")}.`,
      actions: architectureReviewActions(architecture)
    };
  }

  if (gap) {
    if (gap.id === "ACCEPTANCE-BASIS") {
      return {
        status: "acceptance-approval-required",
        focus: gap.id,
        summary: "Acceptance criteria need user approval or revision before implementation work counts as complete.",
        actions: [
          "Ask the user to approve or revise the acceptance criteria before implementation work continues."
        ]
      };
    }

    const hasConfirmedArchitecture = Boolean(architecture?.required_for_goal && architecture.decision === "valid");
    return {
      status: "work-on-current-gap",
      focus: gap.id,
      recommended_skill: hasConfirmedArchitecture ? "nori-architecture-apply" : "nori-evidence",
      summary: `Continue with ${gap.id}: ${gap.user_story}`,
      actions: hasConfirmedArchitecture
        ? [
            `Apply the confirmed Architecture Baseline while working on ${gap.id}.`,
            `After implementation or verification, record reviewable evidence for ${gap.id} and rerun OpenNori status.`
          ]
        : [
            `Create or collect reviewable evidence for ${gap.id}.`,
            `Record the result for ${gap.id}, then rerun OpenNori status.`
          ]
    };
  }

  const reviewRisks = [
    ...reviewRiskSources(acceptanceReview, health),
    ...profileReviewRisks(ledger, { profile }),
    ...architectureReviewRisks(architecture)
  ];
  if (ledger.status === "complete" && reviewRisks.length > 0) {
    const actions: string[] = [];
    if (acceptanceReview.status !== "clear") {
      actions.push("Show unresolved acceptance ambiguity to the user.");
      actions.push("Use nori-acceptance to ask the concrete missing acceptance questions, then revise the affected criteria, record explicit assumptions, or ask the user to accept the remaining review risk.");
    }
    if (health.status !== "clear") {
      actions.push("Review evidence_health findings.");
      actions.push("Refresh stale, broad, or summary-only evidence with reviewable sources, reviewability, and limitations.");
    }
    if (profileStatus.review.length > 0) {
      actions.push("Review Project Profile preference risks.");
      actions.push("Record profile evidence, waive the preference, or ask the user whether the remaining profile risk is acceptable.");
    }
    if (architecture && architectureReviewRisks(architecture).includes("architecture_review")) {
      actions.push("Review architecture_check warnings.");
      actions.push("Confirm, repair, or challenge the Architecture Baseline before reporting confidently complete.");
    }
    if (architecture && architectureReviewRisks(architecture).includes("architecture_requirement")) {
      actions.push("Decide whether the completed goal required Architecture Baseline review.");
      actions.push("Record required, not_required, or waived with a reason before reporting confidently complete.");
    }
    if (architecture && architectureReviewRisks(architecture).includes("architecture_waived")) {
      actions.push("Review the recorded architecture waiver and its reason.");
      actions.push("Ask the user whether the remaining architecture review risk is acceptable.");
    }
    if (architecture && architectureReviewRisks(architecture).includes("build_vs_buy")) {
      actions.push("Review build_vs_buy findings.");
      actions.push("Record reusable alternatives or the reason self-build is justified before reporting mature architecture completion.");
    }
    if (architecture && architectureReviewRisks(architecture).includes("architecture_evidence")) {
      actions.push("Review architecture_evidence health findings.");
      actions.push("Move misplaced profile/source/temp files out of .opennori/architecture/evidence or replace them with valid architecture apply records.");
    }
    return {
      status: "completion-review-required",
      focus: null,
      recommended_skill: reviewRiskSkill({ acceptanceReview, architecture }),
      summary: `All required ACs have passing or waived evidence, but completion has review risk: ${reviewRisks.join(", ")}.`,
      actions
    };
  }

  if (ledger.status === "complete") {
    return {
      status: "ready-for-next-loop",
      focus: null,
      summary: "This OpenNori goal is complete. If the user has asked to continue, the agent should prepare the next human-facing NoriBrief from current context and user intent.",
      actions: [
        "Report the completion evidence briefly.",
        "Use OpenNori Skills to ask or infer the next human-facing goal from the user's request and current context.",
        "Use OpenNori Skills to prepare a full NoriBrief, then run opennori draft --brief; do not treat next-step suggestions as approved AC or evidence."
      ]
    };
  }

  return {
    status: "reconcile-workflow-state",
    focus: null,
    summary: `No current gap was found, but workflow status is ${ledger.status}.`,
    actions: [
      "Run OpenNori evaluate and doctor, then inspect the report before continuing."
    ]
  };
}
