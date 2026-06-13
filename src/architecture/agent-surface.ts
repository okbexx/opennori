import fs from "node:fs";
import path from "node:path";
import type { ArchitectureSurfaceState } from "../types.ts";
import {
  AGENT_ROUTE_END,
  AGENT_ROUTE_START,
  agentGuidePath
} from "./shared.ts";

export function renderAgentGuideMarkdown(): string {
  return [
    "# OpenNori Agent Guide",
    "",
    "Before implementing a non-trivial OpenNori acceptance gap, read:",
    "",
    "- `.opennori/active/*.acceptance.md`",
    "- `.opennori/architecture/baseline.md`",
    "- `.opennori/architecture/baseline.json` when structured data is needed",
    "",
    "Follow the Architecture Baseline while completing Product AC.",
    "If the baseline conflicts with project evidence, create an Architecture Challenge and ask for confirmation.",
    "Do not silently replace technology stack, directory boundaries, dependency policy, or state model.",
    "",
    "Build-vs-buy is required before custom infrastructure work: check current dependencies, standard libraries, official SDKs, mature open-source libraries, and documented reference projects before self-building.",
    ""
  ].join("\n");
}

export function renderAgentRouteSectionMarkdown(): string {
  return [
    AGENT_ROUTE_START,
    "## OpenNori",
    "",
    "Before implementing a non-trivial change, read:",
    "",
    "- `.opennori/active/*.acceptance.md`",
    "- `.opennori/architecture/baseline.md`",
    "- `.opennori/agent-guide.md`",
    "",
    "Follow the Architecture Baseline while completing Product AC.",
    "If the baseline conflicts with project evidence, create an Architecture Challenge instead of silently replacing it.",
    AGENT_ROUTE_END,
    ""
  ].join("\n");
}

export function renderAgentRouteMarkdown(agentName: string): string {
  return [
    `# ${agentName} Project Instructions`,
    "",
    renderAgentRouteSectionMarkdown()
  ].join("\n");
}

export function architectureSurfaceState(root: string): ArchitectureSurfaceState {
  const guide = agentGuidePath(root);
  const agents = path.join(root, "AGENTS.md");
  const claude = path.join(root, "CLAUDE.md");
  const containsRoute = (filePath: string) => fs.existsSync(filePath)
    && fs.readFileSync(filePath, "utf8").includes(".opennori/architecture/baseline.md");
  return {
    guide: {
      path: ".opennori/agent-guide.md",
      installed: fs.existsSync(guide),
      in_sync: fs.existsSync(guide) && fs.readFileSync(guide, "utf8") === renderAgentGuideMarkdown()
    },
    agents: {
      path: "AGENTS.md",
      installed: fs.existsSync(agents),
      references_baseline: containsRoute(agents)
    },
    claude: {
      path: "CLAUDE.md",
      installed: fs.existsSync(claude),
      references_baseline: containsRoute(claude)
    }
  };
}
