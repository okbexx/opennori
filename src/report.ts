import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { OpenNoriError } from "./errors.ts";
import { withExclusiveLock } from "./exclusive-lock.ts";
import { nowIso, posixRelative, readText, safeProjectPath, writeTextAtomic } from "./io.ts";
import { findTask, loadTaskView } from "./task.ts";
import type { EvidenceSource, TaskView } from "./types.ts";
import { withTaskLock } from "./task-lock.ts";

type HumanLanguage = "en" | "zh-CN";

export type JournalEntry = {
  task_id: string;
  title: string;
  summary: string;
  status: "in_progress" | "completed" | "blocked";
  knowledge: "promoted" | "none";
  knowledge_summary: string;
  commits?: string[];
  recorded_at?: string;
};

export type CompletionOutcomeSummary = {
  id: string;
  statement: string;
  status: "proven" | "waived";
  evidence_summary: string;
  sources: string[];
};

export type CompletionSummary = {
  task_id: string;
  title: string;
  goal: string;
  package: string | null;
  outcomes: CompletionOutcomeSummary[];
  knowledge: {
    decision: "promoted" | "none";
    summary: string;
  };
  delivery: {
    mode: "commit" | "pull_request" | "waived";
    commit: string | null;
    pull_request_url: string | null;
    waiver_reason: string | null;
  } | null;
};

/** Build the compact user-facing completion projection from canonical state. */
export function buildCompletionSummary(
  view: TaskView,
  knowledge: CompletionSummary["knowledge"]
): CompletionSummary {
  if (view.task.status !== "completed" || !view.complete || !view.contract) {
    throw new OpenNoriError("completion_summary_unavailable", `Task ${view.task.id} is not completion-ready.`);
  }
  const language = humanLanguage(view.task.title, view.contract.goal, ...view.outcomes.map((outcome) => outcome.statement));
  const outcomes = view.outcomes.filter((outcome) => outcome.required).map((outcome): CompletionOutcomeSummary => {
    if ((outcome.status !== "proven" && outcome.status !== "waived") || !outcome.latest_evidence) {
      throw new OpenNoriError("completion_summary_unavailable", `Required Outcome ${outcome.id} has no completion Evidence.`);
    }
    return {
      id: outcome.id,
      statement: outcome.statement,
      status: outcome.status,
      evidence_summary: outcome.latest_evidence.summary,
      sources: outcome.latest_evidence.sources.map((source) => renderCompactEvidenceSource(source, language))
    };
  });
  return {
    task_id: view.task.id,
    title: view.task.title,
    goal: view.contract.goal,
    package: view.task.package ?? null,
    outcomes,
    knowledge: {
      decision: knowledge.decision,
      summary: knowledge.summary.trim()
    },
    delivery: view.delivery
      ? {
          mode: view.delivery.mode,
          commit: view.delivery.commit,
          pull_request_url: view.delivery.pull_request_url,
          waiver_reason: view.delivery.waiver?.reason ?? null
        }
      : null
  };
}

export function renderCompletionSummary(summary: CompletionSummary): string {
  const language = humanLanguage(summary.title, summary.goal, ...summary.outcomes.map((outcome) => outcome.statement));
  const chinese = language === "zh-CN";
  const lines = [
    `${chinese ? "已验证并归档" : "Verified and archived"}: ${summary.title}`,
    `${chinese ? "目标" : "Goal"}: ${summary.goal}`
  ];
  if (summary.package) lines.push(`${chinese ? "包" : "Package"}: ${summary.package}`);
  lines.push(chinese ? "结果：" : "Results:");
  for (const outcome of summary.outcomes) {
    lines.push(
      `  ${outcome.statement}: ${renderCompletionResult(outcome.status, language)} - ${outcome.evidence_summary}`
    );
  }
  lines.push(
    `${chinese ? "项目知识" : "Project knowledge"}: ${renderKnowledgeDecision(summary.knowledge.decision, language)} - ${summary.knowledge.summary}`
  );
  if (summary.delivery?.mode === "waived") {
    lines.push(
      `${chinese ? "Git 交付" : "Git delivery"}: ${chinese ? "已确认例外" : "exception confirmed"} - ${summary.delivery.waiver_reason}`
    );
  }
  else if (summary.delivery) {
    lines.push(`${chinese ? "Git 交付" : "Git delivery"}: ${summary.delivery.mode} - ${summary.delivery.commit}`);
    if (summary.delivery.pull_request_url) {
      lines.push(`${chinese ? "拉取请求" : "Pull request"}: ${summary.delivery.pull_request_url}`);
    }
  }
  return lines.join("\n");
}

function renderCompletionResult(result: "proven" | "waived", language: HumanLanguage): string {
  if (language === "zh-CN") return result === "proven" ? "已验证" : "已确认例外";
  return result === "proven" ? "verified" : "exception confirmed";
}

export function renderTaskReport(view: TaskView): string {
  const language = humanLanguage(
    view.task.title,
    view.contract?.goal ?? "",
    ...view.outcomes.map((outcome) => outcome.statement)
  );
  const chinese = language === "zh-CN";
  const lines = [
    `# ${view.task.title}`,
    "",
    `${chinese ? "任务" : "Task"}: ${view.task.id}`,
    `${chinese ? "包" : "Package"}: ${view.task.package ?? (chinese ? "项目" : "project")}`,
    `${chinese ? "生命周期状态" : "Lifecycle status"}: ${renderTaskStatus(view.task.status, language)}`,
    `${chinese ? "阶段" : "Phase"}: ${renderTaskPhase(view.phase, language)}`,
    `${chinese ? "契约" : "Contract"}: ${view.contract ? renderContractStatus(view.contract.status, language) : chinese ? "缺失" : "missing"}`,
    `${chinese ? "必需 Outcome 已完成" : "Required Outcomes complete"}: ${view.complete ? (chinese ? "是" : "yes") : chinese ? "否" : "no"}`,
    `${chinese ? "当前缺口" : "Current gap"}: ${view.current_gap ? `${view.current_gap.id} (${renderEvidenceResult(view.current_gap.status, language)})` : chinese ? "无" : "none"}`,
    `${chinese ? "交付" : "Delivery"}: ${renderDelivery(view, language)}`,
    "",
    chinese ? "## 目标" : "## Goal",
    "",
    view.contract?.goal ?? (chinese ? "尚未起草 Nori Contract。" : "No Nori Contract has been drafted."),
    "",
    chinese ? "## Outcome 证据" : "## Outcome Evidence",
    ""
  ];
  for (const outcome of view.outcomes) {
    lines.push(
      `### ${outcome.id}${outcome.required ? (chinese ? "（必需）" : " (required)") : chinese ? "（可选）" : " (optional)"}`
    );
    lines.push("");
    lines.push(outcome.statement);
    lines.push("");
    lines.push(`${chinese ? "状态" : "Status"}: ${renderEvidenceResult(outcome.status, language)}`);
    if (outcome.latest_evidence) {
      lines.push(`${chinese ? "记录时间" : "Recorded"}: ${outcome.latest_evidence.recorded_at}`);
      lines.push(`${chinese ? "摘要" : "Summary"}: ${outcome.latest_evidence.summary}`);
      if (outcome.latest_evidence.sources.length > 0) {
        lines.push(
          chinese ? "来源：" : "Sources:",
          ...outcome.latest_evidence.sources.map((source) => `- ${renderEvidenceSource(source, language)}`)
        );
      }
    }
    lines.push("");
  }
  if (view.task.blocker) lines.push(chinese ? "## 阻塞" : "## Blocker", "", view.task.blocker, "");
  lines.push(
    "---",
    "",
    chinese
      ? "本报告由 task.json、contract.json、delivery.json 和 evidence.jsonl 生成，不是状态权威。"
      : "Generated from task.json, contract.json, delivery.json, and evidence.jsonl. This report is not state authority.",
    ""
  );
  return lines.join("\n");
}

function renderDelivery(view: TaskView, language: HumanLanguage): string {
  const chinese = language === "zh-CN";
  if (!view.task.delivery_required) return chinese ? "迁移任务无需交付" : "not required for this migrated task";
  if (!view.delivery) return chinese ? "未规划" : "not planned";
  if (view.delivery.mode === "waived") {
    return chinese
      ? `由 ${view.delivery.waiver?.actor ?? "未知人员"} 豁免`
      : `waived by ${view.delivery.waiver?.actor ?? "unknown"}`;
  }
  if (view.delivery.status === "planned") {
    return chinese
      ? `${view.delivery.mode}，基于 ${view.delivery.base_commit} 规划`
      : `${view.delivery.mode} planned from ${view.delivery.base_commit}`;
  }
  return view.delivery.pull_request_url
    ? `${view.delivery.commit} (${view.delivery.pull_request_url})`
    : (view.delivery.commit ?? (chinese ? "未记录" : "not recorded"));
}

function renderEvidenceSource(source: EvidenceSource, language: HumanLanguage): string {
  const chinese = language === "zh-CN";
  switch (source.type) {
    case "command":
      return `${chinese ? "命令" : "command"}: ${source.command} (${chinese ? "退出码" : "exit"} ${source.exit_code})${source.cwd && source.cwd !== "." ? `, ${chinese ? "目录" : "cwd"}: ${source.cwd}` : ""}`;
    case "artifact":
      return `${chinese ? "产物" : "artifact"}: ${source.path} (${source.bytes} ${chinese ? "字节" : "bytes"}, ${source.sha256})`;
    case "human":
      return `${chinese ? "人工确认" : "human"}: ${source.actor} (${source.host_confirmation_ref})`;
    case "url":
      return `URL: ${source.url} - ${source.summary}`;
  }
}

function renderCompactEvidenceSource(source: EvidenceSource, language: HumanLanguage): string {
  const chinese = language === "zh-CN";
  switch (source.type) {
    case "command":
      return `${chinese ? "命令" : "command"}: ${source.command} (${chinese ? "退出码" : "exit"} ${source.exit_code})`;
    case "artifact":
      return `${chinese ? "产物" : "artifact"}: ${source.path}`;
    case "human":
      return `${chinese ? "人工确认" : "human"}: ${source.actor}`;
    case "url":
      return `URL: ${source.url}`;
  }
}

export function writeTaskReport(root: string, taskId: string): string {
  return withTaskLock(root, taskId, () => writeTaskReportUnlocked(root, taskId));
}

function writeTaskReportUnlocked(root: string, taskId: string): string {
  const location = findTask(root, taskId);
  if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`);
  const filePath = safeProjectPath(root, path.posix.join(posixRelative(root, location.directory), "report.md"));
  writeTextAtomic(filePath, renderTaskReport(loadTaskView(root, taskId)));
  return filePath;
}

/** Append cross-session memory without making the journal lifecycle authority. */
export function appendJournalEntry(root: string, developer: string, entry: JournalEntry): string {
  validateJournalEntry(entry);
  const developerId = validateDeveloperId(developer);
  return withTaskLock(root, entry.task_id, () =>
    withExclusiveLock(journalLockPath(root, developerId), `developer journal ${developerId}`, () =>
      appendJournalEntryUnlocked(root, developerId, entry)
    )
  );
}

export function validateJournalEntry(entry: JournalEntry): void {
  if (!entry.title.trim() || !entry.summary.trim() || !entry.knowledge_summary.trim()) {
    throw new OpenNoriError("journal_entry_invalid", "Journal title, outcome summary, and knowledge decision are required.");
  }
}

function appendJournalEntryUnlocked(root: string, developer: string, entry: JournalEntry): string {
  const developerId = developer;
  const location = findTask(root, entry.task_id);
  if (!location) throw new OpenNoriError("task_not_found", `Task ${entry.task_id} was not found.`);
  const filePath = safeProjectPath(root, `.opennori/workspace/${developerId}/journal.md`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const existing = fs.existsSync(filePath) ? readText(filePath) : "";
  const marker = `<!-- opennori-task:${entry.task_id} -->`;
  if (
    existing.includes(marker) ||
    existing.includes(`- Task: ${entry.task_id}\n`) ||
    existing.includes(`- 任务: ${entry.task_id}\n`)
  ) {
    return filePath;
  }
  const recordedAt = entry.recorded_at ?? nowIso();
  const commits = entry.commits?.length ? entry.commits.join(", ") : "none";
  const knowledgeSummary = entry.knowledge_summary.trim();
  const language = humanLanguage(entry.title, entry.summary, knowledgeSummary);
  const chinese = language === "zh-CN";
  const block = [
    marker,
    `## ${recordedAt} - ${entry.title.trim()}`,
    "",
    `- ${chinese ? "任务" : "Task"}: ${entry.task_id}`,
    `- ${chinese ? "任务路径" : "Task path"}: ${posixRelative(root, location.directory)}`,
    `- ${chinese ? "状态" : "Status"}: ${renderJournalStatus(entry.status, language)}`,
    `- ${chinese ? "知识" : "Knowledge"}: ${renderKnowledgeDecision(entry.knowledge, language)}`,
    `- ${chinese ? "提交" : "Commits"}: ${commits === "none" && chinese ? "无" : commits}`,
    "",
    entry.summary.trim(),
    "",
    `${chinese ? "知识决策" : "Knowledge decision"}: ${knowledgeSummary}`,
    ""
  ].join("\n");
  const prefix = existing ? `${existing.trimEnd()}\n\n` : "# OpenNori Journal\n\n";
  writeTextAtomic(filePath, `${prefix}${block}`);
  return filePath;
}

function humanLanguage(...content: string[]): HumanLanguage {
  return content.some((value) => /\p{Script=Han}/u.test(value)) ? "zh-CN" : "en";
}

function renderTaskStatus(status: TaskView["task"]["status"], language: HumanLanguage): string {
  if (language === "en") return status;
  return { planning: "规划中", in_progress: "实现中", review: "验证中", completed: "已完成" }[status];
}

function renderTaskPhase(phase: TaskView["phase"], language: HumanLanguage): string {
  if (language === "en") return phase;
  return { plan: "规划", implement: "实现", verify: "验证", finish: "收尾" }[phase];
}

function renderContractStatus(status: "draft" | "approved", language: HumanLanguage): string {
  if (language === "en") return status;
  return status === "approved" ? "已批准" : "草案";
}

function renderEvidenceResult(
  result: "proven" | "failed" | "blocked" | "waived" | "unproven",
  language: HumanLanguage
): string {
  if (language === "en") return result;
  return { proven: "已证明", failed: "失败", blocked: "阻塞", waived: "已豁免", unproven: "未证明" }[result];
}

function renderKnowledgeDecision(decision: "promoted" | "none", language: HumanLanguage): string {
  if (language === "en") return decision;
  return decision === "promoted" ? "已沉淀" : "无";
}

function renderJournalStatus(status: JournalEntry["status"], language: HumanLanguage): string {
  if (language === "en") return status;
  return { in_progress: "进行中", completed: "已完成", blocked: "阻塞" }[status];
}

function validateDeveloperId(developer: string): string {
  const developerId = developer.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(developerId)) {
    throw new OpenNoriError("developer_invalid", `Developer name is not path-safe: ${developer}.`);
  }
  return developerId;
}

function journalLockPath(root: string, developer: string): string {
  const lockId = crypto.createHash("sha256").update(developer).digest("hex");
  return safeProjectPath(root, `.opennori/.runtime/locks/journal-${lockId}`);
}
