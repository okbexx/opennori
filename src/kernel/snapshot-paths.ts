import path from "node:path";
import { findCurrentPairs } from "../core/shared.ts";
import type { GoalStatePair } from "../core/goal-state.ts";

export type SnapshotGoalPair = GoalStatePair;

function snapshotsDir(root: string): string {
  return path.join(root, ".opennori", "snapshots");
}

export function snapshotPath(root: string): string {
  return path.join(snapshotsDir(root), "current.json");
}

export function projectRelative(root: string, filePath: string): string {
  const relative = path.relative(root, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return filePath;
  return relative;
}

export function chooseActivePair(root: string, goalId?: string, activityGoalId?: string): SnapshotGoalPair | null {
  const pairs = findCurrentPairs(root);
  if (goalId) return pairs.find((pair) => pair.goalId === goalId) || null;
  if (activityGoalId) {
    const activityPair = pairs.find((pair) => pair.goalId === activityGoalId);
    if (activityPair) return activityPair;
  }
  if (pairs.length === 1) return pairs[0] || null;
  return null;
}

export function goalDossier(root: string, pair: SnapshotGoalPair) {
  return {
    location: pair.location,
    path: projectRelative(root, pair.goalDir),
    readme_path: projectRelative(root, pair.acceptancePath),
    contract_path: projectRelative(root, pair.contractPath),
    ledger_path: projectRelative(root, pair.ledgerPath),
    criteria_path: projectRelative(root, pair.criteriaDir),
    report_path: projectRelative(root, pair.reportPath)
  };
}

export function criterionDossier(root: string, pair: SnapshotGoalPair, criterionId: string) {
  const dir = path.join(pair.criteriaDir, criterionId);
  return {
    path: projectRelative(root, dir),
    readme_path: projectRelative(root, path.join(dir, "README.md")),
    criterion_path: projectRelative(root, path.join(dir, "criterion.json")),
    status_path: projectRelative(root, path.join(dir, "status.json")),
    evidence_path: projectRelative(root, path.join(dir, "evidence")),
    artifacts_path: projectRelative(root, path.join(dir, "artifacts"))
  };
}
