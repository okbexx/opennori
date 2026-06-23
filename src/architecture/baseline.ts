import fs from "node:fs";
import path from "node:path";
import { readJson, slugify, writeJson } from "../core.ts";
import type { ArchitectureBaseline, PreferredLibraryPolicy, TechnicalArchitectureBaseline, TechnicalArchitectureFlow, TechnicalArchitectureItem } from "../types/architecture.ts";
import type { JsonObject, ValidationIssue } from "../types/common.ts";
import { validateSchema } from "../validation.ts";
import { resolveArchitectureProfile } from "./profile.ts";
import { ARCHITECTURE_BASELINE_SCHEMA_VERSION, architectureBaselinePaths } from "./shared.ts";
import { normalizeTechnicalBaseline, technicalBaselineIsComplete } from "./technical-baseline.ts";

export function buildArchitectureBaseline(root: string, {
  profileId = "typescript-agent-state-cli",
  goal = "",
  goalId = undefined,
  summary = undefined,
  accepted = false
}: { profileId?: string; goal?: string; goalId?: string; summary?: string; accepted?: boolean } = {}): ArchitectureBaseline {
  const profile = resolveArchitectureProfile(root, profileId);
  const now = new Date().toISOString();
  return {
    schema_version: ARCHITECTURE_BASELINE_SCHEMA_VERSION,
    status: accepted ? "active" : "draft",
    profile: profile.id,
    profile_title: profile.title,
    profile_origin: profile.origin,
    goal_id: goalId || slugify(goal || profile.id),
    goal,
    summary: summary || profile.summary,
    created_at: now,
    updated_at: now,
    accepted_at: accepted ? now : null,
    sticky: true,
    requires_challenge_to_change: true,
    applies_to: profile.applies_to || [],
    sources: profile.sources || [],
    principles: profile.principles || [],
    checks: profile.checks || [],
    technical_baseline: normalizeTechnicalBaseline(profile.technical_baseline),
    preferred_libraries: profile.preferred_libraries || [],
    avoid: profile.avoid || [],
    build_vs_buy_policy: profile.build_vs_buy_policy || {
      order: ["current-project-dependency", "standard-library", "official-sdk", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    },
    challenge_policy: {
      agent_may_challenge: true,
      agent_must_not_silently_replace: true,
      requires_user_confirmation: true
    },
    agent_surfaces: [
      ".opennori/architecture/baseline.json",
      ".opennori/architecture/baseline.md",
      ".opennori/agent-guide.md",
      "AGENTS.md",
      "CLAUDE.md",
      ".agents/plugins/marketplace.json",
      "plugins/opennori/.codex-plugin/plugin.json",
      "plugins/opennori/skills/nori-architecture-apply/SKILL.md"
    ]
  };
}

export function validateArchitectureBaseline(baseline: ArchitectureBaseline | JsonObject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!baseline || typeof baseline !== "object") {
    return [{ path: "$", message: "Architecture Baseline is not an object." }];
  }
  const schemaResult = validateSchema("architecture-baseline", baseline);
  for (const error of schemaResult.errors) {
    issues.push({ path: `schema${error.path}`, message: error.message });
  }
  if (baseline.schema_version !== ARCHITECTURE_BASELINE_SCHEMA_VERSION) {
    issues.push({ path: "schema_version", message: `Expected ${ARCHITECTURE_BASELINE_SCHEMA_VERSION}.` });
  }
  if (!["draft", "active"].includes(baseline.status)) {
    issues.push({ path: "status", message: "Architecture Baseline status must be draft or active." });
  }
  if (!baseline.profile) issues.push({ path: "profile", message: "Architecture Baseline must name a profile." });
  if (!baseline.goal_id) issues.push({ path: "goal_id", message: "Architecture Baseline must include a goal_id." });
  if (!Array.isArray(baseline.principles) || baseline.principles.length === 0) {
    issues.push({ path: "principles", message: "Architecture Baseline must include architecture principles." });
  }
  if (!Array.isArray(baseline.checks) || baseline.checks.length === 0) {
    issues.push({ path: "checks", message: "Architecture Baseline must include architecture checks." });
  }
  if (!technicalBaselineIsComplete(baseline.technical_baseline as Partial<TechnicalArchitectureBaseline> | undefined)) {
    issues.push({
      path: "technical_baseline",
      message: "Architecture Baseline must include concrete technical_baseline runtime, state, module, contract, flow, dependency, and reference mapping sections."
    });
  }
  if (!baseline.build_vs_buy_policy) {
    issues.push({ path: "build_vs_buy_policy", message: "Architecture Baseline must include build-vs-buy policy." });
  }
  return issues;
}

export function readArchitectureBaseline(root: string): ArchitectureBaseline | null {
  const paths = architectureBaselinePaths(root);
  if (!fs.existsSync(paths.jsonPath)) return null;
  return readJson<ArchitectureBaseline>(paths.jsonPath);
}

function renderArchitectureBaselineMarkdown(baseline: ArchitectureBaseline): string {
  const technicalBaseline = normalizeTechnicalBaseline(baseline.technical_baseline);
  const lines = [
    "# OpenNori Architecture Baseline",
    "",
    `Status: ${baseline.status}`,
    `Profile: ${baseline.profile}`,
    `Sticky: ${baseline.sticky ? "yes" : "no"}`,
    `Requires challenge to change: ${baseline.requires_challenge_to_change ? "yes" : "no"}`,
    "",
    "## Goal",
    "",
    baseline.goal || "<none>",
    "",
    "## Summary",
    "",
    baseline.summary || "<none>",
    "",
    "## Principles",
    "",
    ...baseline.principles.map((principle: string) => `- ${principle}`),
    "",
    "## Technical Architecture Baseline",
    "",
    "This section is the concrete implementation baseline. It is not Product AC and not an implementation task list.",
    "",
    "### Runtime Topology",
    "",
    ...renderTechnicalItems(technicalBaseline.runtime_topology),
    "",
    "### Source Of Truth",
    "",
    ...renderTechnicalItems(technicalBaseline.source_of_truth),
    "",
    "### Module Boundaries",
    "",
    ...renderTechnicalItems(technicalBaseline.module_boundaries),
    "",
    "### Contract Surfaces",
    "",
    ...renderTechnicalItems(technicalBaseline.contract_surfaces),
    "",
    "### Data Flows",
    "",
    ...renderTechnicalFlows(technicalBaseline.data_flows),
    "",
    "### Dependency Decisions",
    "",
    ...renderTechnicalItems(technicalBaseline.dependency_decisions),
    "",
    "### Reference Mappings",
    "",
    ...renderTechnicalItems(technicalBaseline.reference_mappings),
    "",
    "### Verification",
    "",
    ...renderVerification(technicalBaseline.verification),
    "",
    "## Architecture Checks",
    ""
  ];
  for (const check of baseline.checks || []) {
    lines.push(`- ${check.id || "ARCH"} (${check.audience || "reviewer"}): ${check.statement}`);
  }
  lines.push(
    "",
    "## Build-vs-Buy Policy",
    "",
    ...((baseline.build_vs_buy_policy?.order || []).map((item: string, index: number) => `${index + 1}. ${item}`)),
    "",
    "## Prefer",
    "",
    ...((baseline.preferred_libraries || []).map((entry: PreferredLibraryPolicy) => `- ${entry.area}: ${entry.policy}`)),
    "",
    "## Avoid",
    "",
    ...((baseline.avoid || []).map((item: string) => `- ${item}`)),
    "",
    "## Agent Rule",
    "",
    "Before implementing a non-trivial acceptance gap, read this baseline and keep the implementation aligned with it.",
    "If project evidence conflicts with this baseline, create an Architecture Challenge instead of silently replacing it.",
    ""
  );
  return `${lines.join("\n").trimEnd()}\n`;
}

function renderTechnicalItems(items: TechnicalArchitectureItem[]): string[] {
  if (items.length === 0) return ["- <none>"];
  return items.map((item) => {
    const reason = item.reason ? ` Reason: ${item.reason}` : "";
    return `- ${item.name}: ${item.decision}${reason}`;
  });
}

function renderTechnicalFlows(flows: TechnicalArchitectureFlow[]): string[] {
  if (flows.length === 0) return ["- <none>"];
  const lines: string[] = [];
  for (const flow of flows) {
    lines.push(`- ${flow.name}:`);
    for (const [index, step] of flow.steps.entries()) {
      lines.push(`  ${index + 1}. ${step}`);
    }
  }
  return lines;
}

function renderVerification(items: string[]): string[] {
  if (items.length === 0) return ["- <none>"];
  return items.map((item) => `- ${item}`);
}

export function writeArchitectureBaseline(root: string, baseline: ArchitectureBaseline) {
  const paths = architectureBaselinePaths(root);
  writeJson(paths.jsonPath, baseline);
  fs.mkdirSync(path.dirname(paths.markdownPath), { recursive: true });
  fs.writeFileSync(paths.markdownPath, renderArchitectureBaselineMarkdown(baseline));
  return paths;
}
