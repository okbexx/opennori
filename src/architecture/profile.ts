import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "../core.ts";
import type {
  ArchitectureProfile,
  ArchitectureProfileListItem
} from "../types.ts";
import { BUILTIN_ARCHITECTURE_PROFILES } from "./builtin-profiles.ts";
import {
  architectureProfileDescriptor,
  normalizeArchitectureProfile,
  validateArchitectureProfile
} from "./profile-model.ts";
import { architectureDir, architectureProfilePath, errorMessage, relativeTo } from "./shared.ts";

export {
  architectureProfileDescriptor,
  normalizeArchitectureProfile,
  validateArchitectureProfile
} from "./profile-model.ts";

export function resolveArchitectureProfile(root: string, profileId = "typescript-agent-state-cli"): ArchitectureProfile {
  const localPath = architectureProfilePath(root, profileId);
  if (fs.existsSync(localPath)) {
    return {
      ...readJson<ArchitectureProfile>(localPath),
      origin: "project"
    };
  }
  const builtin = BUILTIN_ARCHITECTURE_PROFILES[profileId];
  if (!builtin) throw new Error(`Unknown Architecture Profile: ${profileId}`);
  return {
    ...builtin,
    origin: "builtin"
  };
}

function localArchitectureProfiles(root: string): ArchitectureProfileListItem[] {
  const dir = path.join(architectureDir(root), "profiles");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      const profilePath = path.join(dir, fileName);
      try {
        const profileInput = readJson<Partial<ArchitectureProfile>>(profilePath);
        const profile = normalizeArchitectureProfile(profileInput, profileInput.id ? undefined : fileName.replace(/\.json$/, ""));
        return architectureProfileDescriptor(profile, {
          origin: "project",
          path: relativeTo(root, profilePath)
        });
      } catch (error) {
        return {
          id: fileName.replace(/\.json$/, ""),
          title: fileName.replace(/\.json$/, ""),
          origin: "project",
          path: relativeTo(root, profilePath),
          valid: false,
          error: errorMessage(error)
        };
      }
    });
}

export function architectureProfiles(root: string): ArchitectureProfileListItem[] {
  const builtins = Object.values(BUILTIN_ARCHITECTURE_PROFILES)
    .map((profile) => architectureProfileDescriptor(profile, { origin: "builtin" }));
  const local = localArchitectureProfiles(root);
  const localIds = new Set(local.map((profile) => profile.id));
  return [
    ...local,
    ...builtins.filter((profile) => !localIds.has(profile.id))
  ];
}

export function writeArchitectureProfile(root: string, profile: ArchitectureProfile, { force = false } = {}): string {
  const target = architectureProfilePath(root, profile.id);
  if (fs.existsSync(target) && !force) {
    throw new Error(`Architecture Profile already exists: ${relativeTo(root, target)}. Rerun with --force only after review.`);
  }
  writeJson(target, profile);
  return target;
}
