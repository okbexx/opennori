import fs from "node:fs";
import { readJson } from "../core.ts";
import type {
  ArchitectureBaseline,
  ArchitectureState,
  ValidationIssue
} from "../types.ts";
import { architectureSurfaceState } from "./agent-surface.ts";
import { validateArchitectureBaseline } from "./baseline.ts";
import { buildVsBuyDecisionSummaries, buildVsBuyHealth } from "./build-vs-buy.ts";
import { architectureChallengeSummaries } from "./challenge.ts";
import { architectureBaselinePaths, errorMessage, relativeTo } from "./shared.ts";

export function architectureState(root: string, goalId: string | undefined = undefined): ArchitectureState {
  const paths = architectureBaselinePaths(root);
  const surface = architectureSurfaceState(root);
  const challenges = architectureChallengeSummaries(root);
  const openChallenges = challenges.filter((challenge) => challenge.status !== "resolved");
  const decisions = buildVsBuyDecisionSummaries(root);
  const buildVsBuy = buildVsBuyHealth(decisions);

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
    required_for_goal: Boolean(goalId),
    baseline: baseline ? {
      status: baseline.status,
      profile: baseline.profile,
      profile_title: baseline.profile_title,
      goal_id: baseline.goal_id,
      sticky: baseline.sticky,
      requires_challenge_to_change: baseline.requires_challenge_to_change,
      accepted_at: baseline.accepted_at
    } : null,
    issues,
    open_challenges: openChallenges,
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
