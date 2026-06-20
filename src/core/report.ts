import type {
  AcceptanceQualityAudit,
  ArchitectureState,
  AgentSkill,
  CompletionAnswer,
  EvidenceLedger,
  EvidenceRecord,
  EvidenceSource,
  NoriContract,
  NextRecommendation,
  UserIntervention
} from "../types.ts";
import { evidenceHealth, currentGap, evidenceView } from "./evidence.ts";
import { profileCompliance, renderProfileLines } from "./profile.ts";
import { inferCriterionLayer } from "./shared.ts";
import { reviewAcceptanceQuality } from "../acceptance.ts";
import { contractLanguage } from "../language.ts";

type CompletionContext = {
  root?: string;
  architecture?: ArchitectureState;
};

function reviewRiskSources(acceptanceReview: AcceptanceQualityAudit, health = { status: "clear" }): string[] {
  const risks: string[] = [];
  if (acceptanceReview.status !== "clear") risks.push("acceptance_review");
  if (health.status !== "clear") risks.push("evidence_health");
  return risks;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

export function acceptanceBasisView(contract: NoriContract): {
  status: string;
  summary: string | null;
  source: string | null;
  mode: string | null;
  coverage_summary: string[];
  assumptions: string[];
  open_questions: string[];
  out_of_scope: string[];
} {
  const basis = contract.acceptance_basis || { status: "draft" };
  return {
    status: String(basis.status || "draft"),
    summary: basis.summary ? String(basis.summary) : null,
    source: basis.source ? String(basis.source) : null,
    mode: basis.mode ? String(basis.mode) : null,
    coverage_summary: stringList(basis.coverage_summary),
    assumptions: stringList(basis.assumptions),
    open_questions: stringList(basis.open_questions),
    out_of_scope: stringList(basis.out_of_scope)
  };
}

function profileReviewRisks(ledger: EvidenceLedger): string[] {
  return profileCompliance(ledger).review.length > 0 ? ["profile_review"] : [];
}

function architectureReviewRisks(architecture: ArchitectureState | undefined): string[] {
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

function architectureReviewSkill(architecture: ArchitectureState): AgentSkill {
  if (architecture.requirement.status === "unknown") return "nori-architecture-brainstorm";
  if (architecture.decision === "challenged") return "nori-architecture-challenge";
  if (architecture.evidence_health.status !== "clear") return "nori-project-health";
  if (architecture.build_vs_buy.status !== "clear") return "nori-build-vs-buy";
  if (architecture.decision === "valid") return "nori-architecture-apply";
  return "nori-architecture-brainstorm";
}

function architectureReviewActions(architecture: ArchitectureState): string[] {
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
      "Preview an Architecture Baseline from the current goal, Product AC, Nori Profile, project evidence, and available profiles.",
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

function reviewRiskSkill(input: {
  acceptanceReview: AcceptanceQualityAudit;
  architecture?: ArchitectureState;
}): AgentSkill {
  if (input.architecture && architectureReviewRisks(input.architecture).includes("architecture_evidence")) return "nori-project-health";
  if (input.acceptanceReview.status !== "clear") return "nori-acceptance";
  return "nori-reporting";
}

export function intervention(contract: NoriContract, ledger: EvidenceLedger): UserIntervention {
  const compliance = profileCompliance(ledger);
  if (compliance.required && !compliance.complete) {
    const item = compliance.blocking[0];
    if (!item) {
      return {
        required: true,
        action: "Capability profile compliance is incomplete; inspect Nori Profile evidence."
      };
    }
    return {
      required: true,
      criterion: `PROFILE-${item.id}`,
      user_story: `作为用户，我需要确认 agent 是否必须遵守能力偏好：${item.name}。`,
      action: item.status === "violated"
        ? `Capability profile item ${item.name} was violated. Waive it or revise the work.`
        : `Provide evidence that Nori Profile item ${item.name} was satisfied, or waive it.`
    };
  }

  for (const criterion of contract.criteria) {
    const state = ledger.criteria[criterion.id];
    if (state?.status === "blocked") {
      const latest = state.evidence?.at(-1);
      return {
        required: true,
        criterion: criterion.id,
        user_story: criterion.user_story,
        action: latest?.summary || "Provide the decision, permission, input, or external condition needed to unblock this criterion."
      };
    }
  }

  return {
    required: false,
    action: "No user intervention is currently required."
  };
}

export function completionAnswer(contract: NoriContract, ledger: EvidenceLedger, { root = process.cwd(), architecture = undefined }: CompletionContext = {}): CompletionAnswer {
  const gap = currentGap(contract, ledger);
  const objectiveComplete = !gap && ledger.status === "complete";
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const health = evidenceHealth(contract, ledger, { root });
  const risks = objectiveComplete ? [
    ...reviewRiskSources(acceptanceReview, health),
    ...profileReviewRisks(ledger),
    ...architectureReviewRisks(architecture)
  ] : [];
  if (objectiveComplete && risks.length > 0) {
    return {
      complete: true,
      objective_complete: true,
      confidence: "review-risk",
      review_risks: risks,
      answer: `Objectively complete with review risk: ${risks.join(", ")}.`
    };
  }
  if (objectiveComplete) {
    return {
      complete: true,
      objective_complete: true,
      confidence: "confident",
      review_risks: [],
      answer: "Complete: all required acceptance criteria have passing or waived evidence."
    };
  }
  return {
    complete: false,
    objective_complete: false,
    confidence: "not-complete",
    review_risks: [],
    answer: `Not complete: ${gap ? `${gap.id} is ${gap.status}. ${gap.reason}` : `workflow status is ${ledger.status}.`}`
  };
}

export function nextRecommendation(contract: NoriContract, ledger: EvidenceLedger, { root = process.cwd(), architecture = undefined }: CompletionContext = {}): NextRecommendation {
  const gap = currentGap(contract, ledger);
  const needed = intervention(contract, ledger);
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const health = evidenceHealth(contract, ledger, { root });
  const profile = profileCompliance(ledger);

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
    ...profileReviewRisks(ledger),
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
    if (profile.review.length > 0) {
      actions.push("Review Nori Profile preference risks.");
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

function escapeTableCell(value: unknown): string {
  return String(value || "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

function formatEvidenceValue(value: unknown): string {
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatEvidenceSource(source: EvidenceSource | string): string {
  if (!source) return "<none>";
  if (typeof source === "string") return source;
  const preferredKeys = ["type", "label", "command", "path", "url", "outcome", "summary"];
  const sourceRecord = source as EvidenceSource;
  const parts: string[] = [];
  for (const key of preferredKeys) {
    if (sourceRecord[key]) parts.push(`${key}=${formatEvidenceValue(sourceRecord[key])}`);
  }
  for (const [key, value] of Object.entries(sourceRecord)) {
    if (!preferredKeys.includes(key) && value !== undefined && value !== null && String(value).trim() !== "") {
      parts.push(`${key}=${formatEvidenceValue(value)}`);
    }
  }
  return parts.join(", ") || "<none>";
}

function formatEvidenceSources(evidence: EvidenceRecord | null | undefined, { root = process.cwd() } = {}): string {
  const view = evidenceView(evidence, { root });
  if (!view) return "<none>";
  if (view.sources.length === 0) return view.path || "<none>";
  return view.sources.map((source) => formatEvidenceSource(source)).join("; ");
}

export function renderReport(contract: NoriContract, ledger: EvidenceLedger, { root = process.cwd(), architecture = undefined }: CompletionContext = {}): string {
  const gap = currentGap(contract, ledger);
  const needed = intervention(contract, ledger);
  const completion = completionAnswer(contract, ledger, { root, architecture });
  const health = evidenceHealth(contract, ledger, { root });
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const profile = profileCompliance(ledger);
  const recommendation = nextRecommendation(contract, ledger, { root, architecture });
  const basis = acceptanceBasisView(contract);
  const lines = [
    `# ${contract.goal_id} Acceptance Report`,
    "",
    "## Decision Summary",
    "",
    `Completion: ${completion.answer}`,
    `Objective complete: ${completion.objective_complete ? "yes" : "no"}`,
    `Confidence: ${completion.confidence}`,
    `Review risks: ${completion.review_risks.length > 0 ? completion.review_risks.join(", ") : "none"}`,
    `Current gap: ${gap ? `${gap.id} - ${gap.reason}` : "None. All required acceptance criteria have passing or waived evidence."}`,
    `User intervention: ${needed.required ? `${needed.criterion} - ${needed.action}` : needed.action}`,
    `Recommended next action: ${recommendation.summary}`,
    `Workflow status: ${ledger.status}`,
    "",
    "## Goal",
    "",
    contract.goal,
    "",
    "## Acceptance Basis",
    "",
    `Status: ${basis.status}`,
    `Summary: ${basis.summary || "<none>"}`,
    ...(basis.source ? [`Source: ${basis.source}`] : []),
    ...(basis.mode ? [`Mode: ${basis.mode}`] : []),
    ...(basis.coverage_summary.length > 0
      ? [
          "Discovery coverage:",
          ...basis.coverage_summary.map((item) => `- ${item}`)
        ]
      : []),
    ...(basis.assumptions.length > 0
      ? [
          "Assumptions:",
          ...basis.assumptions.map((item) => `- ${item}`)
        ]
      : []),
    ...(basis.open_questions.length > 0
      ? [
          "Open questions:",
          ...basis.open_questions.map((item) => `- ${item}`)
        ]
      : []),
    ...(basis.out_of_scope.length > 0
      ? [
          "Out of scope:",
          ...basis.out_of_scope.map((item) => `- ${item}`)
        ]
      : []),
    "",
    "## Nori Profile",
    "",
    ...renderProfileLines(ledger),
    "",
    ...(profile.review.length > 0
      ? [
          "Profile review risks:",
          ...profile.review.map((item) => `- ${item.id}: ${item.name} is ${item.status} (${item.strength})`),
          ""
        ]
      : []),
    "## Acceptance Status",
    "",
    "| ID | Layer | User acceptance criterion | Status | Confidence | Evidence summary | Basis | Sources | Reviewability | Limitations |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const criterion of contract.criteria) {
    const state = ledger.criteria[criterion.id];
    const latest = state?.evidence?.at(-1);
    const view = evidenceView(latest, { root });
    const evidence = view ? `${view.kind}: ${view.summary}` : "<none>";
    lines.push(`| ${criterion.id} | ${criterion.layer || inferCriterionLayer(criterion.id)} | ${escapeTableCell(criterion.user_story)} | ${state?.status || "unknown"} | ${state?.confidence || "none"} | ${escapeTableCell(evidence)} | ${view?.basis || "<none>"} | ${escapeTableCell(formatEvidenceSources(latest, { root }))} | ${view?.reviewability || "<none>"} | ${escapeTableCell(view?.limitations || "<none>")} |`);
  }

  lines.push("", "## Current Acceptance Gap", "");
  lines.push(gap ? `${gap.id} - ${gap.reason}` : "None. All required acceptance criteria have passing or waived evidence.");
  lines.push("", "## Acceptance Review", "");
  lines.push(`Status: ${acceptanceReview.status}`);
  lines.push(`Summary: ${acceptanceReview.summary}`);
  if (acceptanceReview.findings.length > 0) {
    lines.push("", "| Criterion | Severity | Concern | Question | Agent guidance |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const finding of acceptanceReview.findings) {
      lines.push(`| ${finding.criterion_id} | ${finding.severity} | ${finding.gap_id} | ${escapeTableCell(finding.question)} | ${escapeTableCell(finding.agent_guidance || "")} |`);
    }
  }
  lines.push("", "## Evidence Health", "");
  lines.push(`Status: ${health.status}`);
  lines.push(`Summary: ${health.summary}`);
  if (health.findings.length > 0) {
    lines.push("", "| Criterion | Severity | Issue | Message | Recovery |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const finding of health.findings) {
      lines.push(`| ${finding.criterion_id} | ${finding.severity} | ${finding.issue} | ${escapeTableCell(finding.message)} | ${escapeTableCell(finding.recovery)} |`);
    }
  }
  lines.push("", "## User Intervention", "");
  lines.push(needed.required ? `${needed.criterion} - ${needed.action}` : needed.action);
  lines.push("", "## Conclusion", "", `Current status: ${ledger.status}`);
  return `${lines.join("\n")}\n`;
}
