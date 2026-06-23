import path from "node:path";
import type { PathPair } from "../types/paths.ts";

export const ARCHITECTURE_BASELINE_SCHEMA_VERSION = "opennori/architecture-baseline-v1";
export const ARCHITECTURE_CHALLENGE_SCHEMA_VERSION = "opennori/architecture-challenge-v1";
export const ARCHITECTURE_APPLY_SCHEMA_VERSION = "opennori/architecture-apply-v1";
export const ARCHITECTURE_REQUIREMENT_SCHEMA_VERSION = "opennori/architecture-requirement-v1";
export const BUILD_VS_BUY_SCHEMA_VERSION = "opennori/build-vs-buy-v1";
export const REQUIRED_ARCHITECTURE_DIRS = ["profiles", "challenges", "decisions", "evidence", "requirements"];
export const AGENT_ROUTE_START = "<!-- opennori:agent-route:start -->";
export const AGENT_ROUTE_END = "<!-- opennori:agent-route:end -->";

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function relativeTo(root: string, filePath: string): string {
  return path.relative(root, filePath) || ".";
}

export function architectureDir(root: string): string {
  return path.join(root, ".opennori", "architecture");
}

export function architectureBaselinePaths(root: string): PathPair {
  return {
    jsonPath: path.join(architectureDir(root), "baseline.json"),
    markdownPath: path.join(architectureDir(root), "baseline.md")
  };
}

export function architectureProfilePath(root: string, profileId: string): string {
  return path.join(architectureDir(root), "profiles", `${profileId}.json`);
}

export function architectureChallengePath(root: string, challengeId: string): PathPair {
  return {
    jsonPath: path.join(architectureDir(root), "challenges", `${challengeId}.json`),
    markdownPath: path.join(architectureDir(root), "challenges", `${challengeId}.md`)
  };
}

export function buildVsBuyPath(root: string, decisionId: string): PathPair {
  return {
    jsonPath: path.join(architectureDir(root), "decisions", `${decisionId}.json`),
    markdownPath: path.join(architectureDir(root), "decisions", `${decisionId}.md`)
  };
}

export function architectureApplyPath(root: string, applyId: string): PathPair {
  return {
    jsonPath: path.join(architectureDir(root), "evidence", `${applyId}.json`),
    markdownPath: path.join(architectureDir(root), "evidence", `${applyId}.md`)
  };
}

export function architectureRequirementPath(root: string, goalId: string): string {
  return path.join(architectureDir(root), "requirements", `${goalId}.json`);
}

export function agentGuidePath(root: string): string {
  return path.join(root, ".opennori", "agent-guide.md");
}
