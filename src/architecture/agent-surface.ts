import fs from "node:fs";
import path from "node:path";
import type { ArchitectureSurfaceState } from "../types/architecture.ts";
import {
  AGENT_ROUTE_END,
  AGENT_ROUTE_START,
  agentGuidePath
} from "./shared.ts";

export function renderAgentGuideMarkdown(): string {
  return [
    "# OpenNori Agent Guide",
    "",
    "This project uses OpenNori state under `.opennori/`.",
    "Empty state directories are normal immediately after `opennori init`; they mean no Nori Contract has been started yet.",
    "",
    "When the user gives a goal:",
    "",
    "- If `.opennori/current/<goal>/README.md` is missing, do not implement yet. Use OpenNori to discover and draft a human-centered Nori Contract, then ask the user to confirm the acceptance checks.",
    "- If `.opennori/drafts/<goal>/README.md` exists but `.opennori/current/` is empty, show the draft to the user for approval or revision before implementation.",
    "- If the user asks OpenNori to take over an AC discussion that already happened in chat, preserve the discussed goal, AC, assumptions, and open questions as a draft Nori Contract; do not restart through autogoal, implement, or record evidence before approval.",
    "- If a current Nori Contract exists, read `.opennori/current/<goal>/README.md`, `contract.json`, `ledger.json`, and the current `criteria/<AC>/README.md`; resume the current acceptance gap and work only toward reviewable evidence for that gap.",
    "- Answer completion questions from OpenNori status/report: goal, current gap, evidence, user intervention, decision, and next action.",
    "",
    "Architecture guidance:",
    "",
    "- Read `.opennori/architecture/baseline.md` and `.opennori/architecture/baseline.json` only when they exist or when non-trivial work needs a confirmed Architecture Baseline.",
    "- If non-trivial implementation has no confirmed baseline, establish one with the user before implementation instead of inventing stack or directory decisions silently.",
    "- If the baseline conflicts with project evidence, create an Architecture Challenge and ask for confirmation.",
    "- Do not silently replace technology stack, directory boundaries, dependency policy, or state model.",
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
    "Before implementing with OpenNori, read `.opennori/agent-guide.md`.",
    "If `.opennori/current/<goal>/README.md` is missing, start by helping the user create and confirm a human-centered Nori Contract; empty OpenNori state directories are not a broken install.",
    "",
    "For current work, read:",
    "",
    "- `.opennori/current/<goal>/README.md`",
    "- `.opennori/current/<goal>/contract.json`",
    "- `.opennori/current/<goal>/ledger.json`",
    "- `.opennori/current/<goal>/criteria/<AC>/README.md` for the current gap",
    "- `.opennori/architecture/baseline.md` when it exists or non-trivial work requires a confirmed baseline",
    "",
    "Work from the current acceptance gap and record reviewable evidence.",
    "Follow the Architecture Baseline when one is confirmed.",
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
  const containsRoute = (filePath: string) => {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, "utf8");
    return content.includes(AGENT_ROUTE_START)
      || content.includes(".opennori/agent-guide.md")
      || content.includes(".opennori/current/<goal>/README.md");
  };
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
