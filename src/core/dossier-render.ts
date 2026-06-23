import path from "node:path";
import type { AcceptanceCriterion, CriterionLedgerState, EvidenceLedger, NoriContract } from "../types.ts";
import { inferCriterionLayer } from "./protocol.ts";

function criteriaDirForGoalDir(goalDir: string): string {
  return path.join(goalDir, "criteria");
}

function criterionDir(goalDir: string, criterionId: string): string {
  return path.join(criteriaDirForGoalDir(goalDir), criterionId);
}

function relativeInsideGoal(goalDir: string, filePath: string): string {
  return path.relative(goalDir, filePath) || ".";
}

function list(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

export function renderCriterionReadme(input: {
  contract: NoriContract;
  criterion: AcceptanceCriterion;
  state: CriterionLedgerState | undefined;
  goalDir: string;
}): string {
  const { contract, criterion, state, goalDir } = input;
  const latest = state?.evidence?.at(-1);
  const lines = [
    `# ${criterion.id} Acceptance Dossier`,
    "",
    `Goal: ${contract.goal}`,
    `Layer: ${criterion.layer || inferCriterionLayer(criterion.id)}`,
    `Status: ${state?.status || "unknown"}`,
    `Confidence: ${state?.confidence || "none"}`,
    `Required: ${criterion.required !== false ? "yes" : "no"}`,
    `Risk: ${criterion.risk || state?.risk || "medium"}`,
    "",
    "## Criterion",
    "",
    `User story: ${criterion.user_story}`,
    "",
    `Measurement: ${criterion.measurement}`,
    "",
    `Passing threshold: ${criterion.threshold}`,
    "",
    "## Evidence",
    ""
  ];

  if (!latest) {
    lines.push("<none>", "");
  } else {
    lines.push(
      `Latest: ${latest.kind || "evidence"} - ${latest.summary || "<none>"}`,
      `Result: ${latest.result || state?.status || "unknown"}`,
      `Basis: ${latest.basis || "<none>"}`,
      `Reviewability: ${latest.reviewability || "<none>"}`,
      `Limitations: ${latest.limitations || "<none>"}`,
      ""
    );
    const sources = Array.isArray(latest.sources) ? latest.sources : [];
    if (sources.length > 0 || latest.path) {
      lines.push("Sources:");
      for (const source of sources) {
        const sourceText = typeof source === "string"
          ? source
          : source.command || source.path || source.url || source.label || source.summary || JSON.stringify(source);
        lines.push(`- ${sourceText}`);
      }
      if (latest.path) lines.push(`- ${latest.path}`);
      lines.push("");
    }
  }

  lines.push(
    "## Files",
    "",
    `- Criterion source: ${relativeInsideGoal(goalDir, path.join(criterionDir(goalDir, criterion.id), "criterion.json"))}`,
    `- Status projection: ${relativeInsideGoal(goalDir, path.join(criterionDir(goalDir, criterion.id), "status.json"))}`,
    `- Evidence ledger: ${relativeInsideGoal(goalDir, path.join(criterionDir(goalDir, criterion.id), "evidence"))}`,
    `- Artifacts: ${relativeInsideGoal(goalDir, path.join(criterionDir(goalDir, criterion.id), "artifacts"))}`,
    "",
    "This README is generated for review. The criterion JSON and evidence records are the structured state.",
    ""
  );
  return `${lines.join("\n")}`;
}

export function renderGoalReadme(contract: NoriContract, ledger: EvidenceLedger): string {
  const language = contract.presentation?.language === "zh-CN" ? "zh-CN" : "en";
  const zh = language === "zh-CN";
  const basis = contract.acceptance_basis || { status: "draft" };
  const coverageSummary = list(basis.coverage_summary);
  const assumptions = list(basis.assumptions);
  const openQuestions = list(basis.open_questions);
  const outOfScope = list(basis.out_of_scope);
  const lines = [
    `# ${contract.goal_id} ${zh ? "验收契约" : "Nori Contract"}`,
    "",
    `## ${zh ? "目标" : "Goal"}`,
    "",
    contract.goal,
    "",
    `## ${zh ? "表达偏好" : "Presentation"}`,
    "",
    `${zh ? "语言" : "Language"}: ${language}`,
    "",
    `## ${zh ? "验收基础" : "Acceptance Basis"}`,
    "",
    `${zh ? "状态" : "Status"}: ${basis.status || "draft"}`,
    `${zh ? "摘要" : "Summary"}: ${basis.summary || "<none>"}`,
    ...(basis.source ? [`${zh ? "来源" : "Source"}: ${String(basis.source)}`] : []),
    ...(basis.mode ? [`${zh ? "模式" : "Mode"}: ${String(basis.mode)}`] : []),
    ...(coverageSummary.length > 0
      ? ["", `${zh ? "发现覆盖面" : "Discovery coverage"}:`, ...coverageSummary.map((item) => `- ${item}`)]
      : []),
    ...(assumptions.length > 0
      ? ["", `${zh ? "假设" : "Assumptions"}:`, ...assumptions.map((item) => `- ${item}`)]
      : []),
    ...(openQuestions.length > 0
      ? ["", `${zh ? "开放问题" : "Open questions"}:`, ...openQuestions.map((item) => `- ${item}`)]
      : []),
    ...(outOfScope.length > 0
      ? ["", `${zh ? "范围外" : "Out of scope"}:`, ...outOfScope.map((item) => `- ${item}`)]
      : []),
    "",
    `## ${zh ? "状态" : "State"}`,
    "",
    `${zh ? "工作流状态" : "Workflow status"}: ${ledger.status}`,
    `${zh ? "验收基础状态" : "Acceptance basis"}: ${basis.status || "draft"}`,
    "",
    `## ${zh ? "用户验收标准" : "Acceptance Dossiers"}`,
    "",
    `| ID | Layer | ${zh ? "用户验收标准" : "User acceptance criterion"} | ${zh ? "衡量方式" : "Measurement"} | ${zh ? "通过标准" : "Passing threshold"} | ${zh ? "状态" : "Status"} | Confidence | Dossier |`,
    "| --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const criterion of contract.criteria) {
    const state = ledger.criteria?.[criterion.id];
    lines.push(`| ${criterion.id} | ${criterion.layer || inferCriterionLayer(criterion.id)} | ${criterion.user_story} | ${criterion.measurement} | ${criterion.threshold} | ${state?.status || "unknown"} | ${state?.confidence || "none"} | criteria/${criterion.id}/README.md |`);
  }

  lines.push(
    "",
    `## ${zh ? "文件" : "Files"}`,
    "",
    "- `contract.json` stores the goal-level contract snapshot.",
    "- `ledger.json` stores the aggregate workflow ledger.",
    "- `criteria/<AC-id>/criterion.json` stores each acceptance criterion.",
    "- `criteria/<AC-id>/status.json` stores a rebuildable status projection.",
    "- `criteria/<AC-id>/evidence/*.json` stores reviewable evidence records.",
    "- `criteria/<AC-id>/artifacts/` stores screenshots, reports, command summaries, and other review artifacts.",
    "",
    zh
      ? "进度由验收证据决定，而不是由实现步骤决定。"
      : "Progress is determined by acceptance evidence, not by implementation steps.",
    ""
  );
  return `${lines.join("\n")}`;
}
