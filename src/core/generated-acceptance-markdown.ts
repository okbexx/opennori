import fs from "node:fs";
import type {
  EvidenceLedger,
  NoriContract,
  ParsedGeneratedAcceptanceReviewMarkdown
} from "../types.ts";
import { contractLanguage } from "../language.ts";
import { inferCriterionLayer } from "./protocol.ts";

export const GENERATED_ACCEPTANCE_REVIEW_MARKDOWN_SCHEMA = "opennori/generated-acceptance-review-markdown-v1";
export const GENERATED_ACCEPTANCE_REVIEW_MARKER = "<!-- opennori/generated-acceptance-review-markdown-v1 review-surface-only -->";

function emptyGeneratedAcceptanceReviewMarkdown(warnings: string[]): ParsedGeneratedAcceptanceReviewMarkdown {
  return {
    schema_version: GENERATED_ACCEPTANCE_REVIEW_MARKDOWN_SCHEMA,
    authority: "review-surface-only",
    side_effect: "none",
    generated_by: "opennori",
    source: "generated-acceptance-review-markdown",
    goal: "",
    criteria: [],
    warnings
  };
}

export function renderGeneratedAcceptanceReviewMarkdown(contract: NoriContract, ledger: EvidenceLedger): string {
  const language = contractLanguage(contract);
  const labels = language === "zh-CN"
    ? {
        title: "验收契约",
        goal: "目标",
        presentation: "表达偏好",
        language: "语言",
        acceptanceBasis: "验收基础",
        status: "状态",
        summary: "摘要",
        source: "来源",
        mode: "模式",
        coverageSummary: "发现覆盖面",
        assumptions: "假设",
        openQuestions: "开放问题",
        outOfScope: "范围外",
        none: "<无>",
        criteria: "用户验收标准",
        userAcceptanceCriterion: "用户验收标准",
        measurement: "衡量方式",
        threshold: "通过标准",
        rule: "规则",
        progressRule: "进度由验收证据决定，而不是由实现步骤决定。",
        generatedNotice: "此 Markdown 只用于人工和 agent review。结构化 JSON/dossier 文件才是 OpenNori 状态源。"
      }
    : {
        title: "Acceptance Contract",
        goal: "Goal",
        presentation: "Presentation",
        language: "Language",
        acceptanceBasis: "Acceptance Basis",
        status: "Status",
        summary: "Summary",
        source: "Source",
        mode: "Mode",
        coverageSummary: "Discovery coverage",
        assumptions: "Assumptions",
        openQuestions: "Open Questions",
        outOfScope: "Out of scope",
        none: "<none>",
        criteria: "User Acceptance Criteria",
        userAcceptanceCriterion: "User acceptance criterion",
        measurement: "Measurement",
        threshold: "Passing threshold",
        rule: "Rule",
        progressRule: "Progress is determined by acceptance evidence, not by implementation steps.",
        generatedNotice: "This Markdown is only for human and agent review. Structured JSON/dossier files remain the OpenNori state source."
      };
  const basis = contract.acceptance_basis || { status: "draft" };
  const basisLines = [
    `${labels.status}: ${basis.status || "draft"}`,
    basis.summary ? `${labels.summary}: ${basis.summary}` : `${labels.summary}: ${labels.none}`
  ];
  if (basis.source) {
    basisLines.push(`${labels.source}: ${String(basis.source)}`);
  }
  if (basis.mode) {
    basisLines.push(`${labels.mode}: ${String(basis.mode)}`);
  }
  const coverageSummary = Array.isArray(basis.coverage_summary) ? basis.coverage_summary.map((item) => String(item).trim()).filter(Boolean) : [];
  const assumptions = Array.isArray(basis.assumptions) ? basis.assumptions.map((item) => String(item).trim()).filter(Boolean) : [];
  const openQuestions = Array.isArray(basis.open_questions) ? basis.open_questions.map((item) => String(item).trim()).filter(Boolean) : [];
  const outOfScope = Array.isArray(basis.out_of_scope) ? basis.out_of_scope.map((item) => String(item).trim()).filter(Boolean) : [];
  if (coverageSummary.length > 0) {
    basisLines.push("", `${labels.coverageSummary}:`, ...coverageSummary.map((item) => `- ${item}`));
  }
  if (assumptions.length > 0) {
    basisLines.push("", `${labels.assumptions}:`, ...assumptions.map((item) => `- ${item}`));
  }
  if (openQuestions.length > 0) {
    basisLines.push("", `${labels.openQuestions}:`, ...openQuestions.map((item) => `- ${item}`));
  }
  if (outOfScope.length > 0) {
    basisLines.push("", `${labels.outOfScope}:`, ...outOfScope.map((item) => `- ${item}`));
  }

  const lines = [
    GENERATED_ACCEPTANCE_REVIEW_MARKER,
    `# ${contract.goal_id} ${labels.title}`,
    "",
    labels.generatedNotice,
    "",
    `## ${labels.goal}`,
    "",
    contract.goal,
    "",
    `## ${labels.presentation}`,
    "",
    `${labels.language}: ${language}`,
    "",
    `## ${labels.acceptanceBasis}`,
    "",
    ...basisLines,
    "",
    `## ${labels.criteria}`,
    "",
    `| ID | Layer | ${labels.userAcceptanceCriterion} | ${labels.measurement} | ${labels.threshold} | ${labels.status} |`,
    "| --- | --- | --- | --- | --- | --- |"
  ];

  for (const criterion of contract.criteria) {
    const status = ledger.criteria[criterion.id]?.status || "unknown";
    lines.push(`| ${criterion.id} | ${criterion.layer || inferCriterionLayer(criterion.id)} | ${criterion.user_story} | ${criterion.measurement} | ${criterion.threshold} | ${status} |`);
  }

  lines.push(
    "",
    `## ${labels.rule}`,
    "",
    labels.progressRule
  );

  return `${lines.join("\n")}\n`;
}

export function writeGeneratedAcceptanceReviewMarkdown(acceptancePath: string, contract: NoriContract, ledger: EvidenceLedger): void {
  fs.writeFileSync(acceptancePath, renderGeneratedAcceptanceReviewMarkdown(contract, ledger));
}

export function parseGeneratedAcceptanceReviewMarkdown(markdown: string): ParsedGeneratedAcceptanceReviewMarkdown {
  if (!markdown.includes(GENERATED_ACCEPTANCE_REVIEW_MARKER)) {
    return emptyGeneratedAcceptanceReviewMarkdown([
      "Missing OpenNori generated review marker; arbitrary Markdown is not parsed as OpenNori contract state."
    ]);
  }

  const warnings: string[] = [
    "Parsed Markdown is review-surface-only and must not be used to approve, import, or update contract state."
  ];
  const goalMatch = markdown.match(/## (?:Goal|目标)\s+([\s\S]*?)(?:\n## (?:Presentation|表达偏好)|\n## (?:Acceptance Basis|验收基础)|\n## (?:User Acceptance Criteria|用户验收标准))/);
  const tableMatch = markdown.match(/## (?:User Acceptance Criteria|Acceptance Dossiers|用户验收标准)\s+([\s\S]*?)(?:\n## |\n$)/);
  const goal = goalMatch?.[1]?.trim() || "";
  const criteria: ParsedGeneratedAcceptanceReviewMarkdown["criteria"] = [];

  if (!goal) {
    warnings.push("Generated review Markdown did not contain a parseable goal section.");
  }

  if (!tableMatch) {
    warnings.push("Generated review Markdown did not contain a parseable acceptance criteria table.");
  } else {
    for (const line of (tableMatch[1] || "").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("|") || trimmed.includes("---") || trimmed.includes("User acceptance criterion") || trimmed.includes("用户验收标准")) {
        continue;
      }
      const cells = trimmed.split("|").slice(1, -1).map((cell: string) => cell.trim());
      if (cells.length >= 6) {
        criteria.push({
          id: cells[0] || "",
          layer: cells[1] || "",
          user_story: cells[2] || "",
          measurement: cells[3] || "",
          threshold: cells[4] || "",
          status: cells[5] || "unknown"
        });
      }
    }
  }

  return {
    schema_version: GENERATED_ACCEPTANCE_REVIEW_MARKDOWN_SCHEMA,
    authority: "review-surface-only",
    side_effect: "none",
    generated_by: "opennori",
    source: "generated-acceptance-review-markdown",
    goal,
    criteria,
    warnings
  };
}
