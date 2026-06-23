import fs from "node:fs";
import path from "node:path";
import type {
  AcceptanceCriterion,
  EvidenceLedger,
  EvidenceRecord,
  NoriContract,
  NoriEvidencePayload
} from "../types.ts";
import type { GoalStatePair } from "./goal-state.ts";
import { readJson, writeJson } from "./io.ts";
import { renderCriterionReadme, renderGoalReadme } from "./dossier-render.ts";

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
  return fs.readdirSync(evidenceDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => readJson<EvidenceRecord>(path.join(evidenceDir, fileName)));
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
