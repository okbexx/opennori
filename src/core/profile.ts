import fs from "node:fs";
import path from "node:path";
import type { EvidenceLedger } from "../types/evidence.ts";
import type { CapabilityProfile, CapabilityProfileEvidence, CapabilityProfileItem, ProfileCompliance, ProfileComplianceStatus, ProfileEvidenceInput, ProfileItemInput } from "../types/profile.ts";
import { nowIso, readJson, slugify, writeJson } from "./shared.ts";

export const PROJECT_PROFILE_SCHEMA_VERSION = "opennori/project-profile-v1";
export const VALID_PROFILE_STRENGTHS = new Set(["must", "prefer", "avoid"]);
export const VALID_PROFILE_ITEM_TYPES = new Set(["skill", "stack", "constraint"]);
export const VALID_PROFILE_RESULTS = new Set(["satisfied", "violated", "waived"]);

export function projectProfileDir(root: string): string {
  return path.join(root, ".opennori", "profile");
}

export function projectProfilePath(root: string): string {
  return path.join(projectProfileDir(root), "profile.json");
}

export function emptyProjectProfile(): CapabilityProfile {
  return {
    schema_version: PROJECT_PROFILE_SCHEMA_VERSION,
    items: []
  };
}

export function normalizeProjectProfile(input: Partial<CapabilityProfile> | null | undefined = {}): CapabilityProfile {
  return {
    schema_version: input?.schema_version || PROJECT_PROFILE_SCHEMA_VERSION,
    updated_at: input?.updated_at,
    items: Array.isArray(input?.items) ? input.items : []
  };
}

export function readProjectProfile(root: string): CapabilityProfile {
  try {
    return normalizeProjectProfile(readJson<CapabilityProfile>(projectProfilePath(root)));
  } catch (error) {
    const typedError = error as Error;
    if (typedError.message?.startsWith("File not found:")) return emptyProjectProfile();
    throw error;
  }
}

export function writeProjectProfile(root: string, profile: CapabilityProfile): CapabilityProfile {
  const normalized = normalizeProjectProfile({
    ...profile,
    updated_at: nowIso()
  });
  writeJson(projectProfilePath(root), normalized);
  writeProjectProfileReadme(root, normalized);
  return normalized;
}

export function writeProjectProfileReadme(root: string, profile: CapabilityProfile = readProjectProfile(root)): void {
  fs.mkdirSync(projectProfileDir(root), { recursive: true });
  fs.writeFileSync(path.join(projectProfileDir(root), "README.md"), renderProjectProfileMarkdown(profile));
}

export function addProfileItem(profile: CapabilityProfile, item: ProfileItemInput): CapabilityProfile {
  const type = item.type || "constraint";
  const strength = item.strength || "prefer";
  if (!VALID_PROFILE_ITEM_TYPES.has(type)) {
    throw new Error(`Invalid profile item type: ${type}`);
  }
  if (!VALID_PROFILE_STRENGTHS.has(strength)) {
    throw new Error(`Invalid profile strength: ${strength}`);
  }
  const id = item.id || slugify(`${type}-${item.name}`);
  const existingIndex = profile.items.findIndex((entry) => entry.id === id);
  const entry: CapabilityProfileItem = {
    id,
    type,
    name: String(item.name || "").trim(),
    strength,
    purpose: String(item.purpose || "").trim(),
    scope: String(item.scope || "").trim(),
    install_policy: item.install_policy || "ask_before_install"
  };
  if (!entry.name) throw new Error("--name is required");
  const items = [...profile.items];
  items[existingIndex === -1 ? items.length : existingIndex] = entry;
  return {
    ...profile,
    items,
    updated_at: nowIso()
  };
}

export function profileEvidence(ledger: EvidenceLedger): CapabilityProfileEvidence[] {
  return Array.isArray(ledger.profile_evidence) ? ledger.profile_evidence : [];
}

function ensureProfileEvidence(ledger: EvidenceLedger): CapabilityProfileEvidence[] {
  if (!Array.isArray(ledger.profile_evidence)) ledger.profile_evidence = [];
  return ledger.profile_evidence;
}

export function addProfileEvidence(profile: CapabilityProfile, ledger: EvidenceLedger, itemId: string, evidence: ProfileEvidenceInput): EvidenceLedger {
  const item = profile.items.find((entry) => entry.id === itemId);
  if (!item) throw new Error(`Project Profile item not found: ${itemId}`);
  if (!VALID_PROFILE_RESULTS.has(evidence.result)) {
    throw new Error(`Invalid profile evidence result: ${evidence.result}`);
  }
  const entry: CapabilityProfileEvidence = {
    item_id: itemId,
    result: evidence.result,
    summary: evidence.summary,
    path: evidence.path,
    created_at: nowIso()
  };
  ensureProfileEvidence(ledger).push(entry);
  ledger.updated_at = nowIso();
  return ledger;
}

function latestProfileEvidence(ledger: EvidenceLedger, itemId: string): CapabilityProfileEvidence | undefined {
  return profileEvidence(ledger).filter((entry) => entry.item_id === itemId).at(-1);
}

export function profileCompliance(profile: CapabilityProfile, ledger: EvidenceLedger): ProfileCompliance {
  const items = profile.items || [];
  const statuses = items.map((item) => {
    const latest = latestProfileEvidence(ledger, item.id);
    let status: ProfileComplianceStatus = "unknown";
    if (latest?.result === "satisfied") status = "satisfied";
    if (latest?.result === "waived") status = "waived";
    if (latest?.result === "violated") status = "violated";
    return {
      id: item.id,
      type: item.type,
      name: item.name,
      strength: item.strength,
      purpose: item.purpose,
      status,
      summary: latest?.summary || "<none>"
    };
  });
  const blocking = statuses.filter((item) => item.strength === "must" && (item.status === "unknown" || item.status === "violated"));
  const avoidedViolations = statuses.filter((item) => item.strength === "avoid" && item.status === "violated");
  const review = statuses.filter((item) => {
    if (item.status === "satisfied" || item.status === "waived") return false;
    if (item.strength === "prefer") return item.status === "unknown" || item.status === "violated";
    if (item.strength === "avoid") return item.status === "unknown";
    return false;
  });
  return {
    required: items.length > 0,
    complete: blocking.length === 0 && avoidedViolations.length === 0,
    blocking: [...blocking, ...avoidedViolations],
    review,
    statuses
  };
}

export function renderProfileLines(profile: CapabilityProfile, ledger?: EvidenceLedger): string[] {
  if (!profile.items.length) return ["<none>"];
  const compliance = ledger
    ? profileCompliance(profile, ledger)
    : {
        statuses: profile.items.map((item) => ({
          id: item.id,
          type: item.type,
          name: item.name,
          strength: item.strength,
          purpose: item.purpose,
          status: "not evaluated",
          summary: "<none>"
        }))
      };
  return [
    "| ID | Type | Name | Strength | Compliance | Purpose |",
    "| --- | --- | --- | --- | --- | --- |",
    ...compliance.statuses.map((item) => `| ${item.id} | ${item.type} | ${item.name} | ${item.strength} | ${item.status} | ${item.purpose || "<none>"} |`)
  ];
}

export function renderProjectProfileMarkdown(profile: CapabilityProfile): string {
  const lines = [
    "# OpenNori Project Profile",
    "",
    "Project Profile defines how the agent should work in this project. It is project-level source data, not a Nori Contract and not Product AC.",
    "",
    `Updated: ${profile.updated_at || "<unknown>"}`,
    "",
    "## Items",
    "",
    ...renderProfileLines(profile),
    "",
    "## Boundary",
    "",
    "- Product AC says what the human user opens, does, sees, and judges.",
    "- Project Profile says which Skills, stacks, constraints, and install policies the agent should follow.",
    "- Goal reports may show compliance evidence against this Profile, but the Profile itself is not copied into a goal.",
    ""
  ];
  return `${lines.join("\n")}`;
}
