import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "../core.ts";
import type { ArchitectureApplyRecord, ArchitectureApplySummary } from "../types.ts";
import { validateSchema } from "../validation.ts";
import { ARCHITECTURE_APPLY_SCHEMA_VERSION, architectureApplyPath, architectureDir, errorMessage, relativeTo } from "./shared.ts";

type ArchitectureApplyInput = {
  id: string;
  goal_id: string;
  criterion_id: string;
  status: string;
  baseline: ArchitectureApplyRecord["baseline"];
  summary: string;
  fit: string;
  implementation_focus: string;
  evidence?: string;
  limitations?: string;
};

export function renderArchitectureApplyMarkdown(record: ArchitectureApplyRecord): string {
  const lines = [
    "# OpenNori Architecture Apply Record",
    "",
    `Status: ${record.status}`,
    `Goal: ${record.goal_id}`,
    `Criterion: ${record.criterion_id}`,
    `Baseline: ${record.baseline.profile}`,
    `Accepted at: ${record.baseline.accepted_at || "<unknown>"}`,
    "",
    "## Summary",
    "",
    record.summary,
    "",
    "## Fit",
    "",
    record.fit,
    "",
    "## Implementation Focus",
    "",
    record.implementation_focus,
    "",
    "## Evidence",
    "",
    record.evidence || "<none>",
    "",
    "## Limitations",
    "",
    record.limitations || "<none>",
    "",
    "## Rule",
    "",
    "This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.",
    ""
  ];
  return `${lines.join("\n")}\n`;
}

export function writeArchitectureApplyRecord(root: string, record: ArchitectureApplyRecord) {
  const paths = architectureApplyPath(root, record.id);
  writeJson(paths.jsonPath, record);
  fs.mkdirSync(path.dirname(paths.markdownPath), { recursive: true });
  fs.writeFileSync(paths.markdownPath, renderArchitectureApplyMarkdown(record));
  return paths;
}

export function buildArchitectureApplyRecord(input: ArchitectureApplyInput): ArchitectureApplyRecord {
  const record: ArchitectureApplyRecord = {
    schema_version: ARCHITECTURE_APPLY_SCHEMA_VERSION,
    id: input.id,
    goal_id: input.goal_id,
    criterion_id: input.criterion_id,
    status: input.status,
    baseline: input.baseline,
    summary: input.summary,
    fit: input.fit,
    implementation_focus: input.implementation_focus,
    evidence: input.evidence,
    limitations: input.limitations,
    created_at: new Date().toISOString(),
    next: input.status === "needs-challenge"
      ? "Create an Architecture Challenge before implementation continues."
      : "Use this apply record as architecture context when recording Product AC evidence."
  };
  return record;
}

export function architectureApplySummaries(root: string): ArchitectureApplySummary[] {
  const dir = path.join(architectureDir(root), "evidence");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      const recordPath = path.join(dir, fileName);
      try {
        const record = readJson<ArchitectureApplyRecord>(recordPath);
        const schemaResult = validateSchema("architecture-apply", record);
        return {
          id: record.id || fileName.replace(/\.json$/, ""),
          goal_id: record.goal_id || "",
          criterion_id: record.criterion_id || "",
          status: record.status || "unknown",
          summary: record.summary || "",
          baseline_profile: record.baseline?.profile || "",
          path: relativeTo(root, recordPath),
          schema_valid: schemaResult.valid,
          schema_errors: schemaResult.errors
        };
      } catch (error) {
        return {
          id: fileName.replace(/\.json$/, ""),
          goal_id: "",
          criterion_id: "",
          status: "broken",
          summary: "",
          baseline_profile: "",
          path: relativeTo(root, recordPath),
          error: errorMessage(error)
        };
      }
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}
