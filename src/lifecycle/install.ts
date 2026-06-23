import fs from "node:fs";
import path from "node:path";
import type { ManagedAction } from "../types/lifecycle-plans.ts";
import {
  AGENT_ROUTE_END,
  AGENT_ROUTE_START,
  agentGuidePath,
  renderAgentGuideMarkdown,
  renderAgentRouteMarkdown,
  renderAgentRouteSectionMarkdown,
  REQUIRED_ARCHITECTURE_DIRS
} from "../architecture.ts";
import {
  ensureDir,
  writeAgentRoute,
  writeIfSafe
} from "./managed-files.ts";
import { emptyProjectProfile, readProjectProfile, renderProjectProfileMarkdown } from "../core/profile.ts";
import { writeManifest } from "./manifest.ts";
import { protocolTemplate } from "./shared.ts";

type InstallOptions = {
  dryRun?: boolean;
  force?: boolean;
  mergeAgentRoute?: boolean;
};

function projectProfileReadmeAction(root: string, { dryRun = false } = {}): ManagedAction {
  const target = path.join(root, ".opennori", "profile", "README.md");
  const exists = fs.existsSync(target);
  const profile = readProjectProfile(root);
  const content = renderProjectProfileMarkdown(profile);
  const current = exists ? fs.readFileSync(target, "utf8") : null;
  const action = exists ? (current === content ? "exists" : "update") : "create";
  if (!dryRun && action !== "exists") {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return {
    path: target,
    action,
    kind: "project-profile",
    managed: true,
    reason: action === "exists"
      ? "Project Profile README already matches profile.json."
      : "Project Profile README will be generated from profile.json."
  };
}

export function installActions(root: string, { dryRun = false, force = false, mergeAgentRoute = false }: InstallOptions = {}): ManagedAction[] {
  const actions: ManagedAction[] = [
    ensureDir(path.join(root, ".opennori", "current"), { dryRun }),
    ensureDir(path.join(root, ".opennori", "drafts"), { dryRun }),
    ensureDir(path.join(root, ".opennori", "completed"), { dryRun }),
    ensureDir(path.join(root, ".opennori", "blocked"), { dryRun }),
    ensureDir(path.join(root, ".opennori", "reports"), { dryRun }),
    ensureDir(path.join(root, ".opennori", "brainstorms"), { dryRun }),
    ensureDir(path.join(root, ".opennori", "profile"), { dryRun }),
    writeIfSafe(path.join(root, ".opennori", "profile", "profile.json"), `${JSON.stringify(emptyProjectProfile(), null, 2)}\n`, { dryRun, force: false, kind: "project-profile" }),
    projectProfileReadmeAction(root, { dryRun }),
    ensureDir(path.join(root, ".opennori", "architecture"), { dryRun }),
    ...REQUIRED_ARCHITECTURE_DIRS.map((dir) => ensureDir(path.join(root, ".opennori", "architecture", dir), { dryRun })),
    writeIfSafe(path.join(root, ".opennori", "protocol.md"), protocolTemplate(), { dryRun, force, kind: "protocol" }),
    writeIfSafe(agentGuidePath(root), renderAgentGuideMarkdown(), { dryRun, force, kind: "agent-guide" })
  ];

  if (mergeAgentRoute) {
    const agentRouteSection = renderAgentRouteSectionMarkdown();
    actions.push(
      writeAgentRoute(path.join(root, "AGENTS.md"), renderAgentRouteMarkdown("AGENTS"), agentRouteSection, { dryRun, force, merge: true, kind: "agent-route", managed: true, startMarker: AGENT_ROUTE_START, endMarker: AGENT_ROUTE_END }),
      writeAgentRoute(path.join(root, "CLAUDE.md"), renderAgentRouteMarkdown("CLAUDE"), agentRouteSection, { dryRun, force, merge: true, kind: "agent-route", managed: true, startMarker: AGENT_ROUTE_START, endMarker: AGENT_ROUTE_END })
    );
  }

  actions.push(writeManifest(root, { dryRun }));
  return actions;
}
