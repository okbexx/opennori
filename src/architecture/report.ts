import { renderReport } from "../core.ts";
import { readProjectProfile } from "../core/profile.ts";
import type { EvidenceLedger, NoriContract } from "../types.ts";
import { architectureState } from "./state.ts";

function renderArchitectureReportSection(root: string, goalId: string | undefined = undefined): string {
  const state = architectureState(root, goalId);
  const lines = [
    "## Architecture Baseline",
    "",
    `Architecture decision: ${state.decision}`,
    `Requirement: ${state.requirement.status}${state.requirement.reason ? ` - ${state.requirement.reason}` : ""}`,
    `Baseline: ${state.baseline ? `${state.baseline.profile} (${state.baseline.status})` : "<missing>"}`,
    `Technical baseline: ${state.baseline?.technical_baseline_summary
      ? `${state.baseline.technical_baseline_summary.runtime_topology_count} runtime, ${state.baseline.technical_baseline_summary.module_boundary_count} module, ${state.baseline.technical_baseline_summary.contract_surface_count} contract, ${state.baseline.technical_baseline_summary.data_flow_count} flow, ${state.baseline.technical_baseline_summary.dependency_decision_count} dependency, ${state.baseline.technical_baseline_summary.reference_mapping_count} reference items`
      : "<missing>"}`,
    `Challenge: ${state.open_challenges.length > 0 ? `${state.open_challenges.length} open` : "none"}`,
    `Architecture apply records: ${state.apply_records?.length || 0}`,
    `Architecture evidence health: ${state.evidence_health.status}`,
    `Build-vs-buy: ${state.build_vs_buy.status} (${state.build_vs_buy_decisions.length} decisions)`,
    `Agent guide: ${state.agent_surface.guide.installed ? "installed" : "missing"}`,
    "",
    "Paths:",
    `- ${state.paths.baseline_markdown}`,
    `- ${state.paths.agent_guide}`,
    ""
  ];
  if (state.open_challenges.length > 0) {
    lines.push("Open challenges:");
    for (const challenge of state.open_challenges) {
      lines.push(`- ${challenge.id}: ${challenge.summary || "<none>"}`);
    }
    lines.push("");
  }
  if ((state.apply_records || []).length > 0) {
    lines.push("Architecture apply records:");
    for (const record of state.apply_records || []) {
      lines.push(`- ${record.criterion_id}: ${record.status} (${record.baseline_profile}) - ${record.summary || record.path}`);
    }
    lines.push("");
  }
  if (state.evidence_health.findings.length > 0) {
    lines.push("Architecture evidence findings:");
    for (const finding of state.evidence_health.findings) {
      lines.push(`- ${finding.path}: ${finding.message}`);
    }
    lines.push("");
  }
  if (state.build_vs_buy.findings.length > 0) {
    lines.push("Build-vs-buy findings:");
    for (const finding of state.build_vs_buy.findings) {
      lines.push(`- ${finding.decision_id}: ${finding.message}`);
    }
    lines.push("");
  }
  if (state.issues.length > 0) {
    lines.push("Issues:");
    for (const issue of state.issues) {
      lines.push(`- ${issue.path}: ${issue.message}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function renderReportWithArchitecture(root: string, contract: NoriContract, ledger: EvidenceLedger): string {
  const architecture = architectureState(root, contract.goal_id);
  const profile = readProjectProfile(root);
  const base = renderReport(contract, ledger, { root, architecture, profile }).trimEnd();
  return `${base}\n\n${renderArchitectureReportSection(root, contract.goal_id).trimEnd()}\n`;
}
