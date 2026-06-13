import path from "node:path";

const WRITING_INSTALL_ACTIONS = new Set(["create", "overwrite", "update", "merge"]);
const WRITING_UNINSTALL_ACTIONS = new Set(["delete", "delete-tree"]);
const WRITING_UPGRADE_ACTIONS = new Set(["update", "overwrite", "merge"]);

function relativeTo(root, filePath) {
  return path.relative(root, filePath) || ".";
}

function installActionReason(action, kind) {
  if (action === "create") return `Missing OpenNori ${kind} will be created.`;
  if (action === "exists") return `Required OpenNori ${kind} already exists.`;
  if (action === "skip") return `Existing OpenNori ${kind} is not overwritten without --force.`;
  if (action === "overwrite") return `Existing OpenNori ${kind} will be overwritten because --force was provided.`;
  if (action === "merge") return `OpenNori ${kind} section will be merged without replacing existing project content.`;
  if (action === "update") return `OpenNori ${kind} will be refreshed from current project state.`;
  return `OpenNori ${kind} action: ${action}.`;
}

function enrichInstallAction(root, action, { dryRun = false } = {}) {
  const wouldWrite = WRITING_INSTALL_ACTIONS.has(action.action);
  return {
    path: relativeTo(root, action.path),
    kind: action.kind || "file",
    action: action.action,
    managed: action.managed !== false,
    would_write: wouldWrite,
    will_write: wouldWrite && !dryRun,
    destructive: action.action === "overwrite",
    reason: action.reason || installActionReason(action.action, action.kind || "file")
  };
}

function summarizeInstallPlan(actions) {
  const byAction = {};
  for (const action of actions) {
    byAction[action.action] = (byAction[action.action] || 0) + 1;
  }
  return {
    total: actions.length,
    by_action: byAction,
    would_write: actions.filter((action) => action.would_write).length,
    will_write: actions.filter((action) => action.will_write).length,
    destructive: actions.filter((action) => action.destructive).length,
    managed: actions.filter((action) => action.managed).length
  };
}

export function buildInstallPlan(root, actions, { dryRun = false, force = false, requestedSkill = false, refreshSkill = false, mergeAgentRoute = false } = {}) {
  const enrichedActions = actions.map((action) => enrichInstallAction(root, action, { dryRun }));
  return {
    schema_version: "opennori/install-plan-v1",
    root,
    dry_run: dryRun,
    force,
    requested_skill: requestedSkill,
    refresh_skill: refreshSkill,
    merge_agent_route: mergeAgentRoute,
    summary: summarizeInstallPlan(enrichedActions),
    actions: enrichedActions
  };
}

function uninstallActionReason(action, kind) {
  if (action === "delete") return `Existing OpenNori ${kind} will be removed.`;
  if (action === "delete-tree") return `Existing OpenNori ${kind} and its contents will be removed.`;
  if (action === "absent") return `OpenNori ${kind} is already absent.`;
  if (action === "preserve") return `OpenNori ${kind} is preserved by default.`;
  return `OpenNori ${kind} action: ${action}.`;
}

function enrichUninstallAction(root, action, { dryRun = false } = {}) {
  const wouldWrite = WRITING_UNINSTALL_ACTIONS.has(action.action);
  return {
    path: relativeTo(root, action.path),
    kind: action.kind || "file",
    action: action.action,
    managed: action.managed !== false,
    would_write: wouldWrite,
    will_write: wouldWrite && !dryRun,
    destructive: wouldWrite,
    recursive: Boolean(action.recursive),
    reason: action.reason || uninstallActionReason(action.action, action.kind || "file")
  };
}

function summarizeUninstallPlan(actions) {
  const byAction = {};
  for (const action of actions) {
    byAction[action.action] = (byAction[action.action] || 0) + 1;
  }
  return {
    total: actions.length,
    by_action: byAction,
    would_write: actions.filter((action) => action.would_write).length,
    will_write: actions.filter((action) => action.will_write).length,
    destructive: actions.filter((action) => action.destructive).length,
    preserved: actions.filter((action) => action.action === "preserve").length,
    managed: actions.filter((action) => action.managed).length
  };
}

export function buildUninstallPlan(root, actions, { dryRun = false, includeState = false } = {}) {
  const enrichedActions = actions.map((action) => enrichUninstallAction(root, action, { dryRun }));
  return {
    schema_version: "opennori/uninstall-plan-v1",
    root,
    dry_run: dryRun,
    include_state: includeState,
    summary: summarizeUninstallPlan(enrichedActions),
    actions: enrichedActions
  };
}

function upgradeActionReason(action, kind) {
  if (action === "current") return `OpenNori ${kind} is already current.`;
  if (action === "update") return `OpenNori ${kind} will be refreshed to the current CLI version.`;
  if (action === "overwrite") return `OpenNori ${kind} will be overwritten to refresh generated OpenNori assets.`;
  if (action === "merge") return `OpenNori ${kind} section will be merged without replacing existing project content.`;
  if (action === "missing") return `OpenNori ${kind} is missing; run install before upgrade.`;
  return `OpenNori ${kind} action: ${action}.`;
}

function enrichUpgradeAction(root, action, { dryRun = false } = {}) {
  const wouldWrite = WRITING_UPGRADE_ACTIONS.has(action.action);
  return {
    path: relativeTo(root, action.path),
    kind: action.kind || "file",
    action: action.action,
    managed: action.managed !== false,
    would_write: wouldWrite,
    will_write: wouldWrite && !dryRun,
    destructive: action.action === "overwrite",
    from_version: action.from_version,
    to_version: action.to_version,
    reason: action.reason || upgradeActionReason(action.action, action.kind || "file")
  };
}

function summarizeUpgradePlan(actions) {
  const byAction = {};
  for (const action of actions) {
    byAction[action.action] = (byAction[action.action] || 0) + 1;
  }
  return {
    total: actions.length,
    by_action: byAction,
    would_write: actions.filter((action) => action.would_write).length,
    will_write: actions.filter((action) => action.will_write).length,
    destructive: actions.filter((action) => action.destructive).length,
    managed: actions.filter((action) => action.managed).length
  };
}

export function buildUpgradePlan(root, actions, { dryRun = false, requestedSkill = false, mergeAgentRoute = false } = {}) {
  const enrichedActions = actions.map((action) => enrichUpgradeAction(root, action, { dryRun }));
  return {
    schema_version: "opennori/upgrade-plan-v1",
    root,
    dry_run: dryRun,
    requested_skill: requestedSkill,
    merge_agent_route: mergeAgentRoute,
    summary: summarizeUpgradePlan(enrichedActions),
    actions: enrichedActions
  };
}

export function isWritingUpgradeAction(action) {
  return WRITING_UPGRADE_ACTIONS.has(action);
}
