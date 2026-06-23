import fs from "node:fs";
import { pathsForGoal } from "../core.ts";
import type { ContextExportPaths, ContextExportPair } from "../types/lifecycle.ts";
import { manifestPath, relativeTo } from "./shared.ts";

export function contextExportPaths(root: string, goalId: string, pair: ContextExportPair): ContextExportPaths {
  const reportPath = pathsForGoal(root, goalId).reportPath;
  return {
    acceptance: relativeTo(root, pair.acceptancePath),
    evidence: relativeTo(root, pair.evidencePath),
    report: relativeTo(root, reportPath),
    report_exists: fs.existsSync(reportPath),
    manifest: relativeTo(root, manifestPath(root))
  };
}
