import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadContract } from "./contract.ts";
import { OpenNoriError } from "./errors.ts";
import { defaultHostCommandRunner, type HostCommandRunner } from "./host-command.ts";
import { appendJsonLine, normalizeText, nowIso, posixRelative, readJson, readJsonLines, safeProjectPath } from "./io.ts";
import type {
  OutcomeStatus,
  EvidenceRecord,
  EvidenceResult,
  EvidenceSource,
  NoriContract,
  TaskRecord
} from "./types.ts";
import { withTaskLock } from "./task-lock.ts";
import { assertSchema } from "./validation.ts";

const EVIDENCE_FILE = "evidence.jsonl";
const MAX_EVIDENCE_OUTPUT_CHARS = 256 * 1024;
const EVIDENCE_COMMAND_BUFFER_BYTES = MAX_EVIDENCE_OUTPUT_CHARS * 4;
const DEFAULT_EVIDENCE_TIMEOUT_MS = 10 * 60 * 1000;

export type EvidenceInput = {
  outcome_id: string;
  result: EvidenceResult;
  summary: string;
  sources: EvidenceSource[];
};

export type CommandEvidenceInput = {
  outcome_id: string;
  summary: string;
  command: string;
  args: string[];
  cwd?: string;
  timeout_ms?: number;
};

export function evidencePath(taskDirectory: string): string {
  return path.join(taskDirectory, EVIDENCE_FILE);
}

export function loadEvidence(taskDirectory: string, taskId?: string, contract?: NoriContract): EvidenceRecord[] {
  const records = readJsonLines<EvidenceRecord>(evidencePath(taskDirectory));
  const knownOutcomes = contract ? new Set(contract.outcomes.map((outcome) => outcome.id)) : null;
  const ids = new Set<string>();
  for (const record of records) {
    assertSchema<EvidenceRecord>("evidence", record);
    if (ids.has(record.id)) {
      throw new OpenNoriError("duplicate_evidence", `Evidence log contains duplicate id ${record.id}.`);
    }
    ids.add(record.id);
    if (taskId && record.task_id !== taskId) {
      throw new OpenNoriError("evidence_task_mismatch", `Evidence ${record.id} belongs to ${record.task_id}, not ${taskId}.`);
    }
    if (knownOutcomes && !knownOutcomes.has(record.outcome_id)) {
      throw new OpenNoriError("evidence_outcome_unknown", `Evidence ${record.id} refers to unknown Outcome ${record.outcome_id}.`);
    }
  }
  return records;
}

/** Append one immutable evidence fact. Latest Outcome state is projected from log order. */
export function appendEvidence(
  root: string,
  taskDirectory: string,
  task: TaskRecord,
  contract: NoriContract,
  input: EvidenceInput
): EvidenceRecord {
  return withTaskLock(root, task.id, () => appendEvidenceUnlocked(root, taskDirectory, task, contract, input));
}

/** Execute one command without a shell and append its observed result as Evidence. */
export function runCommandEvidence(
  root: string,
  taskDirectory: string,
  task: TaskRecord,
  contract: NoriContract,
  input: CommandEvidenceInput,
  runner: HostCommandRunner = defaultHostCommandRunner
): EvidenceRecord {
  const command = input.command.trim();
  if (!Array.isArray(input.args) || !command || command.includes("\0") || input.args.some((argument) => argument.includes("\0"))) {
    throw new OpenNoriError("evidence_command_invalid", "Evidence command and arguments must be non-empty text without NUL bytes.");
  }
  const summary = input.summary.trim();
  if (!summary) throw new OpenNoriError("evidence_empty_text", "Evidence summary cannot be blank.");
  const timeoutMs = input.timeout_ms ?? DEFAULT_EVIDENCE_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60 * 60 * 1000) {
    throw new OpenNoriError("evidence_timeout_invalid", "Evidence command timeout must be between 1 and 3600 seconds.");
  }

  const relativeCwd = input.cwd?.trim() || ".";
  const cwd = safeProjectPath(root, relativeCwd);
  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    throw new OpenNoriError("evidence_cwd_invalid", `Evidence command working directory is not a project directory: ${relativeCwd}.`, {
      context: { cwd: relativeCwd },
      recovery: "Pass a project-relative directory with --cwd, or omit --cwd to use the project root."
    });
  }

  const implementationRevision = withTaskLock(root, task.id, () =>
    requireEvidenceState(taskDirectory, task, contract, input.outcome_id).task.implementation_revision
  );
  const argv = [command, ...input.args];
  const renderedCommand = renderCommand(argv);
  const relativeCommandCwd = posixRelative(root, cwd) || ".";
  assertSchema<EvidenceInput>("evidenceInput", {
    outcome_id: input.outcome_id,
    result: "proven",
    summary,
    sources: [
      {
        type: "command",
        command: renderedCommand,
        exit_code: 0,
        stdout: "",
        stderr: "",
        argv,
        cwd: relativeCommandCwd
      }
    ]
  });
  const result = runner(command, input.args, cwd, {
    maxBuffer: EVIDENCE_COMMAND_BUFFER_BYTES,
    timeoutMs
  });
  if (result.error || result.status === null) {
    const errorCode = (result.error as NodeJS.ErrnoException | undefined)?.code;
    throw new OpenNoriError("evidence_command_unavailable", `Evidence command did not produce a numeric exit code: ${command}.`, {
      context: {
        command,
        ...(errorCode ? { error_code: errorCode } : {}),
        ...(result.signal ? { signal: result.signal } : {})
      },
      recovery:
        errorCode === "ETIMEDOUT"
          ? "Run a focused check or increase --timeout, then retry."
          : errorCode === "ENOBUFS"
            ? "Run a focused check with bounded output, or save detailed output as a project artifact."
            : "Verify that the executable is available on PATH and can run from the selected project directory."
    });
  }
  const exitCode = result.status;
  const stdout = normalizeText(result.stdout);
  const stderr = normalizeText(result.stderr);
  if (stdout.length > MAX_EVIDENCE_OUTPUT_CHARS || stderr.length > MAX_EVIDENCE_OUTPUT_CHARS) {
    throw new OpenNoriError("evidence_command_output_too_large", "Evidence command output exceeds 256 KiB.", {
      context: { stdout_chars: stdout.length, stderr_chars: stderr.length, limit: MAX_EVIDENCE_OUTPUT_CHARS },
      recovery: "Run a focused check with bounded output, or save detailed output as a project artifact."
    });
  }

  return withTaskLock(root, task.id, () => {
    const latestTask = loadCanonicalTask(taskDirectory, task.id);
    if (latestTask.implementation_revision !== implementationRevision) {
      throw new OpenNoriError(
        "evidence_revision_changed",
        `Task ${task.id} changed implementation revision while the Evidence command was running.`,
        {
          context: {
            started_revision: implementationRevision,
            current_revision: latestTask.implementation_revision
          },
          recovery: "Reload Verify context and rerun the command against the current implementation revision."
        }
      );
    }
    const current = requireEvidenceState(taskDirectory, latestTask, contract, input.outcome_id);
    return appendEvidenceUnlocked(root, taskDirectory, current.task, current.contract, {
      outcome_id: input.outcome_id,
      result: exitCode === 0 ? "proven" : "failed",
      summary,
      sources: [
        {
          type: "command",
          command: renderedCommand,
          exit_code: exitCode,
          stdout,
          stderr,
          argv,
          cwd: relativeCommandCwd
        }
      ]
    });
  });
}

function appendEvidenceUnlocked(
  root: string,
  taskDirectory: string,
  task: TaskRecord,
  contract: NoriContract,
  input: EvidenceInput
): EvidenceRecord {
  assertSchema<EvidenceInput>("evidenceInput", input);
  const { task: canonicalTask } = requireEvidenceState(taskDirectory, task, contract, input.outcome_id);

  const sources = input.sources.map((source) => normalizeEvidenceSource(root, source));
  if (input.result === "waived" && !sources.some((source) => source.type === "human")) {
    throw new OpenNoriError("evidence_waiver_unconfirmed", "A waived Outcome needs a human observation with a host confirmation reference.", {
      recovery: "Obtain an explicit user waiver and record the actor and stable host confirmation reference."
    });
  }

  const record: EvidenceRecord = {
    schema_version: "opennori/evidence-v1",
    id: crypto.randomUUID(),
    task_id: canonicalTask.id,
    outcome_id: input.outcome_id,
    result: input.result,
    implementation_revision: canonicalTask.implementation_revision,
    summary: input.summary.trim(),
    sources,
    recorded_at: nowIso()
  };
  assertSchema<EvidenceRecord>("evidence", record);
  if (!record.summary) {
    throw new OpenNoriError("evidence_empty_text", "Evidence summary cannot be blank.");
  }
  appendJsonLine(evidencePath(taskDirectory), record);
  return record;
}

function loadCanonicalTask(taskDirectory: string, expectedTaskId: string): TaskRecord {
  const filePath = path.join(taskDirectory, "task.json");
  if (!fs.existsSync(filePath)) {
    throw new OpenNoriError("task_state_missing", `Missing task.json at ${filePath}.`);
  }
  const task = readJson<TaskRecord>(filePath);
  assertSchema<TaskRecord>("task", task);
  if (task.id !== expectedTaskId) {
    throw new OpenNoriError("task_state_mismatch", `Canonical task is ${task.id}, not ${expectedTaskId}.`, {
      context: { expected_task_id: expectedTaskId, actual_task_id: task.id }
    });
  }
  if (task.id !== path.basename(taskDirectory)) {
    throw new OpenNoriError("task_directory_mismatch", `Task ${task.id} is stored under ${path.basename(taskDirectory)}.`);
  }
  return task;
}

function normalizeEvidenceSource(root: string, source: EvidenceSource): EvidenceSource {
  switch (source.type) {
    case "command":
      return {
        type: "command",
        command: source.command.trim(),
        exit_code: source.exit_code,
        stdout: normalizeText(source.stdout),
        stderr: normalizeText(source.stderr),
        ...(source.argv ? { argv: [...source.argv] } : {}),
        ...(source.cwd ? { cwd: source.cwd.trim() } : {})
      };
    case "artifact": {
      const relativePath = source.path.trim();
      const filePath = safeProjectPath(root, relativePath);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        throw new OpenNoriError("evidence_artifact_missing", `Evidence artifact is not a project file: ${relativePath}.`, {
          context: { path: relativePath }
        });
      }
      const content = fs.readFileSync(filePath);
      const actualBytes = content.byteLength;
      const actualHash = `sha256:${crypto.createHash("sha256").update(content).digest("hex")}`;
      if (source.bytes !== actualBytes || source.sha256 !== actualHash) {
        throw new OpenNoriError("evidence_artifact_mismatch", `Evidence artifact changed or its supplied metadata is incorrect: ${relativePath}.`, {
          context: {
            path: relativePath,
            supplied_bytes: source.bytes,
            actual_bytes: actualBytes,
            supplied_sha256: source.sha256,
            actual_sha256: actualHash
          },
          recovery: "Inspect the current artifact and record its exact byte size and SHA-256."
        });
      }
      return {
        type: "artifact",
        path: posixRelative(root, filePath),
        bytes: actualBytes,
        sha256: actualHash
      };
    }
    case "human":
      return {
        type: "human",
        actor: source.actor.trim(),
        host_confirmation_ref: source.host_confirmation_ref.trim()
      };
    case "url":
      return {
        type: "url",
        url: source.url.trim(),
        summary: source.summary.trim()
      };
  }
}

function requireEvidenceState(
  taskDirectory: string,
  expectedTask: TaskRecord,
  expectedContract: NoriContract,
  outcomeId: string
): { task: TaskRecord; contract: NoriContract } {
  const canonicalTask = loadCanonicalTask(taskDirectory, expectedTask.id);
  if (expectedContract.task_id !== canonicalTask.id) {
    throw new OpenNoriError("contract_task_mismatch", `Contract belongs to ${expectedContract.task_id}, not ${canonicalTask.id}.`);
  }
  const canonicalContract = loadContract(taskDirectory, canonicalTask.id);
  if (canonicalContract.status !== "approved") {
    throw new OpenNoriError("contract_not_approved", "Evidence cannot be recorded before contract approval.");
  }
  if (canonicalTask.status === "completed") {
    throw new OpenNoriError("task_completed", `Task ${canonicalTask.id} is completed and its Evidence is read-only.`);
  }
  if (canonicalTask.status !== "review") {
    throw new OpenNoriError(
      "evidence_not_allowed",
      `Evidence can only be appended during Verify; task ${canonicalTask.id} is ${canonicalTask.status}.`,
      {
        context: { task_id: canonicalTask.id, status: canonicalTask.status },
        recovery: "Move the implemented task to review before recording independent Outcome Evidence."
      }
    );
  }
  if (!canonicalContract.outcomes.some((outcome) => outcome.id === outcomeId)) {
    throw new OpenNoriError("outcome_not_found", `Contract ${canonicalTask.id} has no Outcome ${outcomeId}.`);
  }
  loadEvidence(taskDirectory, canonicalTask.id, canonicalContract);
  return { task: canonicalTask, contract: canonicalContract };
}

function renderCommand(argv: readonly string[]): string {
  return argv
    .map((argument) => (/^[A-Za-z0-9_./:@%+=,-]+$/.test(argument) ? argument : JSON.stringify(argument)))
    .join(" ");
}

export function outcomeStatuses(
  contract: NoriContract,
  records: readonly EvidenceRecord[],
  implementationRevision: number
): OutcomeStatus[] {
  const latest = new Map<string, EvidenceRecord>();
  for (const record of records) {
    if (record.implementation_revision === implementationRevision) latest.set(record.outcome_id, record);
  }
  return contract.outcomes.map((outcome) => {
    const evidence = latest.get(outcome.id) ?? null;
    return {
      id: outcome.id,
      statement: outcome.statement,
      required: outcome.required,
      status: evidence?.result ?? "unproven",
      latest_evidence: evidence
    };
  });
}

export function currentOutcomeGap(outcomes: readonly OutcomeStatus[]): OutcomeStatus | null {
  return outcomes.find((outcome) => outcome.required && !isCompletionResult(outcome.status)) ?? null;
}

export function requiredOutcomesComplete(outcomes: readonly OutcomeStatus[]): boolean {
  return outcomes.filter((outcome) => outcome.required).every((outcome) => isCompletionResult(outcome.status));
}

function isCompletionResult(status: OutcomeStatus["status"]): boolean {
  return status === "proven" || status === "waived";
}
