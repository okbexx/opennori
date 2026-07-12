import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadContract } from "./contract.ts";
import { deliveryReady, loadDelivery } from "./delivery-state.ts";
import { OpenNoriError } from "./errors.ts";
import { currentOutcomeGap, loadEvidence, outcomeStatuses, requiredOutcomesComplete } from "./evidence.ts";
import { withExclusiveLock, withProjectRuntimeLock } from "./exclusive-lock.ts";
import { nowIso, readJson, safeProjectPath, writeJsonAtomic } from "./io.ts";
import { readProjectConfig, requireCurrentStateSchema, resolveProjectPackage } from "./project.ts";
import type { TaskPhase, TaskRecord, TaskStatus, TaskView } from "./types.ts";
import { assertSchema } from "./validation.ts";
import { withTaskLock } from "./task-lock.ts";

const TASK_ID_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_TIMESTAMP_PATTERN =
  /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?Z$/;
const SESSION_ENV_KEYS = ["OPENNORI_SESSION_ID", "CODEX_THREAD_ID", "CLAUDE_CODE_SESSION_ID"] as const;

export type CreateTaskInput = {
  title: string;
  description?: string;
  creator: string;
  priority?: TaskRecord["priority"];
  package?: string | null;
  slug?: string;
  now?: Date;
};

export type TaskLocation = {
  task: TaskRecord;
  directory: string;
  archived: boolean;
};

export type ListTasksOptions = {
  includeArchived?: boolean;
};

export type SessionOptions = {
  sessionKey?: string;
};

export function createTask(root: string, input: CreateTaskInput): TaskLocation {
  requireCurrentStateSchema(root);
  const title = input.title.trim();
  const creator = input.creator.trim();
  if (!title || !creator) {
    throw new OpenNoriError("task_input_invalid", "Task title and creator are required.");
  }
  const date = input.now ?? new Date();
  if (Number.isNaN(date.getTime())) {
    throw new OpenNoriError("task_input_invalid", "Task creation needs a valid date.");
  }
  const packageId = resolveProjectPackage(root, readProjectConfig(root), input.package ?? undefined);
  const slug = normalizeSlug(input.slug ?? title);
  const taskId = `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}-${slug}`;
  assertTaskId(taskId);
  return withTaskLock(root, taskId, () => {
    if (findTask(root, taskId)) {
      throw new OpenNoriError("task_exists", `Task ${taskId} already exists in active or archived tasks.`, {
        recovery: "Choose a distinct task slug with --slug, then create the task again."
      });
    }

    const directory = safeProjectPath(root, `.opennori/tasks/${taskId}`);
    fs.mkdirSync(directory, { recursive: false });
    try {
      const timestamp = date.toISOString();
      const task: TaskRecord = {
        schema_version: "opennori/task-v2",
        id: taskId,
        title,
        description: (input.description ?? "").trim(),
        status: "planning",
        implementation_revision: 1,
        priority: input.priority ?? "P2",
        creator,
        delivery_required: true,
        package: packageId,
        blocker: null,
        created_at: timestamp,
        updated_at: timestamp,
        completed_at: null
      };
      writeTask(directory, task);
      fs.mkdirSync(path.join(directory, "research"));
      return { task, directory, archived: false };
    } catch (error) {
      fs.rmSync(directory, { recursive: true, force: true });
      throw error;
    }
  });
}

export function listTasks(root: string, options: ListTasksOptions = {}): TaskLocation[] {
  const locations: TaskLocation[] = [];
  const tasksRoot = tasksDirectory(root);
  if (!fs.existsSync(tasksRoot)) return locations;
  for (const entry of fs.readdirSync(tasksRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "archive") continue;
    locations.push(loadTaskDirectory(safeProjectPath(root, `.opennori/tasks/${entry.name}`), false));
  }
  if (options.includeArchived) {
    const archiveRoot = archiveDirectory(root);
    if (fs.existsSync(archiveRoot)) {
      for (const month of fs.readdirSync(archiveRoot, { withFileTypes: true })) {
        if (!month.isDirectory() || !/^\d{4}-\d{2}$/.test(month.name)) continue;
        for (const entry of fs.readdirSync(path.join(archiveRoot, month.name), { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          locations.push(
            loadTaskDirectory(safeProjectPath(root, `.opennori/tasks/archive/${month.name}/${entry.name}`), true)
          );
        }
      }
    }
  }
  return locations.sort((left, right) => right.task.created_at.localeCompare(left.task.created_at));
}

export function loadTask(root: string, taskId: string): TaskRecord {
  const location = findTask(root, taskId);
  if (!location) {
    throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`, {
      context: { task_id: taskId }
    });
  }
  return location.task;
}

export function findTask(root: string, taskId: string): TaskLocation | null {
  assertTaskId(taskId);
  const active = safeProjectPath(root, `.opennori/tasks/${taskId}`);
  if (fs.existsSync(active)) return loadTaskDirectory(active, false);
  const archiveRoot = archiveDirectory(root);
  if (!fs.existsSync(archiveRoot)) return null;
  const matches: TaskLocation[] = [];
  for (const month of fs.readdirSync(archiveRoot, { withFileTypes: true })) {
    if (!month.isDirectory() || !/^\d{4}-\d{2}$/.test(month.name)) continue;
    const candidate = safeProjectPath(root, `.opennori/tasks/archive/${month.name}/${taskId}`);
    if (fs.existsSync(candidate)) matches.push(loadTaskDirectory(candidate, true));
  }
  if (matches.length > 1) {
    throw new OpenNoriError("task_ambiguous", `Task ${taskId} appears in multiple archive months.`);
  }
  return matches[0] ?? null;
}

export function taskDirectory(root: string, taskId: string): string {
  const location = findTask(root, taskId);
  if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`);
  return location.directory;
}

export function startTask(root: string, taskId: string, options: SessionOptions = {}): TaskRecord {
  return withTaskLock(root, taskId, () => startTaskUnlocked(root, taskId, options));
}

function startTaskUnlocked(root: string, taskId: string, options: SessionOptions): TaskRecord {
  const sessionKey = requireSessionKey(options.sessionKey);
  const location = requireActiveTask(root, taskId);
  requireTaskPackage(root, location.task);
  requireUnblocked(location.task, "in_progress");
  const contract = loadContract(location.directory, taskId);
  if (contract.status !== "approved") {
    throw new OpenNoriError("contract_not_approved", `Task ${taskId} cannot start until its contract is approved.`, {
      recovery: "Review and approve contract.md, then start the task again."
    });
  }
  if (location.task.delivery_required) {
    const delivery = loadDelivery(location.directory, taskId);
    if (!delivery) {
      throw new OpenNoriError("delivery_plan_required", `Task ${taskId} needs an approved delivery boundary before implementation starts.`, {
        recovery: "Plan commit, pull request, or explicitly confirmed waiver delivery, then start the task again."
      });
    }
    if (delivery.mode === "waived" && !deliveryReady(location.task, delivery)) {
      throw new OpenNoriError("delivery_waiver_stale", `Task ${taskId} needs a current delivery waiver confirmation.`);
    }
  }
  if (location.task.status !== "planning" && location.task.status !== "in_progress" && location.task.status !== "review") {
    throw invalidTransition(location.task, "in_progress");
  }
  const task =
    location.task.status === "in_progress"
      ? location.task
      : updateTask(
          location.directory,
          location.task,
          "in_progress",
          location.task.status === "review" ? location.task.implementation_revision + 1 : location.task.implementation_revision
        );
  setSessionTask(root, sessionKey, task.id);
  return task;
}

/** Select any active task for one explicit host session without changing lifecycle state. */
export function selectTask(root: string, taskId: string, options: SessionOptions = {}): TaskRecord {
  return withTaskLock(root, taskId, () => selectTaskUnlocked(root, taskId, options));
}

function selectTaskUnlocked(root: string, taskId: string, options: SessionOptions): TaskRecord {
  const sessionKey = requireSessionKey(options.sessionKey);
  const location = requireActiveTask(root, taskId);
  setSessionTask(root, sessionKey, taskId);
  return location.task;
}

export function reviewTask(root: string, taskId: string): TaskRecord {
  return withTaskLock(root, taskId, () => reviewTaskUnlocked(root, taskId));
}

function reviewTaskUnlocked(root: string, taskId: string): TaskRecord {
  const location = requireActiveTask(root, taskId);
  requireTaskPackage(root, location.task);
  requireUnblocked(location.task, "review");
  const contract = loadContract(location.directory, taskId);
  if (contract.status !== "approved") {
    throw new OpenNoriError("contract_not_approved", `Task ${taskId} cannot enter review until its contract is approved.`);
  }
  if (location.task.status !== "in_progress" && location.task.status !== "review") {
    throw invalidTransition(location.task, "review");
  }
  return location.task.status === "review" ? location.task : updateTask(location.directory, location.task, "review");
}

export function blockTask(root: string, taskId: string, reason: string): TaskRecord {
  return withTaskLock(root, taskId, () => blockTaskUnlocked(root, taskId, reason));
}

function blockTaskUnlocked(root: string, taskId: string, reason: string): TaskRecord {
  const location = requireActiveTask(root, taskId);
  if (location.task.status === "completed") throw new OpenNoriError("task_completed", `Task ${taskId} is already completed.`);
  const blocker = reason.trim();
  if (!blocker) throw new OpenNoriError("blocker_required", "A blocked task needs a concrete reason.");
  const blocked = { ...location.task, blocker, updated_at: nextTaskTimestamp(location.task) };
  writeTask(location.directory, blocked);
  return blocked;
}

export function unblockTask(root: string, taskId: string): TaskRecord {
  return withTaskLock(root, taskId, () => unblockTaskUnlocked(root, taskId));
}

function unblockTaskUnlocked(root: string, taskId: string): TaskRecord {
  const location = requireActiveTask(root, taskId);
  if (location.task.status === "completed") throw new OpenNoriError("task_completed", `Task ${taskId} is already completed.`);
  if (!location.task.blocker) return location.task;
  const unblocked = { ...location.task, blocker: null, updated_at: nextTaskTimestamp(location.task) };
  writeTask(location.directory, unblocked);
  return unblocked;
}

/** Return implementation to Plan only while no Outcome evidence would be orphaned. */
export function replanTask(root: string, taskId: string, reason: string): TaskRecord {
  return withTaskLock(root, taskId, () => replanTaskUnlocked(root, taskId, reason));
}

function replanTaskUnlocked(root: string, taskId: string, reason: string): TaskRecord {
  const location = requireActiveTask(root, taskId);
  if (location.task.status !== "in_progress" && location.task.status !== "review") {
    throw invalidTransition(location.task, "planning");
  }
  if (loadEvidence(location.directory).length > 0) {
    throw new OpenNoriError("replan_evidence_exists", `Task ${taskId} already has Outcome evidence and cannot safely replace its Contract.`, {
      recovery: "Resolve the verified gap within the approved Contract or create a follow-up task."
    });
  }
  const blocker = reason.trim();
  if (!blocker) throw new OpenNoriError("replan_reason_required", "Replanning requires a concrete scope or Contract reason.");
  loadContract(location.directory, taskId);
  const timestamp = nextTaskTimestamp(location.task);
  const stamp = timestamp.replace(/[:.]/g, "-");
  const researchDirectory = path.join(location.directory, "research");
  fs.mkdirSync(researchDirectory, { recursive: true });
  const replanned: TaskRecord = {
    ...location.task,
    status: "planning",
    implementation_revision: location.task.implementation_revision + 1,
    blocker,
    updated_at: timestamp
  };
  const plannedMoves = ["contract.md", "design.md", "plan.md", "implement.jsonl", "check.jsonl", "contract.json", "delivery.json"]
    .map((name) => ({
      source: path.join(location.directory, name),
      target: path.join(researchDirectory, `replanned-${stamp}-${name}`)
    }))
    .filter((entry) => fs.existsSync(entry.source))
    .map((entry) => {
      const stat = fs.lstatSync(entry.source);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new OpenNoriError("replan_artifact_invalid", `Replan source is not a regular file: ${path.basename(entry.source)}.`);
      }
      if (fs.existsSync(entry.target)) {
        throw new OpenNoriError("replan_backup_conflict", `Replan research target already exists: ${path.basename(entry.target)}.`);
      }
      return { ...entry, hash: rawFileHash(entry.source) };
    });
  const moved: typeof plannedMoves = [];
  try {
    for (const entry of plannedMoves) {
      fs.renameSync(entry.source, entry.target);
      moved.push(entry);
    }
    writeTask(location.directory, replanned);
    return replanned;
  } catch (error) {
    const rollbackErrors: Array<{ path: string; cause: string }> = [];
    for (const entry of moved.reverse()) {
      try {
        if (fs.existsSync(entry.source)) throw new Error("original path was recreated");
        if (!fs.existsSync(entry.target)) throw new Error("research backup is missing");
        const stat = fs.lstatSync(entry.target);
        if (!stat.isFile() || stat.isSymbolicLink() || rawFileHash(entry.target) !== entry.hash) {
          throw new Error("research backup changed");
        }
        fs.renameSync(entry.target, entry.source);
      } catch (rollbackError) {
        rollbackErrors.push({
          path: path.basename(entry.source),
          cause: rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
        });
      }
    }
    if (rollbackErrors.length > 0) {
      throw new OpenNoriError("replan_rollback_failed", `Task ${taskId} could not restore every planning artifact after a failed replan.`, {
        context: { operation_error: error instanceof Error ? error.message : String(error), rollback_errors: rollbackErrors },
        recovery: "Inspect the task root and replanned research files, then restore the canonical Contract and contexts before continuing."
      });
    }
    throw error;
  }
}

function rawFileHash(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function finishTask(root: string, taskId: string): TaskRecord {
  return withTaskLock(root, taskId, () => finishTaskUnlocked(root, taskId));
}

function finishTaskUnlocked(root: string, taskId: string): TaskRecord {
  const location = requireActiveTask(root, taskId);
  if (location.task.status === "completed") return location.task;
  requireTaskPackage(root, location.task);
  requireUnblocked(location.task, "completed");
  if (location.task.status !== "review") throw invalidTransition(location.task, "completed");
  const view = loadTaskView(root, taskId);
  if (!view.complete) {
    throw new OpenNoriError(
      "required_evidence_incomplete",
      view.current_gap
        ? `Task ${taskId} cannot finish: ${view.current_gap.id} is ${view.current_gap.status}.`
        : `Task ${taskId} cannot finish because required evidence is incomplete.`,
      { context: { task_id: taskId, outcome_id: view.current_gap?.id, status: view.current_gap?.status } }
    );
  }
  if (!view.delivery_ready) {
    throw new OpenNoriError("delivery_incomplete", `Task ${taskId} cannot finish until its current implementation revision is delivered.`, {
      context: { task_id: taskId, implementation_revision: location.task.implementation_revision, delivery: view.delivery },
      recovery: "Commit the verified project changes and record commit or pull request delivery, or obtain an explicit human waiver."
    });
  }
  const timestamp = nextTaskTimestamp(location.task);
  const completed: TaskRecord = {
    ...location.task,
    status: "completed",
    updated_at: timestamp,
    completed_at: timestamp
  };
  writeTask(location.directory, completed);
  return completed;
}

export function archiveTask(root: string, taskId: string): TaskLocation {
  return withTaskLock(root, taskId, () => archiveTaskUnlocked(root, taskId));
}

function archiveTaskUnlocked(root: string, taskId: string): TaskLocation {
  const location = findTask(root, taskId);
  if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`);
  if (location.archived) return location;
  if (location.task.status !== "completed") {
    throw new OpenNoriError("task_not_completed", `Task ${taskId} must be completed before it can be archived.`);
  }
  const month = archiveMonth(location.task.completed_at ?? location.task.updated_at);
  const destination = safeProjectPath(root, `.opennori/tasks/archive/${month}/${taskId}`);
  if (fs.existsSync(destination)) {
    throw new OpenNoriError("archive_exists", `Archive destination already exists for task ${taskId}.`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(location.directory, destination);
  return loadTaskDirectory(destination, true);
}

/** Clear host-local pointers only after report and journal finalization succeeds. */
export function finalizeTaskArchive(root: string, taskId: string): void {
  withTaskLock(root, taskId, () => clearTaskFromSessions(root, taskId));
}

/** Restore an archived task when Finish persistence fails after the directory move. */
export function rollbackTaskArchive(root: string, taskId: string): TaskLocation {
  return withTaskLock(root, taskId, () => {
    const location = findTask(root, taskId);
    if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found during archive rollback.`);
    if (!location.archived) return location;
    const destination = safeProjectPath(root, `.opennori/tasks/${taskId}`);
    if (fs.existsSync(destination)) {
      throw new OpenNoriError("archive_rollback_conflict", `Cannot restore ${taskId}; its active path already exists.`, {
        context: { active_path: destination, archive_path: location.directory }
      });
    }
    fs.renameSync(location.directory, destination);
    return loadTaskDirectory(destination, false);
  });
}

export function loadCurrentTask(root: string, options: SessionOptions = {}): TaskRecord | null {
  const sessionKey = requireSessionKey(options.sessionKey);
  const filePath = sessionPath(root, sessionKey);
  if (!fs.existsSync(filePath)) return null;
  let session: { schema_version: "opennori/session-v1"; task_id: string; updated_at: string };
  try {
    session = readJson(filePath);
    assertSchema("session", session);
  } catch {
    return null;
  }
  const location = findTask(root, session.task_id);
  return !location || location.archived ? null : location.task;
}

export function clearCurrentTask(root: string, options: SessionOptions = {}): void {
  const sessionKey = requireSessionKey(options.sessionKey);
  const filePath = sessionPath(root, sessionKey);
  withProjectRuntimeLock(root, "clear current task session", () =>
    withSessionFileLock(root, filePath, () => fs.rmSync(filePath, { force: true }))
  );
}

export function loadTaskView(root: string, taskId: string): TaskView {
  const location = findTask(root, taskId);
  if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`);
  return loadTaskViewAt(location);
}

/** Load one known task directory so doctor can diagnose corrupt entries without list traversal. */
export function loadTaskLocationAt(directory: string, archived: boolean): TaskLocation {
  return loadTaskDirectory(path.resolve(directory), archived);
}

export function loadTaskViewAt(location: TaskLocation): TaskView {
  const taskId = location.task.id;
  const delivery = loadDelivery(location.directory, taskId);
  const isDeliveryReady = deliveryReady(location.task, delivery);
  const contractFile = path.join(location.directory, "contract.json");
  if (!fs.existsSync(contractFile)) {
    if (location.task.status !== "planning") {
      throw new OpenNoriError("contract_not_found", `Task ${taskId} is ${location.task.status} but has no contract.json.`, {
        recovery: "Restore the approved Contract before continuing this task."
      });
    }
    return {
      task: location.task,
      archived: location.archived,
      phase: "plan",
      contract: null,
      outcomes: [],
      current_gap: null,
      complete: false,
      delivery,
      delivery_ready: isDeliveryReady,
      finish_ready: false
    };
  }
  const contract = loadContract(location.directory, taskId);
  const evidence = loadEvidence(location.directory, taskId, contract);
  const outcomes = outcomeStatuses(contract, evidence, location.task.implementation_revision);
  const outcomesComplete = contract.status === "approved" && requiredOutcomesComplete(outcomes);
  return {
    task: location.task,
    archived: location.archived,
    phase: derivePhase(location.task.status),
    contract,
    outcomes,
    current_gap: currentOutcomeGap(outcomes),
    complete: outcomesComplete,
    delivery,
    delivery_ready: isDeliveryReady,
    finish_ready: outcomesComplete && isDeliveryReady
  };
}

export function taskNextAction(view: TaskView): string {
  if (view.task.blocker) return `Resolve blocker: ${view.task.blocker}`;
  if (view.phase === "plan") {
    if (!view.contract) return "Draft the Nori Contract.";
    if (view.contract.status !== "approved") return "Review and approve contract.md.";
    if (!view.delivery) return "Plan commit, pull request, or explicitly waived delivery.";
    return "Start implementation of the approved Contract.";
  }
  if (view.phase === "implement") return "Implement the approved Contract, then move the task to review.";
  if (view.phase === "verify") {
    return view.current_gap
      ? `Record reviewable evidence for ${view.current_gap.id}.`
      : !view.delivery_ready
        ? "Commit the verified changes and record Git delivery."
        : "Finish the task, promote stable knowledge, and archive it.";
  }
  if (!view.archived) return "Promote stable project knowledge, then archive the completed task with its journal summary.";
  if (!view.task.delivery_required || view.delivery?.mode === "waived") return "Completion is recorded without Git finalization.";
  return "Commit the archived OpenNori state and finalize Git delivery.";
}

function tasksDirectory(root: string): string {
  return safeProjectPath(root, ".opennori/tasks");
}

function archiveDirectory(root: string): string {
  return safeProjectPath(root, ".opennori/tasks/archive");
}

function requireActiveTask(root: string, taskId: string): TaskLocation {
  const location = findTask(root, taskId);
  if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`);
  if (location.archived) throw new OpenNoriError("task_archived", `Task ${taskId} is archived and cannot be changed.`);
  return location;
}

function loadTaskDirectory(directory: string, archived: boolean): TaskLocation {
  const filePath = path.join(directory, "task.json");
  if (!fs.existsSync(filePath)) throw new OpenNoriError("task_state_missing", `Missing task.json at ${filePath}.`);
  const task = readJson<TaskRecord>(filePath);
  assertTaskRecord(task);
  if (task.id !== path.basename(directory)) {
    throw new OpenNoriError("task_directory_mismatch", `Task ${task.id} is stored under ${path.basename(directory)}.`);
  }
  return { task, directory, archived };
}

function writeTask(directory: string, task: TaskRecord): void {
  assertTaskRecord(task);
  writeJsonAtomic(path.join(directory, "task.json"), task);
}

function updateTask(directory: string, task: TaskRecord, status: TaskStatus, implementationRevision = task.implementation_revision): TaskRecord {
  const updated: TaskRecord = {
    ...task,
    status,
    implementation_revision: implementationRevision,
    updated_at: nextTaskTimestamp(task)
  };
  writeTask(directory, updated);
  return updated;
}

function nextTaskTimestamp(task: TaskRecord): string {
  const current = nowIso();
  return Date.parse(current) >= Date.parse(task.updated_at) ? current : task.updated_at;
}

function derivePhase(status: TaskStatus): TaskPhase {
  switch (status) {
    case "planning":
      return "plan";
    case "in_progress":
      return "implement";
    case "review":
      return "verify";
    case "completed":
      return "finish";
  }
}

function setSessionTask(root: string, sessionKey: string, taskId: string): void {
  const filePath = sessionPath(root, sessionKey);
  const pointer = {
    schema_version: "opennori/session-v1",
    task_id: taskId,
    updated_at: nowIso()
  };
  assertSchema("session", pointer);
  withProjectRuntimeLock(root, "select current task session", () =>
    withSessionFileLock(root, filePath, () => writeJsonAtomic(filePath, pointer))
  );
}

function clearTaskFromSessions(root: string, taskId: string): void {
  withProjectRuntimeLock(root, "clear archived task sessions", () => {
    const sessions = safeProjectPath(root, ".opennori/.runtime/sessions");
    if (!fs.existsSync(sessions)) return;
    try {
      for (const entry of fs.readdirSync(sessions, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
        const filePath = path.join(sessions, entry.name);
        try {
          withSessionFileLock(root, filePath, () => {
            if (!fs.existsSync(filePath)) return;
            const state = readJson<{ task_id?: string }>(filePath);
            if (state.task_id === taskId) fs.rmSync(filePath, { force: true });
          });
        } catch {
          // Corrupt host-local state must not block canonical task archiving.
        }
      }
    } catch {
      // Session cleanup is best effort and never changes canonical archive state.
    }
  });
}

function sessionPath(root: string, sessionKey: string): string {
  const hash = crypto.createHash("sha256").update(sessionKey).digest("hex");
  return safeProjectPath(root, `.opennori/.runtime/sessions/${hash}.json`);
}

function withSessionFileLock<T>(root: string, filePath: string, operation: () => T): T {
  const sessionId = path.basename(filePath, ".json");
  const lockTarget = safeProjectPath(root, `.opennori/.runtime/locks/session-${sessionId}`);
  return withExclusiveLock(lockTarget, `session ${sessionId}`, operation);
}

function requireSessionKey(explicit?: string): string {
  const value = explicit?.trim() || SESSION_ENV_KEYS.map((key) => process.env[key]?.trim()).find(Boolean);
  if (!value) {
    throw new OpenNoriError("session_id_required", "A stable session key is required to select the current task.", {
      recovery: "Pass --session, or run from a supported host session that provides CODEX_THREAD_ID or CLAUDE_CODE_SESSION_ID."
    });
  }
  return value;
}

function normalizeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) {
    throw new OpenNoriError("task_slug_required", "Task title cannot produce an ASCII slug; pass slug explicitly.");
  }
  if (slug.length > 80) {
    throw new OpenNoriError("task_slug_too_long", `Task slug is ${slug.length} characters; the maximum is 80.`, {
      recovery: "Pass a shorter, distinct --slug that still identifies the task."
    });
  }
  return slug;
}

function assertTaskId(taskId: string): void {
  const match = TASK_ID_PATTERN.exec(taskId);
  if (!match) {
    throw new OpenNoriError("task_id_invalid", `Invalid task id: ${taskId}.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new OpenNoriError("task_id_invalid", `Invalid task id date: ${taskId}.`);
  }
}

function archiveMonth(timestamp: string): string {
  assertIsoTimestamp(timestamp, "archive timestamp");
  return timestamp.slice(0, 7);
}

function assertTaskRecord(task: TaskRecord): void {
  assertSchema<TaskRecord>("task", task);
  assertTaskId(task.id);
  assertIsoTimestamp(task.created_at, "created_at");
  assertIsoTimestamp(task.updated_at, "updated_at");
  if (task.completed_at !== null && task.completed_at !== undefined) {
    assertIsoTimestamp(task.completed_at, "completed_at");
  }
  if (task.status === "completed" && !task.completed_at) {
    throw new OpenNoriError("task_state_invalid", `Completed task ${task.id} is missing completed_at.`);
  }
  if (task.status !== "completed" && task.completed_at != null) {
    throw new OpenNoriError("task_state_invalid", `Task ${task.id} is ${task.status} but has completed_at.`);
  }
  if (Date.parse(task.updated_at) < Date.parse(task.created_at)) {
    throw new OpenNoriError("task_state_invalid", `Task ${task.id} was updated before it was created.`);
  }
  if (task.completed_at && Date.parse(task.completed_at) < Date.parse(task.created_at)) {
    throw new OpenNoriError("task_state_invalid", `Task ${task.id} was completed before it was created.`);
  }
}

function assertIsoTimestamp(value: string, field: string): void {
  const match = ISO_TIMESTAMP_PATTERN.exec(value);
  if (!match) throw new OpenNoriError("task_timestamp_invalid", `Task ${field} is not a UTC ISO timestamp: ${value}.`);
  const parsed = new Date(value);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(match[1]) ||
    parsed.getUTCMonth() !== Number(match[2]) - 1 ||
    parsed.getUTCDate() !== Number(match[3]) ||
    parsed.getUTCHours() !== Number(match[4]) ||
    parsed.getUTCMinutes() !== Number(match[5]) ||
    parsed.getUTCSeconds() !== Number(match[6])
  ) {
    throw new OpenNoriError("task_timestamp_invalid", `Task ${field} is invalid: ${value}.`);
  }
}

function requireUnblocked(task: TaskRecord, target: TaskStatus): void {
  if (!task.blocker) return;
  throw new OpenNoriError("task_blocked", `Task ${task.id} cannot transition to ${target} while blocked: ${task.blocker}`, {
    context: { task_id: task.id, status: task.status, target, blocker: task.blocker },
    recovery: "Resolve the blocker and run task unblock before changing lifecycle state."
  });
}

function requireTaskPackage(root: string, task: TaskRecord): void {
  if (!task.package) return;
  resolveProjectPackage(root, readProjectConfig(root), task.package);
}

function invalidTransition(task: TaskRecord, target: TaskStatus): OpenNoriError {
  return new OpenNoriError("task_transition_invalid", `Cannot transition task ${task.id} from ${task.status} to ${target}.`, {
    context: { task_id: task.id, from: task.status, to: target }
  });
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}
