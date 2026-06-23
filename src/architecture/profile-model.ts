import { slugify } from "../core.ts";
import type { ArchitectureProfile, ArchitectureProfileDescriptor } from "../types/architecture.ts";
import type { JsonObject, ValidationIssue } from "../types/common.ts";
import { normalizeTechnicalBaseline, technicalBaselineIsComplete } from "./technical-baseline.ts";

export function architectureProfileDescriptor(
  profile: ArchitectureProfile,
  { origin, path: profilePath = undefined }: { origin?: string; path?: string } = {}
): ArchitectureProfileDescriptor {
  const issues = validateArchitectureProfile(profile);
  return {
    id: profile.id,
    title: profile.title,
    origin,
    path: profilePath,
    valid: issues.length === 0,
    validation_issues: issues,
    summary: profile.summary,
    applies_to: profile.applies_to || [],
    sources: profile.sources || [],
    principles: profile.principles || [],
    checks: profile.checks || [],
    technical_baseline: normalizeTechnicalBaseline(profile.technical_baseline),
    preferred_libraries: profile.preferred_libraries || [],
    avoid: profile.avoid || [],
    build_vs_buy_policy: profile.build_vs_buy_policy || null,
    review: {
      can_generate_baseline: issues.length === 0,
      source_count: (profile.sources || []).length,
      check_count: (profile.checks || []).length,
      avoid_count: (profile.avoid || []).length,
      next: issues.length === 0
        ? "Preview a baseline from this profile, show it to the user, and confirm only after acceptance."
        : "Fix validation issues before using this profile for a baseline."
    }
  };
}

export function validateArchitectureProfile(profile: ArchitectureProfile | JsonObject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!profile || typeof profile !== "object") {
    return [{ path: "$", message: "Architecture Profile is not an object." }];
  }
  if (!profile.id) issues.push({ path: "id", message: "Architecture Profile must include an id." });
  if (!profile.title) issues.push({ path: "title", message: "Architecture Profile must include a title." });
  if (!profile.summary) issues.push({ path: "summary", message: "Architecture Profile must include a summary." });
  if (!Array.isArray(profile.principles) || profile.principles.length === 0) {
    issues.push({ path: "principles", message: "Architecture Profile must include architecture principles." });
  }
  if (!Array.isArray(profile.checks) || profile.checks.length === 0) {
    issues.push({ path: "checks", message: "Architecture Profile must include architecture checks." });
  }
  if (!profile.build_vs_buy_policy) {
    issues.push({ path: "build_vs_buy_policy", message: "Architecture Profile must include build-vs-buy policy." });
  }
  if (!technicalBaselineIsComplete(profile.technical_baseline, { requireVerification: true })) {
    issues.push({
      path: "technical_baseline",
      message: "Architecture Profile must include concrete technical_baseline runtime, state, module, contract, flow, dependency, reference mapping, and verification sections."
    });
  }
  return issues;
}

export function normalizeArchitectureProfile(input: Partial<ArchitectureProfile>, idOverride: string | undefined = undefined): ArchitectureProfile {
  const id = idOverride || input.id || slugify(input.title || input.summary || "architecture-profile");
  return {
    ...input,
    id,
    title: input.title || id,
    summary: input.summary || "",
    applies_to: Array.isArray(input.applies_to) ? input.applies_to : [],
    sources: Array.isArray(input.sources) ? input.sources : [],
    principles: Array.isArray(input.principles) ? input.principles : [],
    checks: Array.isArray(input.checks) ? input.checks : [],
    technical_baseline: normalizeTechnicalBaseline(input.technical_baseline),
    preferred_libraries: Array.isArray(input.preferred_libraries) ? input.preferred_libraries : [],
    avoid: Array.isArray(input.avoid) ? input.avoid : [],
    build_vs_buy_policy: input.build_vs_buy_policy || {
      order: ["current-project-dependency", "standard-library", "official-sdk", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    },
    updated_at: new Date().toISOString()
  };
}
