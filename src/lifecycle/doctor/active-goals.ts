import fs from "node:fs";
import path from "node:path";
import {
  currentGap,
  findCurrentPairs,
  findDraftPairs,
  findLegacyActivePairs,
  readGoalPayload,
  validateContract
} from "../../core.ts";
import { validateSchema } from "../../validation.ts";
import { relativeTo } from "../shared.ts";
import type {
  ActiveGoalSummary,
  DoctorIssue
} from "../../types.ts";
import { errorMessage } from "./shared.ts";

export type ActiveGoalInspection = {
  details: ActiveGoalSummary[];
  drafts: ActiveGoalSummary[];
  legacy: ActiveGoalSummary[];
  issues: DoctorIssue[];
};

function inspectPairs(root: string, pairs: ReturnType<typeof findCurrentPairs>): { details: ActiveGoalSummary[]; issues: DoctorIssue[] } {
  const details: ActiveGoalSummary[] = [];
  const issues: DoctorIssue[] = [];
  for (const pair of pairs) {
    const { goalId, acceptancePath, evidencePath } = pair;
    try {
      const payload = readGoalPayload(pair);
      const schemaResult = validateSchema("evidence-payload", payload);
      const validationIssues = schemaResult.valid
        ? validateContract(payload.contract, payload.ledger)
        : [];
      const recoverable = schemaResult.valid && validationIssues.length === 0;
      details.push({
        goal_id: goalId,
        location: pair.location,
        status: payload.ledger?.status || "unknown",
        current_gap: recoverable ? currentGap(payload.contract, payload.ledger) : null,
        acceptance_path: relativeTo(root, acceptancePath),
        evidence_path: relativeTo(root, evidencePath),
        recoverable,
        schema_valid: schemaResult.valid
      });
      for (const error of schemaResult.errors) {
        issues.push({ goal_id: goalId, message: error.message, path: `schema${error.path}` });
      }
      for (const issue of validationIssues) {
        issues.push({ goal_id: goalId, message: issue.message, path: issue.path });
      }
    } catch (error) {
      issues.push({ goal_id: goalId, message: errorMessage(error) });
    }
  }
  return { details, issues };
}

function inspectDirectoryCompleteness(root: string, location: "current" | "drafts" | "active"): DoctorIssue[] {
  const stateDir = path.join(root, ".opennori", location);
  const issues: DoctorIssue[] = [];
  if (!fs.existsSync(stateDir)) return issues;

  for (const entryName of fs.readdirSync(stateDir)) {
    const entryPath = path.join(stateDir, entryName);
    if (!fs.statSync(entryPath).isDirectory()) {
      issues.push({
        goal_id: entryName,
        path: `.opennori/${location}/${entryName}`,
        message: `${location} contains a non-directory goal state entry.`
      });
      continue;
    }
    for (const required of ["contract.json", "ledger.json", "README.md", "criteria"]) {
      if (!fs.existsSync(path.join(entryPath, required))) {
        issues.push({
          goal_id: entryName,
          path: `.opennori/${location}/${entryName}/${required}`,
          message: `${location} goal dossier is missing ${required}.`
        });
      }
    }
    const criteriaDir = path.join(entryPath, "criteria");
    if (!fs.existsSync(criteriaDir)) continue;
    for (const criterionId of fs.readdirSync(criteriaDir)) {
      const criterionPath = path.join(criteriaDir, criterionId);
      if (!fs.statSync(criterionPath).isDirectory()) continue;
      for (const required of ["criterion.json", "status.json", "README.md", "evidence", "artifacts"]) {
        if (!fs.existsSync(path.join(criterionPath, required))) {
          issues.push({
            goal_id: entryName,
            path: `.opennori/${location}/${entryName}/criteria/${criterionId}/${required}`,
            message: `${location} criterion dossier is missing ${required}.`
          });
        }
      }
    }
  }

  for (const fileName of fs.readdirSync(stateDir).filter((name) => name.endsWith(".acceptance.md") || name.endsWith(".evidence.json"))) {
    const goalId = fileName.replace(/\.(acceptance\.md|evidence\.json)$/, "");
    issues.push({
      goal_id: goalId,
      path: `.opennori/${location}/${fileName}`,
      message: `${location} still contains legacy flat goal state. OpenNori now expects .opennori/${location}/${goalId}/ goal dossiers.`
    });
  }
  return issues;
}

export function inspectActiveGoals(root: string): ActiveGoalInspection {
  const current = inspectPairs(root, findCurrentPairs(root));
  const drafts = inspectPairs(root, findDraftPairs(root));
  const legacy = inspectPairs(root, findLegacyActivePairs(root));
  const issues = [
    ...current.issues,
    ...inspectDirectoryCompleteness(root, "current"),
    ...inspectDirectoryCompleteness(root, "drafts"),
    ...inspectDirectoryCompleteness(root, "active")
  ];

  if (current.details.filter((goal) => goal.recoverable).length > 1) {
    issues.push({
      goal_id: "current",
      path: ".opennori/current",
      message: "OpenNori current state has more than one recoverable goal; only one current Nori Contract is allowed."
    });
  }

  if (legacy.details.length > 0) {
    issues.push({
      goal_id: "legacy-active",
      path: ".opennori/active",
      message: "Legacy .opennori/active goals exist. They are ignored by default current-goal commands and should be moved to current, drafts, completed, or blocked."
    });
  }

  return {
    details: current.details,
    drafts: drafts.details,
    legacy: legacy.details,
    issues
  };
}
