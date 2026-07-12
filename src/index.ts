export { OpenNoriError, asOpenNoriError } from "./errors.ts";
export { OPENNORI_API_VERSION } from "./api-version.ts";
export { doctorProject } from "./doctor.ts";
export { applyStateMigration, inferProjectStateSchema, planStateMigration } from "./migration.ts";
export {
  addProjectPlatform,
  applyLifecyclePlan,
  initProject,
  planInit,
  planManifestRepair,
  planPlatformAdd,
  planUninstall,
  planUpdate,
  repairProjectManifest,
  uninstallProject,
  updateProject
} from "./lifecycle.ts";
export {
  CURRENT_STATE_SCHEMA_VERSION,
  createProjectConfig,
  currentProductVersion,
  readInstallManifest,
  readProjectConfig,
  requireCurrentStateSchema
} from "./project.ts";
export {
  archiveTask,
  blockTask,
  createTask,
  findTask,
  finishTask,
  listTasks,
  loadCurrentTask,
  loadTask,
  loadTaskView,
  replanTask,
  reviewTask,
  selectTask,
  startTask,
  taskNextAction,
  unblockTask
} from "./task.ts";
export { approveContract, loadContract, writeContractDraft } from "./contract.ts";
export { appendEvidence, loadEvidence, outcomeStatuses, requiredOutcomesComplete, runCommandEvidence } from "./evidence.ts";
export { loadContextBundle, loadContextFiles, loadContextManifest, writeContextManifest } from "./context.ts";
export { deliveryReady, loadDelivery } from "./delivery-state.ts";
export { finalizeTaskDelivery, planTaskDelivery, recordTaskDelivery } from "./delivery.ts";
export { buildCompletionSummary, renderCompletionSummary, renderTaskReport, writeTaskReport } from "./report.ts";
export { inspectGlobalCli, inspectPlatformHost, setupHost } from "./setup.ts";
export type {
  AssetInspection,
  AssetInspectionStatus,
  InitOptions,
  LifecycleRunResult,
  PlatformAddOptions,
  RepairOptions,
  UninstallOptions,
  UpdateOptions
} from "./lifecycle.ts";
export type { CreateTaskInput, ListTasksOptions, SessionOptions, TaskLocation } from "./task.ts";
export type { DeliveryPlanInput, DeliveryRecordInput, FinalizedDelivery } from "./delivery.ts";
export type { CommandEvidenceInput, EvidenceInput } from "./evidence.ts";
export type { CompletionOutcomeSummary, CompletionSummary, JournalEntry } from "./report.ts";
export type { GlobalCliInspection, HostCommandOptions, HostCommandResult, HostCommandRunner, HostSetupResult } from "./setup.ts";
export type * from "./types.ts";
