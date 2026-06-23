import fs from "node:fs";
import path from "node:path";
import { REQUIRED_ARCHITECTURE_DIRS, architectureState, readArchitectureBaseline } from "../architecture.ts";
import {
  PROTOCOL_VERSION,
  currentGap,
  findCurrentPairs,
  findDraftPairs,
  findHistoryPairs,
  findLegacyActivePairs,
  readGoalPayload,
  readJson,
  writeJson
} from "../core.ts";
import { readProjectProfile } from "../core/profile.ts";
import { pluginState } from "../plugin.ts";
import type { ActiveGoalSummary, Manifest, ManifestManagedFile, ManifestWriteAction } from "../types/lifecycle.ts";
import {
  MANIFEST_SCHEMA_VERSION,
  NORI_CAPABILITIES,
  PACKAGE_JSON,
  REQUIRED_NORI_DIRS,
  manifestPath,
  relativeTo
} from "./shared.ts";

function goalSummaries(root: string, pairs = findCurrentPairs(root)): ActiveGoalSummary[] {
  const profile = readProjectProfile(root);
  return pairs.map((pair) => {
    try {
      const payload = readGoalPayload(pair);
      return {
        goal_id: pair.goalId,
        location: pair.location,
        status: payload.ledger?.status || "unknown",
        current_gap: currentGap(payload.contract, payload.ledger, profile),
        acceptance_path: relativeTo(root, pair.acceptancePath),
        evidence_path: relativeTo(root, pair.evidencePath),
        recoverable: true
      };
    } catch (error) {
      return {
        goal_id: pair.goalId,
        location: pair.location,
        status: "unreadable",
        current_gap: null,
        acceptance_path: relativeTo(root, pair.acceptancePath),
        evidence_path: relativeTo(root, pair.evidencePath),
        recoverable: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
}

export function managedFiles(root: string, { assumeManifestExists = false } = {}): ManifestManagedFile[] {
  const entries = [
    { path: ".opennori/manifest.json", kind: "manifest", required: true },
    { path: ".opennori/protocol.md", kind: "protocol", required: true },
    { path: ".opennori/agent-guide.md", kind: "agent-guide", required: true },
    { path: "AGENTS.md", kind: "agent-route", required: false },
    { path: "CLAUDE.md", kind: "agent-route", required: false },
    ...REQUIRED_NORI_DIRS.map((dir) => ({ path: `.opennori/${dir}`, kind: "directory", required: true })),
    { path: ".opennori/profile/profile.json", kind: "project-profile", required: true },
    { path: ".opennori/profile/README.md", kind: "project-profile", required: true },
    { path: ".opennori/architecture", kind: "directory", required: true },
    ...REQUIRED_ARCHITECTURE_DIRS.map((dir) => ({ path: `.opennori/architecture/${dir}`, kind: "directory", required: true })),
    { path: ".opennori/architecture/baseline.json", kind: "architecture-baseline", required: false },
    { path: ".opennori/architecture/baseline.md", kind: "architecture-baseline", required: false }
  ];
  return entries.map((entry) => ({
    ...entry,
    exists: entry.path === ".opennori/manifest.json" && assumeManifestExists
      ? true
      : fs.existsSync(path.join(root, entry.path))
  }));
}

export function safeReadManifest(root: string): Manifest | null {
  try {
    return readJson<Manifest>(manifestPath(root));
  } catch {
    return null;
  }
}

export function buildManifest(root: string, options: { assumeManifestExists?: boolean } = {}): Manifest {
  const existing = safeReadManifest(root);
  const currentGoals = goalSummaries(root, findCurrentPairs(root));
  const architectureGoalId = currentGoals.length === 1
    ? currentGoals[0]?.goal_id
    : readArchitectureBaseline(root)?.goal_id;
  const architecture = architectureState(root, architectureGoalId);
  const now = new Date().toISOString();
  return {
    schema_version: MANIFEST_SCHEMA_VERSION,
    protocol_version: PROTOCOL_VERSION,
    opennori_version: PACKAGE_JSON.version,
    created_at: existing?.created_at || now,
    updated_at: now,
    capabilities: NORI_CAPABILITIES,
    managed_files: managedFiles(root, options),
    active_goals: currentGoals,
    current_goal: currentGoals[0] || null,
    draft_goals: goalSummaries(root, findDraftPairs(root)),
    history_goals: goalSummaries(root, findHistoryPairs(root)),
    legacy_active_goals: goalSummaries(root, findLegacyActivePairs(root)),
    plugin: pluginState(),
    architecture
  };
}

export function writeManifest(root: string, { dryRun = false } = {}): ManifestWriteAction {
  const target = manifestPath(root);
  const exists = fs.existsSync(target);
  const manifest = buildManifest(root, { assumeManifestExists: !dryRun || exists });
  if (!dryRun) {
    writeJson(target, manifest);
  }
  return {
    path: target,
    action: exists ? "update" : "create",
    kind: "manifest",
    managed: true,
    manifest
  };
}

export function refreshManifest(root: string): void {
  if (fs.existsSync(path.join(root, ".opennori"))) {
    writeManifest(root);
  }
}
