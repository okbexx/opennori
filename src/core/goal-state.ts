import fs from "node:fs";
import path from "node:path";

export type GoalStateLocation = "current" | "drafts" | "completed" | "blocked" | "active";

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

export function goalStateDir(rootDir: string, location: GoalStateLocation): string {
  return path.join(rootDir, ".opennori", location);
}

export function pathsForGoal(
  rootDir: string,
  goalId: string,
  location: GoalStateLocation = "current"
): Omit<GoalStatePair, "goalId"> {
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
