import fs from "node:fs";
import path from "node:path";
import { addProfileEvidence, readJson } from "../core.ts";
import type { JsonObject } from "../types/common.ts";
import type { EvidenceSource } from "../types/evidence.ts";
import type { EvidenceLedger } from "../types/evidence.ts";
import type { AutoProfileCheck } from "../types/lifecycle.ts";
import type { CapabilityProfile, ProfileEvidenceResult } from "../types/profile.ts";
import { inspectSkillCapability } from "./adapters/skill-capability.ts";

function stackIsPresent(root: string, name: string): boolean | null {
  const packageJsonPath = path.join(root, "package.json");
  if (!fs.existsSync(packageJsonPath)) return null;
  try {
    const packageJson = readJson(packageJsonPath);
    const dependencySets = [
      packageJson.dependencies,
      packageJson.devDependencies,
      packageJson.peerDependencies,
      packageJson.optionalDependencies
    ].filter(Boolean);
    return dependencySets.some((dependencies: JsonObject) => Object.prototype.hasOwnProperty.call(dependencies, name));
  } catch {
    return null;
  }
}

export function autoProfileChecks(root: string, profile: CapabilityProfile): AutoProfileCheck[] {
  return (profile.items || []).map((item) => {
    if (item.type === "skill") {
      const inspection = inspectSkillCapability(item.name);
      const result = inspection.found ? (item.strength === "avoid" ? "violated" : "satisfied") : (item.strength === "avoid" ? "satisfied" : "unknown");
      return {
        item_id: item.id,
        type: item.type,
        name: item.name,
        strength: item.strength,
        result,
        basis: "skill-capability-source",
        summary: inspection.found
          ? `Skill ${item.name} is available from ${inspection.source_kind} at ${inspection.path}.`
          : `Skill ${item.name} was not found in OpenNori package assets, Codex Plugin cache, or user-local Skill paths.`,
        sources: inspection.sources.map((candidate) => ({
          type: "artifact",
          label: candidate.label,
          path: candidate.path,
          exists: candidate.exists,
          source_kind: candidate.kind
        })),
        can_auto_record: result !== "unknown"
      };
    }

    if (item.type === "stack") {
      const present = stackIsPresent(root, item.name);
      if (present === true) {
        return {
          item_id: item.id,
          type: item.type,
          name: item.name,
          strength: item.strength,
          result: item.strength === "avoid" ? "violated" : "satisfied",
          basis: "package-json",
          summary: `Stack ${item.name} is present in package.json dependencies.`,
          sources: [{ type: "artifact", label: "package.json", path: path.join(root, "package.json") }],
          can_auto_record: true
        };
      }
      if (present === false) {
        return {
          item_id: item.id,
          type: item.type,
          name: item.name,
          strength: item.strength,
          result: item.strength === "avoid" ? "satisfied" : "unknown",
          basis: "package-json",
          summary: `Stack ${item.name} is not present in package.json dependencies.`,
          sources: [{ type: "artifact", label: "package.json", path: path.join(root, "package.json") }],
          can_auto_record: item.strength === "avoid"
        };
      }
      return {
        item_id: item.id,
        type: item.type,
        name: item.name,
        strength: item.strength,
        result: "unknown",
        basis: "package-json-unavailable",
        summary: "No readable package.json was available for automatic stack checks.",
        sources: [],
        can_auto_record: false
      };
    }

    return {
      item_id: item.id,
      type: item.type,
      name: item.name,
      strength: item.strength,
      result: "unknown",
      basis: "agent-or-human-review-required",
      summary: "Constraint items require agent evidence, human confirmation, or waiver.",
      sources: [],
      can_auto_record: false
    };
  });
}

export function recordAutoProfileChecks(profile: CapabilityProfile, ledger: EvidenceLedger, checks: AutoProfileCheck[]): EvidenceLedger {
  for (const check of checks.filter((entry) => entry.can_auto_record)) {
    if (!["satisfied", "violated", "waived"].includes(check.result)) continue;
    const latest = ledger.profile_evidence?.filter((entry) => entry.item_id === check.item_id).at(-1);
    if (latest?.result === check.result && latest?.summary === check.summary) continue;
    const sourcePath = check.sources?.find((source: EvidenceSource) => source.exists === true)?.path;
    addProfileEvidence(profile, ledger, check.item_id, {
      result: check.result as ProfileEvidenceResult,
      summary: check.summary,
      path: sourcePath
    });
  }
  return ledger;
}
