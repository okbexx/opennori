import fs from "node:fs";
import { readJson } from "../core.ts";
import type {
  ArchitectureBaseline,
  ArchitectureState,
  ValidationIssue
} from "../types.ts";
import { architectureSurfaceState } from "./agent-surface.ts";
import { architectureApplySummaries } from "./apply.ts";
import { validateArchitectureBaseline } from "./baseline.ts";
import { buildVsBuyDecisionSummaries, buildVsBuyHealth } from "./build-vs-buy.ts";
import { architectureChallengeSummaries } from "./challenge.ts";
import { readArchitectureRequirement } from "./requirement.ts";
import { architectureBaselinePaths, errorMessage, relativeTo } from "./shared.ts";

export function architectureState(root: string, goalId: string | undefined = undefined): ArchitectureState {
  const paths = architectureBaselinePaths(root);
  const surface = architectureSurfaceState(root);
  const requirement = readArchitectureRequirement(root, goalId);
  const challenges = architectureChallengeSummaries(root);
  const openChallenges = challenges.filter((challenge) => challenge.status !== "resolved");
  const decisions = buildVsBuyDecisionSummaries(root);
  const buildVsBuy = buildVsBuyHealth(decisions);
  const applyRecords = architectureApplySummaries(root)
    .filter((record) => !goalId || record.goal_id === goalId);

  let baseline: ArchitectureBaseline | null = null;
  let issues: ValidationIssue[] = [];
  if (fs.existsSync(paths.jsonPath)) {
    try {
      baseline = readJson<ArchitectureBaseline>(paths.jsonPath);
      issues = validateArchitectureBaseline(baseline);
    } catch (error) {
      issues = [{ path: "baseline", message: errorMessage(error) }];
    }
  }

  let decision: ArchitectureState["decision"] = "missing";
  if (baseline && issues.length > 0) decision = "invalid";
  if (baseline && issues.length === 0 && baseline.status === "draft") decision = "draft";
  if (baseline && issues.length === 0 && baseline.status === "active") decision = "valid";
  if (baseline && issues.length === 0 && openChallenges.length > 0) decision = "challenged";

  return {
    schema_version: "opennori/architecture-state-v1",
    decision,
    required_for_goal: requirement.status === "required",
    requirement,
    baseline: baseline ? {
      status: baseline.status,
      profile: baseline.profile,
      profile_title: baseline.profile_title,
      goal_id: baseline.goal_id,
      technical_baseline_summary: {
        runtime_topology_count: baseline.technical_baseline?.runtime_topology?.length || 0,
        module_boundary_count: baseline.technical_baseline?.module_boundaries?.length || 0,
        contract_surface_count: baseline.technical_baseline?.contract_surfaces?.length || 0,
        data_flow_count: baseline.technical_baseline?.data_flows?.length || 0,
        dependency_decision_count: baseline.technical_baseline?.dependency_decisions?.length || 0,
        reference_mapping_count: baseline.technical_baseline?.reference_mappings?.length || 0
      },
      sticky: baseline.sticky,
      requires_challenge_to_change: baseline.requires_challenge_to_change,
      accepted_at: baseline.accepted_at
    } : null,
    issues,
    open_challenges: openChallenges,
    apply_records: applyRecords,
    build_vs_buy_decisions: decisions,
    build_vs_buy: buildVsBuy,
    agent_surface: surface,
    paths: {
      baseline_json: relativeTo(root, paths.jsonPath),
      baseline_markdown: relativeTo(root, paths.markdownPath),
      agent_guide: ".opennori/agent-guide.md"
    }
  };
}
