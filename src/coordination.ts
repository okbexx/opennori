import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { OpenNoriError } from "./errors.ts";
import { withProjectRuntimeLock } from "./exclusive-lock.ts";
import { findFoundationProjectRoot } from "./hook-context.ts";
import { nowIso, posixRelative, readJson, safeProjectPath, writeJsonAtomic } from "./io.ts";
import { isFoundationProject } from "./project.ts";
import { findTask, loadCurrentTask } from "./task.ts";
import { withTaskLock } from "./task-lock.ts";
import type { CoordinationBinding, CoordinationBindingView, TaskRecord } from "./types.ts";
import { assertSchema } from "./validation.ts";

const COORDINATION_NOTICE =
  "Worker observations do not change Task stage, prove Outcomes, or replace host-native coordination state.";

export type CodexCoordinationHookInput = {
  session_id: string;
  cwd: string;
  hook_event_name: "SubagentStart" | "SubagentStop";
  agent_id: string;
  agent_type: string;
  turn_id?: string;
};

export type AssignCoordinationInput = {
  workerRef: string;
  parentSession: string;
  role: string;
  assignment: string;
  outcomeIds?: string[];
  paths?: string[];
};

export type CoordinationList = {
  task_id: string;
  implementation_revision: number;
  bindings: CoordinationBindingView[];
  invalid_records: number;
  notice: string;
};

/** Record Codex worker lifecycle facts without changing task lifecycle state. */
export function recordCodexCoordinationHook(input: CodexCoordinationHookInput): CoordinationBinding | null {
  if (!input.session_id?.trim() || !input.cwd?.trim() || !input.agent_id?.trim()) return null;
  if (input.hook_event_name !== "SubagentStart" && input.hook_event_name !== "SubagentStop") return null;
  const root = findFoundationProjectRoot(input.cwd);
  if (!root) return null;
  const task = loadCurrentTask(root, { sessionKey: input.session_id });
  if (!task) return null;
  return input.hook_event_name === "SubagentStart"
    ? recordWorkerStart(root, task.id, input.agent_id, input.agent_type || "subagent", input.session_id)
    : recordWorkerStop(root, task.id, input.agent_id, input.agent_type || "subagent", input.session_id);
}

export function assignCoordinationWorker(root: string, taskId: string, input: AssignCoordinationInput): CoordinationBinding {
  return withCoordinationWrite(root, taskId, () => {
    const task = requireActiveTask(root, taskId);
    const workerRef = requiredText(input.workerRef, "worker reference");
    const existing = findWorkerBinding(root, taskId, workerRef, task.implementation_revision);
    const binding = existing ?? createBinding(task, workerRef, input.role, input.parentSession);
    const next: CoordinationBinding = {
      ...binding,
      role: requiredText(input.role, "worker role"),
      assignment: requiredText(input.assignment, "worker assignment"),
      outcome_ids: uniqueValues(input.outcomeIds ?? []),
      paths: normalizePaths(root, input.paths ?? []),
      updated_at: nowIso()
    };
    return writeBindingIfChanged(root, next, binding);
  });
}

export function recordCoordinationContact(root: string, taskId: string, workerRef: string): CoordinationBinding {
  return updateExistingBinding(root, taskId, workerRef, (binding, timestamp) => ({
    ...binding,
    last_contact_at: timestamp,
    updated_at: timestamp
  }));
}

export function recordCoordinationInterruption(root: string, taskId: string, workerRef: string): CoordinationBinding {
  return updateExistingBinding(root, taskId, workerRef, (binding, timestamp) => ({
    ...binding,
    interrupted_at: timestamp,
    updated_at: timestamp
  }));
}

export function listCoordinationBindings(root: string, taskId: string): CoordinationList {
  return withProjectRuntimeLock(root, `list coordination for ${taskId}`, () => {
    const location = findTask(root, taskId);
    if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`);
    const directory = coordinationDirectory(root, taskId);
    const bindings: CoordinationBindingView[] = [];
    let invalidRecords = 0;
    if (fs.existsSync(directory)) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (!entry.isFile() || entry.isSymbolicLink() || !entry.name.endsWith(".json")) continue;
        try {
          const binding = readJson<unknown>(path.join(directory, entry.name));
          assertSchema<CoordinationBinding>("coordinationBinding", binding);
          if (binding.task_id !== taskId) throw new Error("task mismatch");
          bindings.push({ ...binding, current_revision: binding.implementation_revision === location.task.implementation_revision });
        } catch {
          invalidRecords += 1;
        }
      }
    }
    bindings.sort((left, right) => right.updated_at.localeCompare(left.updated_at));
    return {
      task_id: taskId,
      implementation_revision: location.task.implementation_revision,
      bindings,
      invalid_records: invalidRecords,
      notice: COORDINATION_NOTICE
    };
  });
}

export function coordinationWorkerLabel(workerRef: string): string {
  return crypto.createHash("sha256").update(workerRef).digest("hex").slice(0, 10);
}

function recordWorkerStart(root: string, taskId: string, workerRef: string, role: string, parentSession: string): CoordinationBinding {
  return withCoordinationWrite(root, taskId, () => {
    const task = requireActiveTask(root, taskId);
    const existing = findWorkerBinding(root, taskId, workerRef, task.implementation_revision);
    if (existing?.started_at) return existing;
    const timestamp = nowIso();
    const binding = existing ?? createBinding(task, workerRef, role, parentSession);
    const next = { ...binding, started_at: timestamp, updated_at: timestamp };
    return writeBindingIfChanged(root, next, existing);
  });
}

function recordWorkerStop(root: string, taskId: string, workerRef: string, role: string, parentSession: string): CoordinationBinding {
  return withCoordinationWrite(root, taskId, () => {
    const task = requireActiveTask(root, taskId);
    const existing = findWorkerBinding(root, taskId, workerRef);
    if (existing?.stopped_at) return existing;
    const timestamp = nowIso();
    const binding = existing ?? createBinding(task, workerRef, role, parentSession);
    const next = { ...binding, stopped_at: timestamp, updated_at: timestamp };
    return writeBindingIfChanged(root, next, existing);
  });
}

function updateExistingBinding(
  root: string,
  taskId: string,
  workerRef: string,
  update: (binding: CoordinationBinding, timestamp: string) => CoordinationBinding
): CoordinationBinding {
  return withCoordinationWrite(root, taskId, () => {
    const task = requireActiveTask(root, taskId);
    const normalizedWorker = requiredText(workerRef, "worker reference");
    const existing = findWorkerBinding(root, taskId, normalizedWorker, task.implementation_revision);
    if (!existing) {
      throw new OpenNoriError("coordination_worker_unknown", "No coordination binding exists for that worker.", {
        recovery: "Record the worker assignment for the current implementation revision, then retry this observation."
      });
    }
    return writeBindingIfChanged(root, update(existing, nowIso()), existing);
  });
}

function withCoordinationWrite<T>(root: string, taskId: string, operation: () => T): T {
  return withTaskLock(root, taskId, () =>
    withProjectRuntimeLock(root, `write coordination for ${taskId}`, () => {
      if (!isFoundationProject(root)) {
        throw new OpenNoriError("coordination_project_unavailable", "OpenNori project state changed before coordination could be recorded.", {
          recovery: "Run opennori doctor before recording another worker observation."
        });
      }
      return operation();
    })
  );
}

function createBinding(task: TaskRecord, workerRef: string, role: string, parentSession: string): CoordinationBinding {
  const binding: CoordinationBinding = {
    schema_version: "opennori/coordination-binding-v1",
    task_id: task.id,
    implementation_revision: task.implementation_revision,
    platform: "codex",
    parent_session_ref: hashRef(requiredText(parentSession, "parent session")),
    worker_ref: requiredText(workerRef, "worker reference"),
    role: requiredText(role || "subagent", "worker role"),
    assignment: null,
    outcome_ids: [],
    paths: [],
    started_at: null,
    last_contact_at: null,
    interrupted_at: null,
    stopped_at: null,
    updated_at: nowIso()
  };
  assertSchema<CoordinationBinding>("coordinationBinding", binding);
  return binding;
}

function writeBindingIfChanged(
  root: string,
  next: CoordinationBinding,
  previous: CoordinationBinding | null | undefined
): CoordinationBinding {
  assertSchema<CoordinationBinding>("coordinationBinding", next);
  if (previous && JSON.stringify(previous) === JSON.stringify(next)) return previous;
  writeJsonAtomic(bindingPath(root, next), next);
  return next;
}

function findWorkerBinding(
  root: string,
  taskId: string,
  workerRef: string,
  revision?: number
): CoordinationBinding | null {
  const directory = coordinationDirectory(root, taskId);
  if (!fs.existsSync(directory)) return null;
  const matches: CoordinationBinding[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink() || !entry.name.endsWith(".json")) continue;
    try {
      const binding = readJson<unknown>(path.join(directory, entry.name));
      assertSchema<CoordinationBinding>("coordinationBinding", binding);
      if (binding.task_id === taskId && binding.worker_ref === workerRef && (revision === undefined || binding.implementation_revision === revision)) {
        matches.push(binding);
      }
    } catch {
      // Invalid host-local bindings do not become task truth or block other workers.
    }
  }
  return matches.sort((left, right) => right.implementation_revision - left.implementation_revision)[0] ?? null;
}

function requireActiveTask(root: string, taskId: string): TaskRecord {
  const location = findTask(root, taskId);
  if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`);
  if (location.archived || location.task.status === "completed") {
    throw new OpenNoriError("coordination_task_closed", `Task ${taskId} no longer accepts coordination observations.`);
  }
  return location.task;
}

function coordinationDirectory(root: string, taskId: string): string {
  return safeProjectPath(root, `.opennori/.runtime/coordination/${taskId}`);
}

function bindingPath(root: string, binding: CoordinationBinding): string {
  const key = crypto
    .createHash("sha256")
    .update(`${binding.implementation_revision}\u0000${binding.worker_ref}`)
    .digest("hex");
  return safeProjectPath(root, `.opennori/.runtime/coordination/${binding.task_id}/${key}.json`);
}

function normalizePaths(root: string, values: string[]): string[] {
  return uniqueValues(values).map((value) => {
    const normalized = posixRelative(root, safeProjectPath(root, requiredText(value, "coordination path")));
    return normalized || ".";
  });
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new OpenNoriError("coordination_input_invalid", `Coordination ${label} is required.`);
  return normalized;
}

function hashRef(value: string): string {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}
