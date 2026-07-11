import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultHostCommandRunner, type HostCommandResult, type HostCommandRunner } from "./host-command.ts";
import type { EvidenceRecord, NoriContract, TaskRecord } from "./types.ts";
import { assertSchema } from "./validation.ts";

const DEFAULT_TIMESTAMP = "2025-01-01T00:00:00.000Z";
const SAFE_PREFIX = /^[a-zA-Z0-9][a-zA-Z0-9._-]*-$/;

/** Build a complete task record and reject overrides that violate the public schema. */
export function buildTaskRecord(overrides: Partial<TaskRecord> = {}): TaskRecord {
  const task: TaskRecord = {
    schema_version: "opennori/task-v2",
    id: "2025-01-01-example-task",
    title: "Example task",
    description: "A schema-valid OpenNori task fixture.",
    status: "planning",
    implementation_revision: 1,
    priority: "P2",
    creator: "OpenNori Test",
    delivery_required: true,
    package: null,
    blocker: null,
    created_at: DEFAULT_TIMESTAMP,
    updated_at: DEFAULT_TIMESTAMP,
    completed_at: null,
    ...overrides
  };
  assertSchema<TaskRecord>("task", task);
  return task;
}

/** Build a draft Contract and reject overrides that violate the public schema. */
export function buildContract(overrides: Partial<NoriContract> = {}): NoriContract {
  const contract: NoriContract = {
    schema_version: "opennori/contract-v1",
    task_id: "2025-01-01-example-task",
    goal: "Complete the example task.",
    status: "draft",
    outcomes: [
      {
        id: "outcome-example",
        statement: "The example outcome is complete.",
        verification: "Run the integration check.",
        required: true
      }
    ],
    assumptions: [],
    approval: null,
    updated_at: DEFAULT_TIMESTAMP,
    ...overrides
  };
  assertSchema<NoriContract>("contract", contract);
  return contract;
}

/** Build an Evidence record and reject overrides that violate the public schema. */
export function buildEvidenceRecord(overrides: Partial<EvidenceRecord> = {}): EvidenceRecord {
  const evidence: EvidenceRecord = {
    schema_version: "opennori/evidence-v1",
    id: "evidence-example",
    task_id: "2025-01-01-example-task",
    outcome_id: "outcome-example",
    result: "proven",
    implementation_revision: 1,
    summary: "The integration check passed.",
    sources: [
      {
        type: "command",
        command: "npm test",
        exit_code: 0,
        stdout: "passed",
        stderr: ""
      }
    ],
    recorded_at: DEFAULT_TIMESTAMP,
    ...overrides
  };
  assertSchema<EvidenceRecord>("evidence", evidence);
  return evidence;
}

export type HostCommandCall = {
  command: string;
  args: readonly string[];
  cwd: string;
};

export type HostCommandResponder = (call: HostCommandCall) => HostCommandResult;

export type RecordingHostCommandRunner = {
  runner: HostCommandRunner;
  calls: HostCommandCall[];
  clear(): void;
};

/** Create an injectable host runner that records immutable command arguments. */
export function createRecordingHostCommandRunner(
  responder: HostCommandResponder = () => ({ status: 0, stdout: "", stderr: "" })
): RecordingHostCommandRunner {
  const calls: HostCommandCall[] = [];
  return {
    calls,
    runner(command, args, cwd) {
      const call = { command, args: [...args], cwd };
      calls.push(call);
      return responder(call);
    },
    clear() {
      calls.length = 0;
    }
  };
}

export type TemporaryGitProjectOptions = {
  prefix?: string;
  initialBranch?: string;
  userName?: string;
  userEmail?: string;
  runner?: HostCommandRunner;
};

export type TemporaryGitProject = {
  root: string;
  runGit(args: readonly string[]): string;
  cleanup(): void;
};

/** Create an isolated Git repository using the official Git CLI and return an idempotent cleanup handle. */
export function createTemporaryGitProject(options: TemporaryGitProjectOptions = {}): TemporaryGitProject {
  const prefix = options.prefix ?? "opennori-test-";
  if (!SAFE_PREFIX.test(prefix)) {
    throw new Error("Temporary Git project prefix must be a simple name ending in a hyphen.");
  }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const runner = options.runner ?? defaultHostCommandRunner;
  const runGit = (args: readonly string[]): string => {
    const result = runner("git", args, root);
    if (result.error || result.status !== 0) {
      throw new Error(
        `git ${args.join(" ")} failed in temporary project (exit ${result.status ?? "unknown"}): ${result.stderr.trim() || result.error?.message || "no error output"}`
      );
    }
    return result.stdout.trim();
  };
  try {
    runGit(["init", "--initial-branch", options.initialBranch ?? "main"]);
    runGit(["config", "user.name", options.userName ?? "OpenNori Test"]);
    runGit(["config", "user.email", options.userEmail ?? "opennori-test@example.invalid"]);
  } catch (error) {
    fs.rmSync(root, { recursive: true, force: true });
    throw error;
  }
  return {
    root,
    runGit,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
}
