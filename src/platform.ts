import { OpenNoriError } from "./errors.ts";
import { readText } from "./io.ts";
import { packagePath } from "./package-root.ts";
import { codexSessionMemoryAdapter, type SessionMemoryAdapter } from "./session-memory.ts";
import type { ManagedAsset, OwnershipRecord, PlatformId, ProjectConfig } from "./types.ts";

export const PLATFORM_IDS = ["codex", "claude"] as const satisfies readonly PlatformId[];

const PACKAGED_SKILLS = [
  "nori",
  "nori-plan",
  "nori-implement",
  "nori-check",
  "nori-finish",
  "nori-update-spec",
  "nori-project-health"
] as const;

export const CODEX_ROUTE_MARKERS = {
  start: "<!-- OPENNORI:START -->",
  end: "<!-- OPENNORI:END -->"
} as const;

export const CLAUDE_ROUTE_MARKERS = {
  start: "<!-- OPENNORI:CLAUDE:START -->",
  end: "<!-- OPENNORI:CLAUDE:END -->"
} as const;

type PlatformAdapter = {
  id: PlatformId;
  displayName: string;
  sessionMemory: SessionMemoryAdapter | null;
  coordination: "codex-hooks" | null;
  assets: (config: ProjectConfig) => ManagedAsset[];
  sections: Array<{
    assetId: string;
    path: string;
    markers: { start: string; end: string };
  }>;
};

function template(relativePath: string): string {
  return readText(packagePath("templates", relativePath));
}

function packagedSkillAssets(platform: PlatformId, directory: string): ManagedAsset[] {
  return PACKAGED_SKILLS.map((skill) => ({
    assetId: `${platform}.skill.${skill}`,
    platform,
    path: `${directory}/${skill}/SKILL.md`,
    scope: "file",
    policy: "managed",
    content: readText(packagePath("skills", skill, "SKILL.md"))
  }));
}

const PLATFORM_ADAPTERS: Record<PlatformId, PlatformAdapter> = {
  codex: {
    id: "codex",
    displayName: "Codex",
    sessionMemory: codexSessionMemoryAdapter,
    coordination: "codex-hooks",
    assets: () => [
      {
        assetId: "codex.project-route",
        platform: "codex",
        path: "AGENTS.md",
        scope: "section",
        policy: "managed",
        content: template("agents-section.md"),
        markers: CODEX_ROUTE_MARKERS
      }
    ],
    sections: [{ assetId: "codex.project-route", path: "AGENTS.md", markers: CODEX_ROUTE_MARKERS }]
  },
  claude: {
    id: "claude",
    displayName: "Claude Code",
    sessionMemory: null,
    coordination: null,
    assets: () => [
      {
        assetId: "claude.project-route",
        platform: "claude",
        path: "CLAUDE.md",
        scope: "section",
        policy: "managed",
        content: template("claude-section.md"),
        markers: CLAUDE_ROUTE_MARKERS
      },
      ...packagedSkillAssets("claude", ".claude/skills")
    ],
    sections: [{ assetId: "claude.project-route", path: "CLAUDE.md", markers: CLAUDE_ROUTE_MARKERS }]
  }
};

export function platformAdapter(platform: PlatformId): PlatformAdapter {
  const adapter = PLATFORM_ADAPTERS[platform];
  if (!adapter) throw new OpenNoriError("platform_unsupported", `Unsupported platform: ${platform}.`);
  return adapter;
}

export function platformDisplayName(platform: PlatformId): string {
  return platformAdapter(platform).displayName;
}

export function platformSessionMemory(platform: PlatformId): SessionMemoryAdapter {
  const adapter = platformAdapter(platform).sessionMemory;
  if (!adapter) {
    throw new OpenNoriError("session_memory_unsupported", `${platformDisplayName(platform)} does not expose supported session memory.`, {
      recovery: "Continue from project Specs and the developer journal, or use a platform with a supported read-only history adapter."
    });
  }
  return adapter;
}

export function requirePlatformCoordination(platform: PlatformId): void {
  if (platformAdapter(platform).coordination) return;
  throw new OpenNoriError("coordination_unsupported", `${platformDisplayName(platform)} does not expose supported worker coordination.`, {
    recovery: "Continue sequentially on this platform; Task, Contract, and Evidence remain available."
  });
}

export function projectPlatformAssets(config: ProjectConfig): ManagedAsset[] {
  return config.platforms.flatMap((platform) => platformAdapter(platform).assets(config));
}

export function knownPlatformSectionAsset(record: OwnershipRecord): ManagedAsset | null {
  if (record.platform === "core") return null;
  const section = platformAdapter(record.platform).sections.find((entry) => entry.assetId === record.asset_id);
  if (!section) return null;
  return {
    assetId: record.asset_id,
    platform: record.platform,
    path: section.path,
    scope: "section",
    policy: "managed",
    content: `${section.markers.start}\n${section.markers.end}\n`,
    markers: section.markers
  };
}
