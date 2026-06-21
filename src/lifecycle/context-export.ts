import fs from "node:fs";
import { reviewAcceptanceQuality } from "../acceptance.ts";
import { agentNextForRecommendation } from "../agent-next.ts";
import {
  completionAnswer,
  criterionStatusRows,
  currentGap,
  evidenceHealth,
  interventionForProfile,
  nextRecommendation,
  pathsForGoal,
  profileCompliance,
  readProjectProfile,
  readGoalPayload
} from "../core.ts";
import { architectureState } from "../architecture.ts";
import { safeReadManifest } from "./manifest.ts";
import { manifestPath, relativeTo } from "./shared.ts";
import type { ContextExport } from "../types.ts";

export function buildContextExport(root: string, pair: { goalDir: string; contractPath: string; ledgerPath: string; acceptancePath: string; evidencePath: string }): ContextExport {
  const payload = readGoalPayload(pair);
  const contract = payload.contract;
  const ledger = payload.ledger;
  const reportPath = pathsForGoal(root, contract.goal_id).reportPath;
  const architecture = architectureState(root, contract.goal_id);
  const profile = readProjectProfile(root);
  const gap = currentGap(contract, ledger, profile);
  const recommendation = nextRecommendation(contract, ledger, { root, architecture, profile });
  return {
    schema_version: "opennori/context-export-v1",
    exported_at: new Date().toISOString(),
    root,
    goal_id: contract.goal_id,
    goal: contract.goal,
    presentation: contract.presentation,
    acceptance_basis: contract.acceptance_basis || { status: "draft" },
    workflow_status: ledger.status,
    current_gap: gap,
    completion: completionAnswer(contract, ledger, { root, architecture, profile }),
    intervention: interventionForProfile(contract, ledger, profile),
    acceptance_review: reviewAcceptanceQuality(contract),
    evidence_health: evidenceHealth(contract, ledger, { root }),
    next_recommendation: recommendation,
    agent_next: agentNextForRecommendation(contract.goal_id, gap, recommendation),
    criteria: criterionStatusRows(contract, ledger, { root }),
    capability_profile: profile,
    capability_compliance: profileCompliance(profile, ledger),
    architecture,
    paths: {
      acceptance: relativeTo(root, pair.acceptancePath),
      evidence: relativeTo(root, pair.evidencePath),
      report: relativeTo(root, reportPath),
      report_exists: fs.existsSync(reportPath),
      manifest: relativeTo(root, manifestPath(root))
    },
    manifest: safeReadManifest(root)
  };
}
