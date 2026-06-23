export { bootstrap } from "./lifecycle/bootstrap.ts";
export { writeContextExportArtifact } from "./lifecycle/context-export-artifact.ts";
export { buildContextExport } from "./lifecycle/context-export.ts";
export { doctor } from "./lifecycle/doctor.ts";
export { goalReviewState } from "./lifecycle/goal-review-state.ts";
export { installActions } from "./lifecycle/install.ts";
export {
  buildManifest,
  refreshManifest,
  safeReadManifest,
  writeManifest
} from "./lifecycle/manifest.ts";
export {
  buildInstallPlan,
  buildUninstallPlan,
  buildUpgradePlan
} from "./lifecycle/plans.ts";
export {
  autoProfileChecks,
  recordAutoProfileChecks
} from "./lifecycle/profile-checks.ts";
export { applyUninstallActions, buildUninstallActions } from "./lifecycle/uninstall.ts";
export { applyUpgradeActions, upgradeActions } from "./lifecycle/upgrade.ts";
export { buildPluginSyncPlan, syncPlugin } from "./lifecycle/plugin-sync.ts";
export { buildSetupPlan, setup } from "./lifecycle/setup.ts";
