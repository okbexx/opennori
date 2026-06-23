import fs from "node:fs";
import path from "node:path";
import type { EvidenceInput, EvidenceSource, NormalizedEvidence } from "../types/evidence.ts";

export const VALID_EVIDENCE_RESULTS = new Set(["failing", "passing", "blocked", "waived"]);
export const EVIDENCE_HEALTH_STALE_DAYS = 14;

const CONTEXT_SOURCE_TYPES = new Set(["architecture-apply"]);

export function basisForEvidenceKind(kind: string): EvidenceInput["basis"] {
  if (kind === "human-confirmation") return "human-confirmation";
  if (kind === "test-summary" || kind === "review-result") return "tool-observation";
  if (kind === "screenshot" || kind === "artifact") return "artifact-review";
  if (kind === "protocol-v1") return "protocol-check";
  return "agent-observation";
}

function normalizeEvidenceSource(source: unknown): EvidenceSource | null {
  if (source === null || source === undefined) return null;
  if (typeof source === "string") {
    const label = source.trim();
    return label ? { type: "reference", label } : null;
  }
  if (typeof source !== "object" || Array.isArray(source)) return null;

  const entry: EvidenceSource = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      entry[key] = value;
    }
  }
  if (Object.keys(entry).length === 0) return null;
  if (!entry.type) entry.type = "reference";
  if (!entry.label) {
    entry.label = entry.path || entry.url || entry.command || entry.summary || entry.type;
  }
  return entry;
}

export function normalizeEvidence(evidence: EvidenceInput): NormalizedEvidence {
  const sources = (Array.isArray(evidence.sources) ? evidence.sources : [])
    .map((source: unknown) => normalizeEvidenceSource(source))
    .filter((source): source is EvidenceSource => Boolean(source));
  if (evidence.path && !sources.some((source) => source.path === evidence.path)) {
    sources.push({ type: "artifact", label: evidence.path, path: evidence.path });
  }
  const kind = evidence.kind || "manual";
  const basis = evidence.basis || basisForEvidenceKind(kind) || "agent-observation";
  return {
    ...evidence,
    kind,
    basis,
    sources,
    reviewability: evidence.reviewability || (sources.length > 0 ? "source-provided" : "summary-only"),
    limitations: evidence.limitations || ""
  };
}

export function sourceIsContext(source: EvidenceSource): boolean {
  return source.role === "context" || CONTEXT_SOURCE_TYPES.has(source.type || "");
}

export function sourceIsProductEvidence(source: EvidenceSource): boolean {
  if (sourceIsContext(source)) return false;
  return Boolean(
    source.command ||
    source.path ||
    source.url ||
    source.label ||
    source.summary ||
    (source.type && source.type !== "reference")
  );
}

export function sourceIsInspectable(source: EvidenceSource): boolean {
  return sourceIsProductEvidence(source) || sourceIsContext(source);
}

function isLocalEvidencePath(sourcePath: string): boolean {
  return Boolean(sourcePath) && !/^[a-z][a-z0-9+.-]*:/i.test(sourcePath);
}

export function evidencePathExists(root: string | undefined, sourcePath: unknown): boolean {
  const rawPath = String(sourcePath || "").trim();
  if (!rawPath || !isLocalEvidencePath(rawPath)) return true;
  const absolutePath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(root || process.cwd(), rawPath);
  return fs.existsSync(absolutePath);
}

export function sourceIsStillReviewable(source: EvidenceSource, root: string | undefined): boolean {
  if ((source.type === "artifact" || source.path) && source.path) {
    return evidencePathExists(root, source.path);
  }
  return true;
}
