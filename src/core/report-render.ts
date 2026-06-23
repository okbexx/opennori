import type {
  EvidenceLedger,
  EvidenceRecord,
  EvidenceSource,
  NoriContract
} from "../types.ts";
import { reviewAcceptanceQuality } from "../acceptance.ts";
import { currentGap, evidenceHealth, evidenceView } from "./evidence.ts";
import { emptyProjectProfile, profileCompliance, renderProfileLines } from "./profile.ts";
import { inferCriterionLayer } from "./shared.ts";
import {
  acceptanceBasisView,
  completionAnswer,
  interventionForProfile,
  nextRecommendation,
  type CompletionContext
} from "./completion.ts";

function escapeTableCell(value: unknown): string {
  return String(value || "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

function compactText(value: unknown, maxLength = 96): string {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text || "<none>";
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function wrapMarkdownText(value: unknown, maxLength = 100): string[] {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return ["<none>"];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > maxLength) {
    let index = rest.lastIndexOf(" ", maxLength);
    if (index < Math.floor(maxLength * 0.5)) index = maxLength;
    chunks.push(rest.slice(0, index).trim());
    rest = rest.slice(index).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function pushWrappedField(lines: string[], label: string, value: unknown): void {
  const chunks = wrapMarkdownText(value);
  lines.push(`- ${label}: ${chunks[0]}`);
  for (const chunk of chunks.slice(1)) {
    lines.push(`  ${chunk}`);
  }
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

function formatEvidenceSources(evidence: EvidenceRecord | null | undefined, { root = process.cwd() } = {}): string[] {
  const view = evidenceView(evidence, { root });
  if (!view) return ["<none>"];
  if (view.sources.length === 0) return [view.path || "<none>"];
  return view.sources.map((source) => formatEvidenceSource(source));
}

function pushEvidenceSources(lines: string[], evidence: EvidenceRecord | null | undefined, { root = process.cwd() } = {}): void {
  lines.push("- Sources:");
  for (const source of formatEvidenceSources(evidence, { root })) {
    for (const [index, chunk] of wrapMarkdownText(source, 112).entries()) {
      lines.push(index === 0 ? `  - ${chunk}` : `    ${chunk}`);
    }
  }
}

export function renderReport(
  contract: NoriContract,
  ledger: EvidenceLedger,
  { root = process.cwd(), architecture = undefined, profile = emptyProjectProfile() }: CompletionContext = {}
): string {
  const gap = currentGap(contract, ledger, profile);
  const needed = interventionForProfile(contract, ledger, profile);
  const completion = completionAnswer(contract, ledger, { root, architecture, profile });
  const health = evidenceHealth(contract, ledger, { root });
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const profileStatus = profileCompliance(profile, ledger);
  const recommendation = nextRecommendation(contract, ledger, { root, architecture, profile });
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
    "## Project Profile Compliance",
    "",
    ...renderProfileLines(profile, ledger),
    "",
    ...(profileStatus.review.length > 0
      ? [
          "Profile review risks:",
          ...profileStatus.review.map((item) => `- ${item.id}: ${item.name} is ${item.status} (${item.strength})`),
          ""
        ]
      : []),
    "## Acceptance Status",
    "",
    "| ID | Layer | Status | Confidence | Evidence | Basis |",
    "| --- | --- | --- | --- | --- | --- |"
  ];

  for (const criterion of contract.criteria) {
    const state = ledger.criteria[criterion.id];
    const latest = state?.evidence?.at(-1);
    const view = evidenceView(latest, { root });
    const evidence = view ? `${view.kind}: ${view.summary}` : "<none>";
    lines.push(`| ${criterion.id} | ${criterion.layer || inferCriterionLayer(criterion.id)} | ${state?.status || "unknown"} | ${state?.confidence || "none"} | ${escapeTableCell(compactText(evidence))} | ${view?.basis || "<none>"} |`);
  }

  lines.push("", "## Acceptance Details", "");
  for (const criterion of contract.criteria) {
    const state = ledger.criteria[criterion.id];
    const latest = state?.evidence?.at(-1);
    const view = evidenceView(latest, { root });
    lines.push(`### ${criterion.id}`, "");
    lines.push(`- Layer: ${criterion.layer || inferCriterionLayer(criterion.id)}`);
    lines.push(`- Status: ${state?.status || "unknown"}`);
    lines.push(`- Confidence: ${state?.confidence || "none"}`);
    pushWrappedField(lines, "User acceptance criterion", criterion.user_story);
    pushWrappedField(lines, "Measurement", criterion.measurement);
    pushWrappedField(lines, "Passing threshold", criterion.threshold);
    if (view) {
      pushWrappedField(lines, "Evidence", `${view.kind}: ${view.summary}`);
      lines.push(`- Basis: ${view.basis}`);
      if (view.result) lines.push(`- Evidence result: ${view.result}`);
      if (view.gate) lines.push(`- Evidence gate: ${view.gate}`);
      if (view.created_at) lines.push(`- Evidence recorded: ${view.created_at}`);
      pushEvidenceSources(lines, latest, { root });
      pushWrappedField(lines, "Reviewability", view.reviewability || "<none>");
      pushWrappedField(lines, "Limitations", view.limitations || "<none>");
    } else {
      lines.push("- Evidence: <none>");
    }
    lines.push("");
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
