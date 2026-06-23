import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { packagePath } from "../../package-root.ts";

export type SkillCapabilitySourceKind = "package-skill" | "codex-plugin-cache" | "user-skill";

export type SkillCapabilitySource = {
  kind: SkillCapabilitySourceKind;
  label: string;
  path: string;
  exists: boolean;
};

export type SkillCapabilityInspection = {
  name: string;
  found: boolean;
  source_kind: SkillCapabilitySourceKind | null;
  path: string | null;
  sources: SkillCapabilitySource[];
};

export type SkillCapabilityInspectionOptions = {
  homeDir?: string;
  packageSkillsDir?: string;
  pluginCacheDir?: string;
  userSkillDirs?: string[];
  maxPluginCacheDepth?: number;
};

const DEFAULT_MAX_PLUGIN_CACHE_DEPTH = 8;
const DEFAULT_PACKAGE_SKILLS_DIR = packagePath("plugins", "opennori", "skills");

function uniqueSources(sources: SkillCapabilitySource[]): SkillCapabilitySource[] {
  const seen = new Set<string>();
  const unique: SkillCapabilitySource[] = [];
  for (const source of sources) {
    const key = `${source.kind}:${path.resolve(source.path)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(source);
  }
  return unique;
}

function defaultHomeDir(): string {
  return process.env.HOME || os.homedir() || "";
}

function defaultUserSkillDirs(homeDir: string): string[] {
  if (!homeDir) return [];
  return [
    path.join(homeDir, ".agents", "skills"),
    path.join(homeDir, ".codex", "skills")
  ];
}

function source(kind: SkillCapabilitySourceKind, label: string, filePath: string): SkillCapabilitySource {
  return {
    kind,
    label,
    path: filePath,
    exists: fs.existsSync(filePath)
  };
}

function collectPluginCacheSkillPaths(cacheRoot: string, name: string, maxDepth: number): string[] {
  const matches: string[] = [];
  if (!cacheRoot || !fs.existsSync(cacheRoot)) return matches;

  function visit(dir: string, depth: number): void {
    if (depth > maxDepth) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    if (path.basename(dir) === "skills") {
      const candidate = path.join(dir, name, "SKILL.md");
      if (fs.existsSync(candidate)) matches.push(candidate);
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      visit(path.join(dir, entry.name), depth + 1);
    }
  }

  visit(cacheRoot, 0);
  return matches.sort((left, right) => left.localeCompare(right));
}

export function inspectSkillCapability(
  name: string,
  options: SkillCapabilityInspectionOptions = {}
): SkillCapabilityInspection {
  const skillName = String(name || "").trim();
  const homeDir = options.homeDir ?? defaultHomeDir();
  const packageSkillsDir = options.packageSkillsDir ?? DEFAULT_PACKAGE_SKILLS_DIR;
  const pluginCacheDir = options.pluginCacheDir ?? (homeDir ? path.join(homeDir, ".codex", "plugins", "cache") : "");
  const userSkillDirs = options.userSkillDirs ?? defaultUserSkillDirs(homeDir);
  const maxPluginCacheDepth = options.maxPluginCacheDepth ?? DEFAULT_MAX_PLUGIN_CACHE_DEPTH;

  const packageCandidate = path.join(packageSkillsDir, skillName, "SKILL.md");
  const pluginCacheMatches = collectPluginCacheSkillPaths(pluginCacheDir, skillName, maxPluginCacheDepth);
  const pluginCacheSources = pluginCacheMatches.length > 0
    ? pluginCacheMatches.map((candidate) => source("codex-plugin-cache", "Codex Plugin cache Skill", candidate))
    : [source("codex-plugin-cache", "Codex Plugin cache Skill pattern", path.join(pluginCacheDir || "<no-home>", "**", "skills", skillName, "SKILL.md"))];
  const sources = uniqueSources([
    source("package-skill", "OpenNori package Skill asset", packageCandidate),
    ...pluginCacheSources,
    ...userSkillDirs.map((dir) => source("user-skill", "User-local Skill", path.join(dir, skillName, "SKILL.md")))
  ]);

  const found = sources.find((candidate) => candidate.exists) || null;
  return {
    name: skillName,
    found: Boolean(found),
    source_kind: found?.kind || null,
    path: found?.path || null,
    sources
  };
}
