import fs from "node:fs";
import path from "node:path";
import type { JsonObject, NoriArtifact, NoriResult, NoriWarning } from "../types.ts";

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
): { acceptancePath: string; evidencePath: string; reportPath: string; location: GoalStateLocation } {
  const stateDir = goalStateDir(rootDir, location);
  return {
    acceptancePath: path.join(stateDir, `${goalId}.acceptance.md`),
    evidencePath: path.join(stateDir, `${goalId}.evidence.json`),
    reportPath: path.join(rootDir, ".opennori", "reports", `${goalId}.report.md`),
    location
  };
}

export type GoalStatePair = {
  goalId: string;
  acceptancePath: string;
  evidencePath: string;
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
    .filter((fileName) => fileName.endsWith(".evidence.json"))
    .map((fileName) => {
      const goalId = fileName.replace(/\.evidence\.json$/, "");
      return {
        goalId,
        acceptancePath: path.join(stateDir, `${goalId}.acceptance.md`),
        evidencePath: path.join(stateDir, fileName),
        reportPath: path.join(rootDir, ".opennori", "reports", `${goalId}.report.md`),
        location
      };
    })
    .filter((pair) => fs.existsSync(pair.acceptancePath))
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
