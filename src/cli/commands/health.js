import path from "node:path";
import { defineCommand } from "citty";
import { currentGap, fail, findActivePairs, ok, readJson } from "../../core.js";
import {
  applyUninstallActions,
  applyUpgradeActions,
  bootstrap,
  buildInstallPlan,
  buildManifest,
  buildUninstallActions,
  buildUninstallPlan,
  buildUpgradePlan,
  installActions,
  safeReadManifest,
  upgradeActions,
  writeManifest
} from "../../lifecycle.js";
import { runJsonCommand } from "../runtime.js";

export function bootstrapResult({ root, confirmed = false }) {
  return bootstrap(path.resolve(String(root || process.cwd())), { confirmed: Boolean(confirmed) });
}

export function installResult({
  root,
  dryRun = false,
  force = false,
  confirmed = false,
  requestedSkill = false,
  refreshSkill = false,
  mergeAgentRoute = false
}) {
  const projectRoot = path.resolve(String(root || process.cwd()));
  if ((force || refreshSkill || mergeAgentRoute) && !dryRun && !confirmed) {
    const previewFlags = [
      "--dry-run",
      force ? "--force" : null,
      requestedSkill ? "--skill" : null,
      refreshSkill ? "--refresh-skill" : null,
      mergeAgentRoute ? "--merge-agent-route" : null,
      "--json"
    ].filter(Boolean).join(" ");
    return fail(
      "confirm_required",
      "Install may update existing OpenNori-managed project assets.",
      `Run opennori install --root <project> ${previewFlags} first, then rerun with --confirm if the planned updates are acceptable.`
    );
  }

  const actions = installActions(projectRoot, { dryRun, force, requestedSkill, refreshSkill, mergeAgentRoute });
  const manifestAction = actions.find((action) => action.kind === "manifest");
  const installPlan = buildInstallPlan(projectRoot, actions, { dryRun, force, requestedSkill, refreshSkill, mergeAgentRoute });
  return ok({
    root: projectRoot,
    dry_run: dryRun,
    force,
    confirmed,
    install_plan: installPlan,
    actions: installPlan.actions,
    manifest: manifestAction.manifest
  });
}

export function uninstallResult({
  root,
  dryRun = false,
  confirmed = false,
  includeState = false
}) {
  const projectRoot = path.resolve(String(root || process.cwd()));
  const actions = buildUninstallActions(projectRoot, { includeState });
  const uninstallPlan = buildUninstallPlan(projectRoot, actions, { dryRun, includeState });

  if (!dryRun && !confirmed) {
    return fail(
      "confirm_required",
      "Uninstall removes OpenNori-managed project assets.",
      "Run opennori uninstall --root <project> --dry-run --json first, then rerun with --confirm if the planned removals are acceptable."
    );
  }

  if (!dryRun) {
    applyUninstallActions(actions);
  }

  return ok({
    root: projectRoot,
    dry_run: dryRun,
    confirmed,
    include_state: includeState,
    uninstall_plan: uninstallPlan,
    actions: uninstallPlan.actions
  });
}

export function upgradeResult({
  root,
  dryRun = false,
  confirmed = false,
  requestedSkill = false,
  mergeAgentRoute = false
}) {
  const projectRoot = path.resolve(String(root || process.cwd()));
  const actions = upgradeActions(projectRoot, { requestedSkill, mergeAgentRoute });
  const upgradePlan = buildUpgradePlan(projectRoot, actions, { dryRun, requestedSkill, mergeAgentRoute });

  if (!dryRun && !confirmed) {
    return fail(
      "confirm_required",
      "Upgrade refreshes OpenNori manifest, protocol, and optionally Skill Pack assets.",
      "Run opennori upgrade --root <project> --dry-run --json first, then rerun with --confirm if the planned updates are acceptable."
    );
  }

  if (!dryRun && actions.some((action) => action.action === "missing")) {
    return fail(
      "install_required",
      "Upgrade found missing OpenNori entry assets.",
      "Run opennori install --root <project> --dry-run --json before upgrading missing assets."
    );
  }

  if (!dryRun) {
    applyUpgradeActions(actions);
    writeManifest(projectRoot);
  }

  const nextActions = dryRun
    ? ["Review the upgrade plan, then rerun with --confirm if the planned updates are acceptable."]
    : ["Run opennori check --root <project> --json to audit existing active Nori Contracts for underspecified ACs before continuing work."];

  return ok({
    root: projectRoot,
    dry_run: dryRun,
    confirmed,
    upgrade_plan: upgradePlan,
    actions: upgradePlan.actions,
    manifest: dryRun ? buildManifest(projectRoot) : safeReadManifest(projectRoot)
  }, [], [], nextActions);
}

export const bootstrapCommand = defineCommand({
  meta: {
    name: "bootstrap",
    description: "Prepare OpenNori project assets with preview-first setup."
  },
  args: {
    root: {
      type: "string",
      description: "Project root.",
      default: process.cwd()
    },
    confirm: {
      type: "boolean",
      description: "Apply setup actions after preview.",
      default: false
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args }) {
    return bootstrapResult({ root: args.root, confirmed: args.confirm });
  }
});

export async function runBootstrapCommand(rawArgs) {
  return runJsonCommand(bootstrapCommand, rawArgs);
}

export const installCommand = defineCommand({
  meta: {
    name: "install",
    description: "Install or refresh OpenNori project assets with preview-first safety."
  },
  args: {
    root: {
      type: "string",
      description: "Project root.",
      default: process.cwd()
    },
    skill: {
      type: "boolean",
      description: "Install the OpenNori Skill Pack.",
      default: false
    },
    refreshSkill: {
      type: "boolean",
      description: "Refresh installed OpenNori Skills.",
      default: false
    },
    mergeAgentRoute: {
      type: "boolean",
      description: "Merge the OpenNori agent route into AGENTS.md and CLAUDE.md.",
      default: false
    },
    dryRun: {
      type: "boolean",
      description: "Preview planned changes without writing files.",
      default: false
    },
    force: {
      type: "boolean",
      description: "Overwrite managed OpenNori assets after confirmation.",
      default: false
    },
    confirm: {
      type: "boolean",
      description: "Apply update or overwrite actions after preview.",
      default: false
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args }) {
    return installResult({
      root: args.root,
      dryRun: Boolean(args.dryRun),
      force: Boolean(args.force),
      confirmed: Boolean(args.confirm),
      requestedSkill: Boolean(args.skill),
      refreshSkill: Boolean(args.refreshSkill),
      mergeAgentRoute: Boolean(args.mergeAgentRoute)
    });
  }
});

export async function runInstallCommand(rawArgs) {
  return runJsonCommand(installCommand, rawArgs);
}

export const uninstallCommand = defineCommand({
  meta: {
    name: "uninstall",
    description: "Remove OpenNori managed project assets with preview-first safety."
  },
  args: {
    root: {
      type: "string",
      description: "Project root.",
      default: process.cwd()
    },
    includeState: {
      type: "boolean",
      description: "Also remove the .opennori state directory after confirmation.",
      default: false
    },
    dryRun: {
      type: "boolean",
      description: "Preview planned removals without deleting files.",
      default: false
    },
    confirm: {
      type: "boolean",
      description: "Apply removals after preview.",
      default: false
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args }) {
    return uninstallResult({
      root: args.root,
      dryRun: Boolean(args.dryRun),
      confirmed: Boolean(args.confirm),
      includeState: Boolean(args.includeState)
    });
  }
});

export async function runUninstallCommand(rawArgs) {
  return runJsonCommand(uninstallCommand, rawArgs);
}

export const upgradeCommand = defineCommand({
  meta: {
    name: "upgrade",
    description: "Refresh OpenNori manifest, protocol, and optional Skill Pack assets."
  },
  args: {
    root: {
      type: "string",
      description: "Project root.",
      default: process.cwd()
    },
    skill: {
      type: "boolean",
      description: "Refresh installed OpenNori Skills.",
      default: false
    },
    refreshSkill: {
      type: "boolean",
      description: "Alias for --skill.",
      default: false
    },
    mergeAgentRoute: {
      type: "boolean",
      description: "Merge the OpenNori agent route into AGENTS.md and CLAUDE.md.",
      default: false
    },
    dryRun: {
      type: "boolean",
      description: "Preview planned updates without writing files.",
      default: false
    },
    confirm: {
      type: "boolean",
      description: "Apply updates after preview.",
      default: false
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args }) {
    return upgradeResult({
      root: args.root,
      dryRun: Boolean(args.dryRun),
      confirmed: Boolean(args.confirm),
      requestedSkill: Boolean(args.skill || args.refreshSkill),
      mergeAgentRoute: Boolean(args.mergeAgentRoute)
    });
  }
});

export async function runUpgradeCommand(rawArgs) {
  return runJsonCommand(upgradeCommand, rawArgs);
}

export const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List recoverable active OpenNori goals."
  },
  args: {
    root: {
      type: "string",
      description: "Project root.",
      default: process.cwd()
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    const activeGoals = findActivePairs(root).map((pair) => {
      const payload = readJson(pair.evidencePath);
      return {
        goal_id: pair.goalId,
        status: payload.ledger?.status || "unknown",
        current_gap: currentGap(payload.contract, payload.ledger),
        acceptance_path: pair.acceptancePath,
        evidence_path: pair.evidencePath
      };
    });
    return ok({ root, active_goals: activeGoals });
  }
});

export async function runListCommand(rawArgs) {
  return runJsonCommand(listCommand, rawArgs);
}
