import fs from "node:fs";
import path from "node:path";
import { readJson } from "../core.ts";
import type { ArchitectureChallenge, ArchitectureChallengeSummary } from "../types/architecture.ts";
import { architectureDir, errorMessage, relativeTo } from "./shared.ts";

export function architectureChallengeSummaries(root: string): ArchitectureChallengeSummary[] {
  const dir = path.join(architectureDir(root), "challenges");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      try {
        const challenge = readJson<ArchitectureChallenge>(path.join(dir, fileName));
        return {
          id: challenge.id || fileName.replace(/\.json$/, ""),
          status: challenge.status || "open",
          summary: challenge.summary || "",
          needs_user: challenge.needs_user !== false,
          path: relativeTo(root, path.join(dir, fileName))
        };
      } catch (error) {
        return {
          id: fileName.replace(/\.json$/, ""),
          status: "unreadable",
          summary: errorMessage(error),
          needs_user: true,
          path: relativeTo(root, path.join(dir, fileName))
        };
      }
    });
}

export function renderArchitectureChallengeMarkdown(challenge: ArchitectureChallenge): string {
  return [
    `# ${challenge.id} Architecture Challenge`,
    "",
    `Status: ${challenge.status}`,
    `Needs user: ${challenge.needs_user ? "yes" : "no"}`,
    `Baseline: ${challenge.baseline?.profile || "<none>"}`,
    "",
    "## Summary",
    "",
    challenge.summary || "<none>",
    "",
    "## Evidence",
    "",
    challenge.evidence || "<none>",
    "",
    "## Recommendation",
    "",
    challenge.recommendation || "<none>",
    "",
    "## Rule",
    "",
    "This challenge is the only valid way for an agent to request a baseline change. Do not silently replace the Architecture Baseline.",
    ""
  ].join("\n");
}
