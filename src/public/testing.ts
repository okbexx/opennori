/** Stable test-kit entrypoint for downstream OpenNori integrations. */
export { OPENNORI_API_VERSION } from "../api-version.ts";
export { OpenNoriError, asOpenNoriError } from "../errors.ts";
export type { HostCommandOptions, HostCommandResult, HostCommandRunner } from "../host-command.ts";
export {
  buildContract,
  buildEvidenceRecord,
  buildTaskRecord,
  createRecordingHostCommandRunner,
  createTemporaryGitProject
} from "../testing.ts";
export type {
  HostCommandCall,
  HostCommandResponder,
  RecordingHostCommandRunner,
  TemporaryGitProject,
  TemporaryGitProjectOptions
} from "../testing.ts";
