/** Stable project lifecycle entrypoint for OpenNori integrations. */
export { OPENNORI_API_VERSION } from "../api-version.ts";
export { OpenNoriError, asOpenNoriError } from "../errors.ts";
export { doctorProject } from "../doctor.ts";
export { applyStateMigration, inferProjectStateSchema, planStateMigration } from "../migration.ts";
export {
  applyLifecyclePlan,
  initProject,
  planInit,
  planManifestRepair,
  planUninstall,
  planUpdate,
  repairProjectManifest,
  uninstallProject,
  updateProject
} from "../lifecycle.ts";
export {
  CURRENT_STATE_SCHEMA_VERSION,
  createProjectConfig,
  currentProductVersion,
  readInstallManifest,
  readProjectConfig,
  requireCurrentStateSchema
} from "../project.ts";
export type {
  AssetInspection,
  AssetInspectionStatus,
  InitOptions,
  LifecycleRunResult,
  RepairOptions,
  UninstallOptions,
  UpdateOptions
} from "../lifecycle.ts";
export type {
  DoctorCheck,
  DoctorResult,
  InstallManifest,
  LifecycleAction,
  LifecyclePlan,
  ManagedAsset,
  OwnershipRecord,
  PlatformId,
  ProjectConfig,
  StateMigrationPlan
} from "../types.ts";
