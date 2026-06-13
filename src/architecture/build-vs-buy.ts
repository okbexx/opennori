import fs from "node:fs";
import path from "node:path";
import { readJson } from "../core.ts";
import type {
  BuildVsBuyDecision,
  BuildVsBuyDecisionSummary,
  BuildVsBuyFinding,
  BuildVsBuyHealth
} from "../types.ts";
import { schemaErrorSummary, validateSchema } from "../validation.ts";
import { architectureDir, errorMessage, relativeTo } from "./shared.ts";

export function buildVsBuyDecisionSummaries(root: string): BuildVsBuyDecisionSummary[] {
  const dir = path.join(architectureDir(root), "decisions");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      try {
        const decision = readJson<BuildVsBuyDecision>(path.join(dir, fileName));
        const schemaResult = validateSchema("build-vs-buy", decision);
        return {
          id: decision.id || fileName.replace(/\.json$/, ""),
          schema_valid: schemaResult.valid,
          schema_errors: schemaResult.errors,
          area: decision.area,
          need: decision.need,
          recommendation: decision.recommendation,
          status: decision.status || "active",
          summary: decision.summary,
          current_project: decision.current_project,
          standard_library: decision.standard_library,
          official_sdk: decision.official_sdk,
          open_source: decision.open_source,
          self_build_reason: decision.self_build_reason,
          superseded_by: decision.superseded_by,
          superseded_reason: decision.superseded_reason,
          path: relativeTo(root, path.join(dir, fileName))
        };
      } catch (error) {
        return {
          id: fileName.replace(/\.json$/, ""),
          error: errorMessage(error),
          path: relativeTo(root, path.join(dir, fileName))
        };
      }
    });
}

export function buildVsBuyHealth(decisions: BuildVsBuyDecisionSummary[]): BuildVsBuyHealth {
  const findings: BuildVsBuyFinding[] = [];
  const activeDecisions = decisions.filter((decision) => decision.status !== "superseded");
  for (const decision of activeDecisions) {
    if (decision.error) {
      findings.push({
        decision_id: decision.id,
        severity: "broken",
        issue: "unreadable-decision",
        message: `Build-vs-buy decision ${decision.id} is unreadable: ${decision.error}`,
        recovery: `Inspect ${decision.path} and restore valid JSON.`
      });
      continue;
    }

    if (decision.schema_valid === false) {
      findings.push({
        decision_id: decision.id,
        severity: "broken",
        issue: "schema-invalid-decision",
        message: `Build-vs-buy decision ${decision.id} does not match the public schema: ${schemaErrorSummary({ valid: false, errors: decision.schema_errors || [] })}`,
        recovery: `Inspect ${decision.path} and restore a valid opennori/build-vs-buy-v1 decision.`
      });
      continue;
    }

    for (const field of ["current_project", "standard_library", "official_sdk", "open_source"]) {
      if (!decision[field]) {
        findings.push({
          decision_id: decision.id,
          severity: "needs-action",
          issue: `missing-${field.replaceAll("_", "-")}`,
          message: `${decision.id} does not show that ${field.replaceAll("_", " ")} was checked.`,
          recovery: `Update ${decision.path} with a concrete ${field.replaceAll("_", " ")} candidate or an explicit not-applicable reason.`
        });
      }
    }

    if (decision.recommendation === "self-build" && !decision.self_build_reason) {
      findings.push({
        decision_id: decision.id,
        severity: "needs-action",
        issue: "missing-self-build-reason",
        message: `${decision.id} recommends self-build without a reviewable reason.`,
        recovery: `Update ${decision.path} with the license, maintenance, security, package size, performance, or product-boundary reason for self-build.`
      });
    }
  }

  return {
    status: findings.some((finding) => finding.severity === "broken")
      ? "broken"
      : findings.length > 0
        ? "needs-action"
        : "clear",
    summary: findings.length === 0
      ? "Every recorded build-vs-buy decision includes reviewable reuse candidates and any self-build reason."
      : `${findings.length} build-vs-buy issue(s) need review before claiming mature reuse discipline.`,
    decision_count: activeDecisions.length,
    total_decision_count: decisions.length,
    superseded_decision_count: decisions.length - activeDecisions.length,
    findings
  };
}

export function renderBuildVsBuyMarkdown(decision: BuildVsBuyDecision): string {
  return [
    `# ${decision.id} Build-vs-Buy Decision`,
    "",
    `Area: ${decision.area}`,
    `Need: ${decision.need}`,
    `Recommendation: ${decision.recommendation}`,
    `Status: ${decision.status || "active"}`,
    decision.superseded_by ? `Superseded by: ${decision.superseded_by}` : "",
    decision.superseded_reason ? `Superseded reason: ${decision.superseded_reason}` : "",
    "",
    "## Summary",
    "",
    decision.summary || "<none>",
    "",
    "## Candidates Checked",
    "",
    `- Current project: ${decision.current_project || "<not checked>"}`,
    `- Standard library: ${decision.standard_library || "<not checked>"}`,
    `- Official SDK: ${decision.official_sdk || "<not checked>"}`,
    `- Open source: ${decision.open_source || "<not checked>"}`,
    "",
    "## Self-build Reason",
    "",
    decision.self_build_reason || "<none>",
    ""
  ].join("\n");
}
