import fs from "node:fs";
import path from "node:path";
import type {
  AcceptanceCriterion,
  CriterionLedgerState,
  EvidenceLedger,
  EvidenceRecord,
  JsonObject,
  NoriArtifact,
  NoriContract,
  NoriEvidencePayload,
  NoriResult,
  NoriWarning
} from "../types.ts";

export const PROTOCOL_VERSION = "opennori/v1";
export type GoalStateLocation = "current" | "drafts" | "completed" | "blocked" | "active";

export function inferCriterionLayer(id: unknown): string {
  if (String(id).startsWith("AC-P-")) return "protocol";
  if (String(id).startsWith("AC-O-")) return "operator";
  if (String(id).startsWith("AC-Z-")) return "productization";
  return "acceptance";
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function ok<T extends object = JsonObject>(
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

export function readJson<T extends object = JsonObject>(filePath: string): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
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

export function goalStateDir(rootDir: string, location: GoalStateLocation): string {
  return path.join(rootDir, ".opennori", location);
}

export function pathsForGoal(
  rootDir: string,
  goalId: string,
  location: GoalStateLocation = "current"
): {
  goalDir: string;
  contractPath: string;
  ledgerPath: string;
  acceptancePath: string;
  evidencePath: string;
  criteriaDir: string;
  reportPath: string;
  location: GoalStateLocation;
} {
  const stateDir = goalStateDir(rootDir, location);
  const goalDir = path.join(stateDir, goalId);
  return {
    goalDir,
    contractPath: path.join(goalDir, "contract.json"),
    ledgerPath: path.join(goalDir, "ledger.json"),
    acceptancePath: path.join(goalDir, "README.md"),
    evidencePath: path.join(goalDir, "ledger.json"),
    criteriaDir: path.join(goalDir, "criteria"),
    reportPath: path.join(rootDir, ".opennori", "reports", `${goalId}.report.md`),
    location
  };
}

export type GoalStatePair = {
  goalId: string;
  goalDir: string;
  contractPath: string;
  ledgerPath: string;
  acceptancePath: string;
  evidencePath: string;
  criteriaDir: string;
  reportPath: string;
  location: GoalStateLocation;
};

export function inferGoalLocation(filePath: string): GoalStateLocation | undefined {
  const parts = path.resolve(filePath).split(path.sep);
  const noriIndex = parts.lastIndexOf(".opennori");
  const location = noriIndex >= 0 ? parts[noriIndex + 1] : undefined;
  if (location === "current" || location === "drafts" || location === "completed" || location === "blocked" || location === "active") {
    return location;
  }
  return undefined;
}

export function findGoalPairs(rootDir: string, location: GoalStateLocation): GoalStatePair[] {
  const stateDir = goalStateDir(rootDir, location);
  if (!fs.existsSync(stateDir)) return [];
  return fs.readdirSync(stateDir)
    .map((entryName) => {
      const goalDir = path.join(stateDir, entryName);
      if (!fs.existsSync(goalDir) || !fs.statSync(goalDir).isDirectory()) return null;
      const paths = pathsForGoal(rootDir, entryName, location);
      return {
        goalId: entryName,
        ...paths
      };
    })
    .filter((pair): pair is GoalStatePair => Boolean(pair && fs.existsSync(pair.contractPath) && fs.existsSync(pair.ledgerPath)))
    .sort((left, right) => left.goalId.localeCompare(right.goalId));
}

export function findCurrentPairs(rootDir: string): GoalStatePair[] {
  return findGoalPairs(rootDir, "current");
}

export function findDraftPairs(rootDir: string): GoalStatePair[] {
  return findGoalPairs(rootDir, "drafts");
}

export function findHistoryPairs(rootDir: string): GoalStatePair[] {
  return [...findGoalPairs(rootDir, "completed"), ...findGoalPairs(rootDir, "blocked")]
    .sort((left, right) => left.goalId.localeCompare(right.goalId));
}

export function findLegacyActivePairs(rootDir: string): GoalStatePair[] {
  return findGoalPairs(rootDir, "active");
}

export function findActivePairs(rootDir: string): GoalStatePair[] {
  return findCurrentPairs(rootDir);
}

function criteriaDirForGoalDir(goalDir: string): string {
  return path.join(goalDir, "criteria");
}

function criterionDir(goalDir: string, criterionId: string): string {
  return path.join(criteriaDirForGoalDir(goalDir), criterionId);
}

function safeFilePart(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "evidence";
}

function evidenceFileName(evidence: EvidenceRecord, index: number): string {
  const sequence = String(index + 1).padStart(3, "0");
  const stamp = evidence.created_at ? safeFilePart(evidence.created_at) : "undated";
  const kind = safeFilePart(evidence.kind || "evidence");
  return `${sequence}-${stamp}-${kind}.json`;
}

function relativeInsideGoal(goalDir: string, filePath: string): string {
  return path.relative(goalDir, filePath) || ".";
}

function renderCriterionReadme(input: {
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

function renderGoalReadme(contract: NoriContract, ledger: EvidenceLedger): string {
  const language = contract.presentation?.language === "zh-CN" ? "zh-CN" : "en";
  const zh = language === "zh-CN";
  const basis = contract.acceptance_basis || { status: "draft" };
  const list = (value: unknown): string[] => Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
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

function writeCriterionDossier(goalDir: string, contract: NoriContract, ledger: EvidenceLedger, criterion: AcceptanceCriterion, order: number): void {
  const dir = criterionDir(goalDir, criterion.id);
  const evidenceDir = path.join(dir, "evidence");
  const artifactsDir = path.join(dir, "artifacts");
  const state = ledger.criteria?.[criterion.id];
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.mkdirSync(artifactsDir, { recursive: true });

  writeJson(path.join(dir, "criterion.json"), {
    ...criterion,
    order
  });
  writeJson(path.join(dir, "status.json"), {
    criterion_id: criterion.id,
    status: state?.status || "unknown",
    confidence: state?.confidence || "none",
    required: criterion.required !== false,
    risk: criterion.risk || state?.risk || "medium",
    evidence_count: Array.isArray(state?.evidence) ? state.evidence.length : 0,
    latest_evidence_summary: state?.evidence?.at(-1)?.summary || null,
    updated_at: ledger.updated_at
  });

  for (const fileName of fs.readdirSync(evidenceDir)) {
    if (fileName.endsWith(".json")) fs.rmSync(path.join(evidenceDir, fileName), { force: true });
  }
  for (const [index, evidence] of (state?.evidence || []).entries()) {
    writeJson(path.join(evidenceDir, evidenceFileName(evidence, index)), evidence);
  }
  fs.writeFileSync(path.join(dir, "README.md"), renderCriterionReadme({ contract, criterion, state, goalDir }));
}

export function writeGoalDossier(goalDir: string, contract: NoriContract, ledger: EvidenceLedger): void {
  fs.mkdirSync(goalDir, { recursive: true });
  writeJson(path.join(goalDir, "contract.json"), contract);
  writeJson(path.join(goalDir, "ledger.json"), ledger);
  fs.writeFileSync(path.join(goalDir, "README.md"), renderGoalReadme(contract, ledger));

  const criteriaDir = criteriaDirForGoalDir(goalDir);
  fs.mkdirSync(criteriaDir, { recursive: true });
  const activeCriterionIds = new Set(contract.criteria.map((criterion) => criterion.id));
  for (const entryName of fs.readdirSync(criteriaDir)) {
    const entryPath = path.join(criteriaDir, entryName);
    if (fs.statSync(entryPath).isDirectory() && !activeCriterionIds.has(entryName)) {
      fs.rmSync(entryPath, { recursive: true, force: true });
    }
  }
  contract.criteria.forEach((criterion, index) => writeCriterionDossier(goalDir, contract, ledger, criterion, index));
}

export function writeGoalDossierFromPaths(acceptancePath: string, _evidencePath: string, contract: NoriContract, ledger: EvidenceLedger): void {
  writeGoalDossier(path.dirname(acceptancePath), contract, ledger);
}

function readCriterionDossiers(goalDir: string, contract: NoriContract): AcceptanceCriterion[] {
  const criteriaDir = criteriaDirForGoalDir(goalDir);
  if (!fs.existsSync(criteriaDir)) return contract.criteria || [];
  const criteria = fs.readdirSync(criteriaDir)
    .map((entryName) => {
      const filePath = path.join(criteriaDir, entryName, "criterion.json");
      if (!fs.existsSync(filePath)) return null;
      return readJson<AcceptanceCriterion & { order?: number }>(filePath);
    })
    .filter((criterion): criterion is AcceptanceCriterion & { order?: number } => Boolean(criterion?.id));
  if (criteria.length === 0) return contract.criteria || [];

  const originalOrder = new Map((contract.criteria || []).map((criterion, index) => [criterion.id, index]));
  return criteria.sort((left, right) => {
    const leftOrder = typeof left.order === "number" ? left.order : originalOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = typeof right.order === "number" ? right.order : originalOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder || left.id.localeCompare(right.id);
  });
}

function readCriterionEvidence(goalDir: string, criterionId: string): EvidenceRecord[] | null {
  const evidenceDir = path.join(criterionDir(goalDir, criterionId), "evidence");
  if (!fs.existsSync(evidenceDir)) return null;
  const records = fs.readdirSync(evidenceDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => readJson<EvidenceRecord>(path.join(evidenceDir, fileName)));
  return records;
}

function hydrateLedgerFromDossiers(goalDir: string, contract: NoriContract, ledger: EvidenceLedger): EvidenceLedger {
  if (!ledger.criteria || typeof ledger.criteria !== "object") return ledger;
  for (const criterion of contract.criteria || []) {
    const state = ledger.criteria[criterion.id];
    if (!state) continue;
    const evidence = readCriterionEvidence(goalDir, criterion.id);
    if (evidence) {
      state.evidence = evidence;
      const latest = evidence.at(-1);
      state.status = latest?.result || "unknown";
      state.confidence = latest?.confidence || "none";
    }
  }
  return ledger;
}

export function readGoalPayload(pair: Pick<GoalStatePair, "goalDir" | "contractPath" | "ledgerPath">): NoriEvidencePayload {
  const contract = readJson<NoriContract>(pair.contractPath);
  const ledger = readJson<EvidenceLedger>(pair.ledgerPath);
  contract.criteria = readCriterionDossiers(pair.goalDir, contract);
  hydrateLedgerFromDossiers(pair.goalDir, contract, ledger);
  return { contract, ledger };
}
