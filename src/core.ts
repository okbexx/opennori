import fs from "node:fs";
import path from "node:path";
import type { JsonObject, NoriArtifact, NoriResult, NoriWarning, ValidationIssue } from "./types.ts";

export const PROTOCOL_VERSION = "opennori/v1";

export const VALID_STATUSES = new Set(["unknown", "failing", "passing", "blocked", "waived"]);
export const VALID_EVIDENCE_RESULTS = new Set(["failing", "passing", "blocked", "waived"]);
export const VALID_PROFILE_STRENGTHS = new Set(["must", "prefer", "avoid"]);
export const VALID_PROFILE_ITEM_TYPES = new Set(["skill", "stack", "constraint"]);
export const VALID_PROFILE_RESULTS = new Set(["satisfied", "violated", "waived"]);
export const STRONG_EVIDENCE_KINDS = new Set([
  "test-summary",
  "screenshot",
  "artifact",
  "review-result",
  "human-confirmation",
  "protocol-v1"
]);
export const STRONG_CONFIDENCE = new Set(["verified", "reviewed", "human-confirmed"]);
const STRONG_EVIDENCE_BASIS = new Set(["human-confirmation", "tool-observation", "artifact-review", "protocol-check"]);
const REVIEWABLE_SOURCE_TYPES = new Set(["command", "artifact", "url"]);
const EVIDENCE_HEALTH_STALE_DAYS = 14;
const BULK_EVIDENCE_PATTERNS = [
  /is covered by the OpenNori .*implementation/i,
  /self contract refresh, tests, and reviewable artifacts/i,
  /covered by .* tests, and reviewable artifacts/i
];

const PLAN_FIELD_NAMES = new Set(["plan", "steps", "tasks", "todos", "next_steps", "implementation_plan"]);
const FORBIDDEN_USER_STORY_TERMS = [
  "acceptance.json",
  "evidence.json",
  "plan.md",
  "json",
  "schema",
  "script",
  "field",
  "file exists",
  "字段",
  "脚本",
  "命令",
  "计划",
  "实现步骤"
];
const USER_OPERATION_TERMS = [
  "运行",
  "打开",
  "查看",
  "选择",
  "阅读",
  "询问",
  "确认",
  "比较",
  "检查",
  "审查",
  "预览",
  "安装",
  "卸载",
  "归档",
  "添加",
  "修改",
  "提出",
  "触发",
  "执行",
  "创建",
  "run",
  "open",
  "view",
  "select",
  "read",
  "ask",
  "confirm",
  "compare",
  "review",
  "preview",
  "install",
  "uninstall",
  "archive",
  "add",
  "update",
  "check"
];
const USER_OUTCOME_TERMS = [
  "能",
  "看到",
  "显示",
  "输出",
  "返回",
  "包含",
  "结果",
  "状态",
  "缺口",
  "反馈",
  "报告",
  "摘要",
  "入口",
  "建议",
  "知道",
  "判断",
  "确认",
  "区分",
  "理解",
  "提示",
  "展示",
  "保留",
  "标明",
  "说明",
  "指出",
  "回答",
  "可复查",
  "可执行",
  "不需要",
  "不会",
  "不能",
  "不创建",
  "can",
  "see",
  "show",
  "output",
  "include",
  "result",
  "status",
  "gap",
  "report",
  "summary",
  "entry",
  "action",
  "return",
  "understand",
  "decide",
  "confirm",
  "distinguish",
  "explain",
  "answer",
  "review"
];
const IMPLEMENTATION_ONLY_PHRASES = [
  "文件存在",
  "字段存在",
  "命令执行成功",
  "测试通过",
  "用例通过",
  "模块实现",
  "接口实现",
  "函数实现",
  "组件实现",
  "schema 校验通过",
  "json 字段",
  "manifest 字段",
  "file exists",
  "field exists",
  "tests pass",
  "test passes",
  "module implemented",
  "function implemented",
  "schema passes"
];
const NEGATION_TERMS = ["不能", "不应", "不是", "不得", "避免", "cannot", "must not", "should not", "reject"];

function includesAny(text: unknown, terms: string[]): boolean {
  const lowered = String(text || "").toLowerCase();
  return terms.some((term) => lowered.includes(term.toLowerCase()));
}

function isImplementationOnly(text: unknown): boolean {
  const value = String(text || "");
  if (includesAny(value, NEGATION_TERMS)) return false;
  if (includesAny(value, USER_OPERATION_TERMS) && includesAny(value, USER_OUTCOME_TERMS)) return false;
  return includesAny(value, IMPLEMENTATION_ONLY_PHRASES);
}

export function inferCriterionLayer(id: unknown): string {
  if (String(id).startsWith("AC-P-")) return "protocol";
  if (String(id).startsWith("AC-O-")) return "operator";
  if (String(id).startsWith("AC-Z-")) return "productization";
  return "acceptance";
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function ok<T extends JsonObject = JsonObject>(
  data: T = {} as T,
  artifacts: NoriArtifact[] = [],
  warnings: NoriWarning[] = [],
  nextActions: string[] = []
): NoriResult<T> {
  return {
    ok: true,
    data,
    artifacts,
    warnings,
    next_actions: nextActions
  };
}

export function fail(type: string, message: string, fix?: string): NoriResult {
  const error: { type: string; message: string; fix?: string } = { type, message };
  if (fix) error.fix = fix;
  return { ok: false, error };
}

export function readJson(filePath: string): JsonObject {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    const typedError = error as NodeJS.ErrnoException;
    if (typedError?.code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`File must be JSON: ${typedError.message}`);
  }
}

export function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function slugify(input: unknown): string {
  const slug = String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "acceptance";
}

export function pathsForGoal(rootDir: string, goalId: string): { acceptancePath: string; evidencePath: string; reportPath: string } {
  const activeDir = path.join(rootDir, ".opennori", "active");
  return {
    acceptancePath: path.join(activeDir, `${goalId}.acceptance.md`),
    evidencePath: path.join(activeDir, `${goalId}.evidence.json`),
    reportPath: path.join(rootDir, ".opennori", "reports", `${goalId}.report.md`)
  };
}

export function findActivePairs(rootDir: string): Array<{ goalId: string; acceptancePath: string; evidencePath: string; reportPath: string }> {
  const activeDir = path.join(rootDir, ".opennori", "active");
  if (!fs.existsSync(activeDir)) return [];
  return fs.readdirSync(activeDir)
    .filter((fileName) => fileName.endsWith(".evidence.json"))
    .map((fileName) => {
      const goalId = fileName.replace(/\.evidence\.json$/, "");
      return {
        goalId,
        acceptancePath: path.join(activeDir, `${goalId}.acceptance.md`),
        evidencePath: path.join(activeDir, fileName),
        reportPath: path.join(rootDir, ".opennori", "reports", `${goalId}.report.md`)
      };
    })
    .filter((pair) => fs.existsSync(pair.acceptancePath))
    .sort((left, right) => left.goalId.localeCompare(right.goalId));
}

export function buildContractFromBrief(brief: JsonObject): JsonObject {
  const goal = String(brief.goal || "").trim();
  const goalId = slugify(brief.goal_id || goal.slice(0, 60));
  const criteria = (brief.criteria || []).map((criterion: JsonObject, index: number) => ({
    id: String(criterion.id || `AC-${index + 1}`),
    layer: String(criterion.layer || inferCriterionLayer(criterion.id || `AC-${index + 1}`)),
    user_story: String(criterion.user_story || "").trim(),
    measurement: String(criterion.measurement || "").trim(),
    threshold: String(criterion.threshold || "").trim(),
    required: criterion.required !== false,
    risk: criterion.risk || "medium"
  }));

  return {
    protocol_version: PROTOCOL_VERSION,
    goal_id: goalId,
    goal,
    created_at: nowIso(),
    acceptance_basis: brief.acceptance_basis || { status: "draft" },
    criteria
  };
}

export function buildEvidenceLedger(contract: JsonObject): JsonObject {
  const criteria: JsonObject = {};
  for (const criterion of contract.criteria) {
    criteria[criterion.id] = {
      status: "unknown",
      confidence: "none",
      required: criterion.required !== false,
      risk: criterion.risk || "medium",
      evidence: []
    };
  }

  return {
    protocol_version: PROTOCOL_VERSION,
    goal_id: contract.goal_id,
    status: "active",
    updated_at: nowIso(),
    criteria,
    capability_profile: {
      items: [],
      evidence: []
    }
  };
}

export function addProfileItem(ledger: JsonObject, item: JsonObject): JsonObject {
  if (!ledger.capability_profile) {
    ledger.capability_profile = { items: [], evidence: [] };
  }
  const type = item.type || "constraint";
  const strength = item.strength || "prefer";
  if (!VALID_PROFILE_ITEM_TYPES.has(type)) {
    throw new Error(`Invalid profile item type: ${type}`);
  }
  if (!VALID_PROFILE_STRENGTHS.has(strength)) {
    throw new Error(`Invalid profile strength: ${strength}`);
  }
  const id = item.id || slugify(`${type}-${item.name}`);
  const existingIndex = ledger.capability_profile.items.findIndex((entry: JsonObject) => entry.id === id);
  const entry = {
    id,
    type,
    name: String(item.name || "").trim(),
    strength,
    purpose: String(item.purpose || "").trim(),
    scope: String(item.scope || "").trim(),
    install_policy: item.install_policy || "ask_before_install",
    evidence: []
  };
  if (!entry.name) throw new Error("--name is required");
  if (existingIndex === -1) {
    ledger.capability_profile.items.push(entry);
  } else {
    ledger.capability_profile.items[existingIndex] = {
      ...ledger.capability_profile.items[existingIndex],
      ...entry,
      evidence: ledger.capability_profile.items[existingIndex].evidence || []
    };
  }
  return ledger;
}

export function addProfileEvidence(ledger: JsonObject, itemId: string, evidence: JsonObject): JsonObject {
  if (!ledger.capability_profile) {
    ledger.capability_profile = { items: [], evidence: [] };
  }
  const item = ledger.capability_profile.items.find((entry: JsonObject) => entry.id === itemId);
  if (!item) throw new Error(`Capability profile item not found: ${itemId}`);
  if (!VALID_PROFILE_RESULTS.has(evidence.result)) {
    throw new Error(`Invalid profile evidence result: ${evidence.result}`);
  }
  const entry = {
    item_id: itemId,
    result: evidence.result,
    summary: evidence.summary,
    path: evidence.path,
    created_at: nowIso()
  };
  item.evidence = [...(item.evidence || []), entry];
  ledger.capability_profile.evidence.push(entry);
  ledger.updated_at = nowIso();
  return ledger;
}

function basisForEvidenceKind(kind: string): string {
  if (kind === "human-confirmation") return "human-confirmation";
  if (kind === "test-summary" || kind === "review-result") return "tool-observation";
  if (kind === "screenshot" || kind === "artifact") return "artifact-review";
  if (kind === "protocol-v1") return "protocol-check";
  return "agent-observation";
}

function normalizeEvidenceSource(source: unknown): JsonObject | null {
  if (source === null || source === undefined) return null;
  if (typeof source === "string") {
    const label = source.trim();
    return label ? { type: "reference", label } : null;
  }
  if (typeof source !== "object" || Array.isArray(source)) return null;

  const entry: JsonObject = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      entry[key] = value;
    }
  }
  if (Object.keys(entry).length === 0) return null;
  if (!entry.type) entry.type = "reference";
  if (!entry.label) {
    entry.label = entry.path || entry.url || entry.command || entry.summary || entry.type;
  }
  return entry;
}

function normalizeEvidence(evidence: JsonObject): JsonObject {
  const sources = (Array.isArray(evidence.sources) ? evidence.sources : [])
    .map((source: unknown) => normalizeEvidenceSource(source))
    .filter((source): source is JsonObject => Boolean(source));
  if (evidence.path && !sources.some((source) => source.path === evidence.path)) {
    sources.push({ type: "artifact", label: evidence.path, path: evidence.path });
  }
  return {
    ...evidence,
    kind: evidence.kind || "manual",
    basis: evidence.basis || basisForEvidenceKind(evidence.kind || "manual"),
    sources,
    reviewability: evidence.reviewability || (sources.length > 0 ? "source-provided" : "summary-only"),
    limitations: evidence.limitations || ""
  };
}

export function profileCompliance(ledger: JsonObject): JsonObject {
  const items = ledger.capability_profile?.items || [];
  const statuses = items.map((item: JsonObject) => {
    const latest = item.evidence?.at(-1);
    let status = "unknown";
    if (latest?.result === "satisfied") status = "satisfied";
    if (latest?.result === "waived") status = "waived";
    if (latest?.result === "violated") status = "violated";
    return {
      id: item.id,
      type: item.type,
      name: item.name,
      strength: item.strength,
      purpose: item.purpose,
      status,
      summary: latest?.summary || "<none>"
    };
  });
  const blocking = statuses.filter((item: JsonObject) => item.strength === "must" && (item.status === "unknown" || item.status === "violated"));
  const avoidedViolations = statuses.filter((item: JsonObject) => item.strength === "avoid" && item.status === "violated");
  return {
    required: items.length > 0,
    complete: blocking.length === 0 && avoidedViolations.length === 0,
    blocking: [...blocking, ...avoidedViolations],
    statuses
  };
}

export function renderAcceptanceMarkdown(contract: JsonObject, ledger: JsonObject): string {
  const lines = [
    `# ${contract.goal_id} Acceptance Contract`,
    "",
    "## Goal",
    "",
    contract.goal,
    "",
    "## Acceptance Basis",
    "",
    `Status: ${contract.acceptance_basis?.status || "draft"}`,
    contract.acceptance_basis?.summary ? `Summary: ${contract.acceptance_basis.summary}` : "Summary: <none>",
    "",
    "## Nori Profile",
    "",
    ...renderProfileLines(ledger),
    "",
    "## User Acceptance Criteria",
    "",
    "| ID | Layer | User acceptance criterion | Measurement | Passing threshold | Status |",
    "| --- | --- | --- | --- | --- | --- |"
  ];

  for (const criterion of contract.criteria) {
    const status = ledger.criteria[criterion.id]?.status || "unknown";
    lines.push(`| ${criterion.id} | ${criterion.layer || inferCriterionLayer(criterion.id)} | ${criterion.user_story} | ${criterion.measurement} | ${criterion.threshold} | ${status} |`);
  }

  lines.push(
    "",
    "## Rule",
    "",
    "Progress is determined by acceptance evidence, not by implementation steps."
  );

  return `${lines.join("\n")}\n`;
}

export function syncAcceptanceMarkdown(acceptancePath: string, contract: JsonObject, ledger: JsonObject): void {
  fs.writeFileSync(acceptancePath, renderAcceptanceMarkdown(contract, ledger));
}

function renderProfileLines(ledger: JsonObject): string[] {
  const compliance = profileCompliance(ledger);
  if (!compliance.required) return ["<none>"];
  return [
    "| ID | Type | Name | Strength | Compliance | Purpose |",
    "| --- | --- | --- | --- | --- | --- |",
    ...compliance.statuses.map((item: JsonObject) => `| ${item.id} | ${item.type} | ${item.name} | ${item.strength} | ${item.status} | ${item.purpose || "<none>"} |`)
  ];
}

export function parseAcceptanceMarkdown(markdown: string): JsonObject {
  const goalMatch = markdown.match(/## Goal\s+([\s\S]*?)(?:\n## Acceptance Basis|\n## User Acceptance Criteria)/);
  const tableMatch = markdown.match(/## User Acceptance Criteria\s+([\s\S]*?)(?:\n## |\n$)/);
  const goal = goalMatch?.[1]?.trim() || "";
  const criteria: JsonObject[] = [];

  if (tableMatch) {
    for (const line of (tableMatch[1] || "").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("|") || trimmed.includes("---") || trimmed.includes("User acceptance criterion")) {
        continue;
      }
      const cells = trimmed.split("|").slice(1, -1).map((cell: string) => cell.trim());
      if (cells.length >= 6) {
        criteria.push({
          id: cells[0],
          layer: cells[1],
          user_story: cells[2],
          measurement: cells[3],
          threshold: cells[4],
          status: cells[5]
        });
      } else if (cells.length >= 5) {
        criteria.push({
          id: cells[0],
          layer: inferCriterionLayer(cells[0]),
          user_story: cells[1],
          measurement: cells[2],
          threshold: cells[3],
          status: cells[4]
        });
      }
    }
  }

  return { goal, criteria };
}

export function validateContract(contract: JsonObject, ledger: JsonObject | null = null): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (contract.protocol_version !== PROTOCOL_VERSION) {
    issues.push({ path: "protocol_version", message: `Must be ${PROTOCOL_VERSION}` });
  }
  if (!contract.goal) {
    issues.push({ path: "goal", message: "Goal is required" });
  }
  for (const field of Object.keys(contract)) {
    if (PLAN_FIELD_NAMES.has(field)) {
      issues.push({ path: field, message: "OpenNori contract must not expose process-plan fields" });
    }
  }
  if (!Array.isArray(contract.criteria) || contract.criteria.length === 0) {
    issues.push({ path: "criteria", message: "At least one user acceptance criterion is required" });
    return issues;
  }

  const ids = new Set();
  contract.criteria.forEach((criterion: JsonObject, index: number) => {
    const prefix = `criteria[${index}]`;
    if (!criterion.id) {
      issues.push({ path: `${prefix}.id`, message: "Criterion id is required" });
    } else if (ids.has(criterion.id)) {
      issues.push({ path: `${prefix}.id`, message: `Duplicate criterion id: ${criterion.id}` });
    }
    ids.add(criterion.id);

    for (const field of ["user_story", "measurement", "threshold"]) {
      if (!criterion[field]) {
        issues.push({ path: `${prefix}.${field}`, message: `${field} is required` });
      }
    }

    const userStory = String(criterion.user_story || "");
    if (userStory && !userStory.startsWith("作为用户") && !userStory.toLowerCase().startsWith("as a user")) {
      issues.push({
        path: `${prefix}.user_story`,
        message: "Acceptance criterion must be written from the user's perspective"
      });
    }

    const lowered = userStory.toLowerCase();
    const terms = FORBIDDEN_USER_STORY_TERMS.filter((term) => lowered.includes(term.toLowerCase()));
    if (terms.length > 0) {
      issues.push({
        path: `${prefix}.user_story`,
        message: "Implementation detail appears in user acceptance criterion",
        terms
      });
    }

    const measurement = String(criterion.measurement || "");
    if (measurement && !includesAny(measurement, USER_OPERATION_TERMS)) {
      issues.push({
        path: `${prefix}.measurement`,
        message: "Measurement must describe a user operation or review action"
      });
    }

    const threshold = String(criterion.threshold || "");
    if (threshold && !includesAny(threshold, USER_OUTCOME_TERMS)) {
      issues.push({
        path: `${prefix}.threshold`,
        message: "Passing threshold must describe a user-observable outcome or judgment"
      });
    }

    for (const [field, value] of Object.entries({ measurement, threshold })) {
      if (isImplementationOnly(value)) {
        issues.push({
          path: `${prefix}.${field}`,
          message: "Implementation-only completion condition is not a user acceptance criterion"
        });
      }
    }

    if (ledger && !ledger.criteria?.[criterion.id]) {
      issues.push({ path: `ledger.criteria.${criterion.id}`, message: "Evidence ledger is missing this criterion" });
    }
  });

  if (ledger) {
    if (ledger.protocol_version !== PROTOCOL_VERSION) {
      issues.push({ path: "ledger.protocol_version", message: `Must be ${PROTOCOL_VERSION}` });
    }
    for (const [criterionId, state] of Object.entries(ledger.criteria || {}) as Array<[string, JsonObject]>) {
      if (!ids.has(criterionId)) {
        issues.push({ path: `ledger.criteria.${criterionId}`, message: "Evidence ledger has an unknown criterion" });
      }
      if (!VALID_STATUSES.has(state.status)) {
        issues.push({ path: `ledger.criteria.${criterionId}.status`, message: `Invalid status: ${state.status}` });
      }
    }
    for (const item of ledger.capability_profile?.items || []) {
      if (!VALID_PROFILE_ITEM_TYPES.has(item.type)) {
        issues.push({ path: `ledger.capability_profile.items.${item.id}.type`, message: `Invalid profile item type: ${item.type}` });
      }
      if (!VALID_PROFILE_STRENGTHS.has(item.strength)) {
        issues.push({ path: `ledger.capability_profile.items.${item.id}.strength`, message: `Invalid profile strength: ${item.strength}` });
      }
    }
  }

  return issues;
}

export function addEvidence(contract: JsonObject, ledger: JsonObject, criterionId: string, evidence: JsonObject): JsonObject {
  const criterion = contract.criteria.find((item: JsonObject) => item.id === criterionId);
  if (!criterion) {
    throw new Error(`Criterion not found: ${criterionId}`);
  }
  if (!VALID_EVIDENCE_RESULTS.has(evidence.result)) {
    throw new Error(`Invalid evidence result: ${evidence.result}`);
  }

  const state = ledger.criteria[criterionId];
  const normalized = normalizeEvidence(evidence);
  const gated = applyRiskGate(criterion, normalized);
  state.evidence.push({
    kind: normalized.kind,
    basis: normalized.basis,
    summary: normalized.summary,
    result: gated.result,
    confidence: gated.confidence,
    path: normalized.path,
    sources: normalized.sources,
    reviewability: normalized.reviewability,
    limitations: normalized.limitations,
    gate: gated.gate,
    created_at: nowIso()
  });
  state.status = gated.result;
  state.confidence = gated.confidence;
  ledger.updated_at = nowIso();
  recomputeWorkflowStatus(contract, ledger);
  return ledger;
}

export function applyRiskGate(criterion: JsonObject, evidence: JsonObject): JsonObject {
  const requestedResult = evidence.result;
  const confidence = evidence.confidence || confidenceForEvidence(criterion.risk, requestedResult);
  if (requestedResult !== "passing" || criterion.risk !== "high") {
    return { result: requestedResult, confidence, gate: "accepted" };
  }

  const hasReviewableSource = Array.isArray(evidence.sources)
    && evidence.sources.some((source: JsonObject) => REVIEWABLE_SOURCE_TYPES.has(source.type));
  const hasStrongEvidence = STRONG_EVIDENCE_KINDS.has(evidence.kind)
    || STRONG_EVIDENCE_BASIS.has(evidence.basis)
    || STRONG_CONFIDENCE.has(evidence.confidence)
    || hasReviewableSource;

  if (hasStrongEvidence) {
    return {
      result: "passing",
      confidence: evidence.confidence || "verified",
      gate: "accepted"
    };
  }

  return {
    result: "failing",
    confidence: "strong-evidence-required",
    gate: "downgraded_high_risk_requires_strong_evidence"
  };
}

export function confidenceForEvidence(risk: string, result: string): string {
  if (result !== "passing") return "evidence";
  if (risk === "low") return "agent";
  if (risk === "medium") return "verified";
  if (risk === "high") return "review-required";
  return "human-required";
}

export function recomputeWorkflowStatus(contract: JsonObject, ledger: JsonObject): JsonObject {
  const requiredStates = contract.criteria
    .filter((criterion: JsonObject) => criterion.required !== false)
    .map((criterion: JsonObject) => ledger.criteria[criterion.id]?.status || "unknown");
  const approved = contract.acceptance_basis?.status === "approved";
  const compliance = profileCompliance(ledger);

  if (requiredStates.some((status: string) => status === "blocked")) {
    ledger.status = "blocked";
  } else if (compliance.required && !compliance.complete) {
    ledger.status = "blocked";
  } else if (approved && requiredStates.length > 0 && requiredStates.every((status: string) => status === "passing" || status === "waived")) {
    ledger.status = "complete";
  } else {
    ledger.status = "active";
  }
  ledger.updated_at = nowIso();
  return ledger;
}

export function currentGap(contract: JsonObject, ledger: JsonObject): JsonObject | null {
  if (contract.acceptance_basis?.status !== "approved") {
    return {
      id: "ACCEPTANCE-BASIS",
      user_story: "作为用户，我需要先确认或修改验收标准，才能让 agent 判断任务完成。",
      status: "unknown",
      reason: "Acceptance criteria have not been approved by the user yet."
    };
  }

  const compliance = profileCompliance(ledger);
  if (compliance.required && !compliance.complete) {
    const item = compliance.blocking[0] || {};
    return {
      id: `PROFILE-${item.id}`,
      user_story: `作为用户，我需要 agent 遵守能力偏好：${item.name}。`,
      status: item.status === "violated" ? "failing" : "blocked",
      reason: `Capability profile item ${item.name} is ${item.status}.`
    };
  }

  const priority = ["failing", "blocked", "unknown"];
  for (const status of priority) {
    for (const criterion of contract.criteria) {
      const state = ledger.criteria[criterion.id];
      if (criterion.required === false) continue;
      if ((state?.status || "unknown") === status) {
        return {
          id: criterion.id,
          user_story: criterion.user_story,
          status,
          reason: gapReason(status)
        };
      }
    }
  }
  return null;
}

export function intervention(contract: JsonObject, ledger: JsonObject): JsonObject {
  const compliance = profileCompliance(ledger);
  if (compliance.required && !compliance.complete) {
    const item = compliance.blocking[0] || {};
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

export function completionAnswer(contract: JsonObject, ledger: JsonObject): JsonObject {
  const gap = currentGap(contract, ledger);
  const health = evidenceHealth(contract, ledger);
  if (!gap && ledger.status === "complete" && health.status !== "clear") {
    return {
      complete: false,
      answer: `Not confidently complete: ${health.summary}`
    };
  }
  if (!gap && ledger.status === "complete") {
    return {
      complete: true,
      answer: "Complete: all required acceptance criteria have passing or waived evidence."
    };
  }
  return {
    complete: false,
    answer: `Not complete: ${gap ? `${gap.id} is ${gap.status}. ${gap.reason}` : `workflow status is ${ledger.status}.`}`
  };
}

export function nextRecommendation(contract: JsonObject, ledger: JsonObject): JsonObject {
  const gap = currentGap(contract, ledger);
  const needed = intervention(contract, ledger);
  const health = evidenceHealth(contract, ledger);

  if (needed.required) {
    return {
      status: "user-intervention-required",
      focus: needed.criterion,
      summary: `${needed.criterion} needs user input before the agent continues.`,
      actions: [
        needed.action,
        "After the decision or external condition is available, record evidence and rerun OpenNori status."
      ]
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

    return {
      status: "work-on-current-gap",
      focus: gap.id,
      summary: `Continue with ${gap.id}: ${gap.user_story}`,
      actions: [
        `Create or collect reviewable evidence for ${gap.id}.`,
        `Record the result for ${gap.id}, then rerun OpenNori status.`
      ]
    };
  }

  if (ledger.status === "complete" && health.status !== "clear") {
    return {
      status: "evidence-review-required",
      focus: null,
      summary: "All required ACs have passing or waived evidence, but evidence health needs review before confidently claiming completion.",
      actions: [
        "Review evidence_health findings.",
        "Refresh stale, broad, or summary-only evidence with reviewable sources, reviewability, and limitations."
      ]
    };
  }

  if (ledger.status === "complete") {
    return {
      status: "ready-for-next-loop",
      focus: null,
      summary: "This OpenNori goal is complete. If the user has asked to continue, start the next acceptance loop without waiting for another next-step prompt.",
      actions: [
        "Report the completion evidence briefly.",
        "Select the next human-facing project goal from the current context, draft acceptance criteria, and continue the OpenNori loop."
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

export function gapReason(status: string): string {
  if (status === "failing") return "Existing evidence shows this user acceptance criterion is not satisfied.";
  if (status === "blocked") return "This user acceptance criterion needs a user decision or external condition.";
  return "This user acceptance criterion has no user-understandable evidence yet.";
}

export function evidenceView(evidence: JsonObject | null | undefined): JsonObject | null {
  if (!evidence) return null;
  const sources = Array.isArray(evidence.sources) ? evidence.sources : [];
  return {
    kind: evidence.kind || "manual",
    basis: evidence.basis || basisForEvidenceKind(evidence.kind || "manual"),
    summary: evidence.summary || "<none>",
    result: evidence.result || "unknown",
    confidence: evidence.confidence,
    sources,
    reviewability: evidence.reviewability || (sources.length > 0 || evidence.path ? "source-provided" : "summary-only"),
    limitations: evidence.limitations || "",
    path: evidence.path,
    gate: evidence.gate,
    created_at: evidence.created_at
  };
}

export function criterionStatusRows(contract: JsonObject, ledger: JsonObject): JsonObject[] {
  return contract.criteria.map((criterion: JsonObject) => {
    const state = ledger.criteria[criterion.id] || {};
    return {
      id: criterion.id,
      layer: criterion.layer || inferCriterionLayer(criterion.id),
      user_story: criterion.user_story,
      status: state.status || "unknown",
      confidence: state.confidence || "none",
      latest_evidence: evidenceView(state.evidence?.at(-1))
    };
  });
}

function evidenceAgeDays(evidence: JsonObject | null | undefined, now = Date.now()): number | null {
  if (!evidence?.created_at) return null;
  const timestamp = Date.parse(evidence.created_at);
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, Math.floor((now - timestamp) / 86400000));
}

function evidenceHasReviewableSource(evidence: JsonObject | null | undefined): boolean {
  const sources = Array.isArray(evidence?.sources) ? evidence.sources : [];
  return sources.some((source: JsonObject) => REVIEWABLE_SOURCE_TYPES.has(source.type)) || Boolean(evidence?.path);
}

function evidenceHasReviewability(evidence: JsonObject | null | undefined): boolean {
  const value = String(evidence?.reviewability || "").trim();
  return value.length > 0 && value !== "summary-only";
}

function evidenceSummaryLooksBulk(evidence: JsonObject | null | undefined): boolean {
  const summary = String(evidence?.summary || "");
  return BULK_EVIDENCE_PATTERNS.some((pattern) => pattern.test(summary));
}

export function evidenceHealth(contract: JsonObject, ledger: JsonObject, { now = Date.now(), staleDays = EVIDENCE_HEALTH_STALE_DAYS } = {}): JsonObject {
  const findings: JsonObject[] = [];
  for (const criterion of contract.criteria || []) {
    if (criterion.required === false) continue;
    const state = ledger.criteria?.[criterion.id];
    const latest = state?.evidence?.at(-1);
    if (!["passing", "waived"].includes(state.status)) continue;
    if (!latest) continue;

    const ageDays = evidenceAgeDays(latest, now);
    if (ageDays === null) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "missing-evidence-date",
        message: "Latest passing evidence has no created_at timestamp.",
        recovery: "Record fresh evidence with a timestamp before relying on completion."
      });
    } else if (ageDays > staleDays) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "stale-evidence",
        message: `Latest passing evidence is ${ageDays} days old.`,
        recovery: "Refresh the evidence if the changed code, docs, website, package, or project state has moved since then."
      });
    }

    if (!evidenceHasReviewableSource(latest)) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "missing-reviewable-source",
        message: "Latest passing evidence has no command, artifact, URL, or path source.",
        recovery: "Add a source that a human or review tool can inspect."
      });
    }

    if (!evidenceHasReviewability(latest)) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "missing-reviewability",
        message: "Latest passing evidence does not explain how to review it.",
        recovery: "Add a short reviewability note."
      });
    }

    if (!String(latest.limitations || "").trim()) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "missing-limitations",
        message: "Latest passing evidence has no stated limitations.",
        recovery: "State what the evidence does not prove."
      });
    }

    if (evidenceSummaryLooksBulk(latest)) {
      findings.push({
        criterion_id: criterion.id,
        severity: "review",
        issue: "bulk-evidence-summary",
        message: "Latest passing evidence looks like a broad batch summary rather than criterion-specific proof.",
        recovery: "Replace or supplement it with criterion-specific evidence."
      });
    }
  }

  return {
    status: findings.length === 0 ? "clear" : "review",
    summary: findings.length === 0
      ? "Latest evidence is reviewable enough for the current contract."
      : `${findings.length} evidence health finding(s) need review.`,
    stale_days: staleDays,
    findings
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

function formatEvidenceSource(source: unknown): string {
  if (!source) return "<none>";
  if (typeof source === "string") return source;
  const preferredKeys = ["type", "label", "command", "path", "url", "outcome", "summary"];
  const sourceRecord = source as JsonObject;
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

function formatEvidenceSources(evidence: JsonObject | null | undefined): string {
  const view = evidenceView(evidence);
  if (!view) return "<none>";
  if (view.sources.length === 0) return view.path || "<none>";
  return view.sources.map((source: unknown) => formatEvidenceSource(source)).join("; ");
}

export function renderReport(contract: JsonObject, ledger: JsonObject): string {
  const gap = currentGap(contract, ledger);
  const needed = intervention(contract, ledger);
  const completion = completionAnswer(contract, ledger);
  const health = evidenceHealth(contract, ledger);
  const lines = [
    `# ${contract.goal_id} Acceptance Report`,
    "",
    "## Decision Summary",
    "",
    `Completion: ${completion.answer}`,
    `Current gap: ${gap ? `${gap.id} - ${gap.reason}` : "None. All required acceptance criteria have passing or waived evidence."}`,
    `User intervention: ${needed.required ? `${needed.criterion} - ${needed.action}` : needed.action}`,
    `Recommended next action: ${nextRecommendation(contract, ledger).summary}`,
    `Workflow status: ${ledger.status}`,
    "",
    "## Goal",
    "",
    contract.goal,
    "",
    "## Acceptance Basis",
    "",
    `Status: ${contract.acceptance_basis?.status || "draft"}`,
    contract.acceptance_basis?.summary ? `Summary: ${contract.acceptance_basis.summary}` : "Summary: <none>",
    "",
    "## Nori Profile",
    "",
    ...renderProfileLines(ledger),
    "",
    "## Acceptance Status",
    "",
    "| ID | Layer | User acceptance criterion | Status | Confidence | Evidence summary | Basis | Sources | Reviewability | Limitations |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const criterion of contract.criteria) {
    const state = ledger.criteria[criterion.id] || {};
    const latest = state.evidence?.at(-1);
    const view = evidenceView(latest);
    const evidence = view ? `${view.kind}: ${view.summary}` : "<none>";
    lines.push(`| ${criterion.id} | ${criterion.layer || inferCriterionLayer(criterion.id)} | ${escapeTableCell(criterion.user_story)} | ${state.status || "unknown"} | ${state.confidence || "none"} | ${escapeTableCell(evidence)} | ${view?.basis || "<none>"} | ${escapeTableCell(formatEvidenceSources(latest))} | ${view?.reviewability || "<none>"} | ${escapeTableCell(view?.limitations || "<none>")} |`);
  }

  lines.push("", "## Current Acceptance Gap", "");
  lines.push(gap ? `${gap.id} - ${gap.reason}` : "None. All required acceptance criteria have passing or waived evidence.");
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
