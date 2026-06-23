import { safeReadManifest } from "./manifest.ts";
import { contextExportPaths } from "./context-export-paths.ts";
import type { ContextExport } from "../types/context-export.ts";
import type { ContextExportState } from "./context-export-state.ts";

export function buildContextExportPayload(state: ContextExportState): ContextExport {
  const { contract, ledger } = state;
  return {
    schema_version: "opennori/context-export-v1",
    exported_at: new Date().toISOString(),
    root: state.root,
    goal_id: contract.goal_id,
    goal: contract.goal,
    presentation: contract.presentation,
    acceptance_basis: contract.acceptance_basis || { status: "draft" },
    workflow_status: ledger.status,
    current_gap: state.current_gap,
    completion: state.completion,
    intervention: state.intervention,
    acceptance_review: state.acceptance_review,
    evidence_health: state.evidence_health,
    next_recommendation: state.next_recommendation,
    agent_next: state.agent_next,
    criteria: state.criteria,
    capability_profile: state.profile,
    capability_compliance: state.capability_compliance,
    architecture: state.architecture,
    paths: contextExportPaths(state.root, contract.goal_id, state.pair),
    manifest: safeReadManifest(state.root)
  };
}
