import fs from "node:fs";
import path from "node:path";
import { OpenNoriError } from "./errors.ts";
import { withExclusiveLock, withProjectRuntimeLock } from "./exclusive-lock.ts";
import { contentHash, nowIso, posixRelative, readJson, readText, safeProjectPath, writeBufferAtomic, writeJsonAtomic } from "./io.ts";
import { CURRENT_STATE_SCHEMA_VERSION, INSTALL_MANIFEST_PATH, PROJECT_DIR, readInstallManifest } from "./project.ts";
import { withTaskLock } from "./task-lock.ts";
import type { InstallManifest, LegacyTaskRecord, StateMigrationPlan, TaskRecord } from "./types.ts";
import { assertSchema } from "./validation.ts";

type MigrationSnapshot = {
  path: string;
  content: Buffer;
  mode: number;
};

function taskStateFiles(root: string): string[] {
  const tasksRoot = safeProjectPath(root, `${PROJECT_DIR}/tasks`);
  if (!fs.existsSync(tasksRoot)) return [];
  const files: string[] = [];
  const addTask = (directory: string): void => {
    const filePath = path.join(directory, "task.json");
    if (!fs.existsSync(filePath)) return;
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new OpenNoriError("migration_unsafe_path", `State migration requires a regular file at ${posixRelative(root, filePath)}.`);
    }
    files.push(posixRelative(root, filePath));
  };
  for (const entry of fs.readdirSync(tasksRoot, { withFileTypes: true })) {
    const entryPath = path.join(tasksRoot, entry.name);
    if (entry.isSymbolicLink()) {
      throw new OpenNoriError("migration_unsafe_path", `State migration refuses symbolic links under ${posixRelative(root, entryPath)}.`);
    }
    if (!entry.isDirectory()) continue;
    if (entry.name !== "archive") {
      addTask(entryPath);
      continue;
    }
    for (const month of fs.readdirSync(entryPath, { withFileTypes: true })) {
      const monthPath = path.join(entryPath, month.name);
      if (month.isSymbolicLink()) {
        throw new OpenNoriError("migration_unsafe_path", `State migration refuses symbolic links under ${posixRelative(root, monthPath)}.`);
      }
      if (!month.isDirectory() || !/^\d{4}-\d{2}$/.test(month.name)) continue;
      for (const archived of fs.readdirSync(monthPath, { withFileTypes: true })) {
        const archivedPath = path.join(monthPath, archived.name);
        if (archived.isSymbolicLink()) {
          throw new OpenNoriError("migration_unsafe_path", `State migration refuses symbolic links under ${posixRelative(root, archivedPath)}.`);
        }
        if (archived.isDirectory()) addTask(archivedPath);
      }
    }
  }
  return files.sort();
}

function validateTaskForMigration(root: string, relativePath: string): "legacy" | "current" {
  const payload = readJson<unknown>(safeProjectPath(root, relativePath));
  const version = typeof payload === "object" && payload !== null && "schema_version" in payload ? payload.schema_version : null;
  if (version === "opennori/task-v1") {
    assertSchema<LegacyTaskRecord>("legacyTask", payload);
    assertTaskDirectory(root, relativePath, payload.id);
    assertSchema<TaskRecord>("task", migrateTask(payload));
    return "legacy";
  }
  if (version === "opennori/task-v2") {
    assertSchema<TaskRecord>("task", payload);
    assertTaskDirectory(root, relativePath, payload.id);
    return "current";
  }
  throw new OpenNoriError("migration_task_version_unknown", `Cannot migrate ${relativePath}: unsupported task schema ${String(version)}.`);
}

function assertTaskDirectory(root: string, relativePath: string, taskId: string): void {
  const directoryName = path.basename(path.dirname(safeProjectPath(root, relativePath)));
  if (directoryName !== taskId) {
    throw new OpenNoriError("migration_task_directory_mismatch", `Task ${taskId} is stored under ${directoryName}.`, {
      recovery: "Restore the canonical task directory name before previewing migration again."
    });
  }
}

export function planStateMigration(root: string, manifest = readInstallManifest(root)): StateMigrationPlan | null {
  if (manifest.state_schema_version === CURRENT_STATE_SCHEMA_VERSION) return null;
  if (manifest.state_schema_version > CURRENT_STATE_SCHEMA_VERSION) {
    throw new OpenNoriError(
      "state_schema_newer",
      `Project state schema ${manifest.state_schema_version} is newer than this OpenNori CLI supports (${CURRENT_STATE_SCHEMA_VERSION}).`,
      { recovery: "Install the project-compatible OpenNori version instead of attempting a downgrade." }
    );
  }
  if (manifest.state_schema_version !== 1) {
    throw new OpenNoriError("state_schema_unsupported", `Project state schema ${manifest.state_schema_version} is not supported by this OpenNori version.`, {
      recovery: "Install an OpenNori version that provides a continuous migration path for this project."
    });
  }
  const legacyTaskFiles = taskStateFiles(root).filter((file) => validateTaskForMigration(root, file) === "legacy");
  return {
    schema_version: "opennori/state-migration-plan-v1",
    from_version: 1,
    to_version: 2,
    manifest_hash: contentHash(readText(safeProjectPath(root, INSTALL_MANIFEST_PATH))),
    task_files: legacyTaskFiles
  };
}

export function inferProjectStateSchema(root: string): 1 | 2 {
  const versions = new Set(taskStateFiles(root).map((file) => validateTaskForMigration(root, file)));
  if (versions.has("legacy") && versions.has("current")) {
    throw new OpenNoriError("state_schema_mixed", "Project tasks contain a mixture of state schema 1 and 2 records.", {
      recovery: "Restore the install manifest and task files from one consistent pre-upgrade or post-upgrade checkpoint before repair."
    });
  }
  return versions.has("legacy") ? 1 : CURRENT_STATE_SCHEMA_VERSION;
}

function migrateTask(task: LegacyTaskRecord): TaskRecord {
  return {
    schema_version: "opennori/task-v2",
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    implementation_revision: task.implementation_revision,
    priority: task.priority,
    creator: task.creator,
    delivery_required: task.status !== "completed",
    package: task.package ?? null,
    blocker: task.blocker ?? null,
    created_at: task.created_at,
    updated_at: task.updated_at,
    completed_at: task.completed_at ?? null
  };
}

function restoreSnapshots(root: string, snapshots: readonly MigrationSnapshot[]): void {
  const errors: Array<{ path: string; cause: string }> = [];
  for (const snapshot of [...snapshots].reverse()) {
    try {
      writeBufferAtomic(snapshot.path, snapshot.content, snapshot.mode);
      if (!fs.readFileSync(snapshot.path).equals(snapshot.content)) throw new Error("restored bytes do not match");
    } catch (error) {
      errors.push({ path: posixRelative(root, snapshot.path), cause: error instanceof Error ? error.message : String(error) });
    }
  }
  if (errors.length > 0) {
    throw new OpenNoriError("migration_rollback_incomplete", "State migration failed and one or more files could not be restored.", {
      context: { errors },
      recovery: "Stop OpenNori writes and restore the reported canonical files from version control or backup."
    });
  }
}

function withMigrationTaskLocks<T>(root: string, taskFiles: readonly string[], operation: () => T): T {
  const taskIds = [...new Set(taskFiles.map((file) => path.basename(path.dirname(safeProjectPath(root, file)))))].sort();
  const acquire = (index: number): T => {
    const taskId = taskIds[index];
    return taskId ? withTaskLock(root, taskId, () => acquire(index + 1)) : operation();
  };
  return acquire(0);
}

/** Apply one reviewed state migration with byte-for-byte rollback on failure. */
export function applyStateMigration(
  root: string,
  plan: StateMigrationPlan,
  hooks: { afterTaskWrite?: (relativePath: string, index: number) => void } = {}
): InstallManifest {
  const projectRoot = path.resolve(root);
  return withExclusiveLock(safeProjectPath(projectRoot, ".opennori-lifecycle"), "state migration", () =>
    withProjectRuntimeLock(projectRoot, "state migration runtime", () => {
      const currentPlan = planStateMigration(projectRoot);
      if (!currentPlan || JSON.stringify(currentPlan) !== JSON.stringify(plan)) {
        throw new OpenNoriError("migration_plan_stale", "Project state changed after the migration preview.", {
          recovery: "Run opennori update --dry-run again and review the new plan."
        });
      }
      return withMigrationTaskLocks(projectRoot, currentPlan.task_files, () => {
        const lockedPlan = planStateMigration(projectRoot);
        if (!lockedPlan || JSON.stringify(lockedPlan) !== JSON.stringify(plan)) {
          throw new OpenNoriError("migration_plan_stale", "Project state changed while the migration locks were being acquired.", {
            recovery: "Run opennori update --dry-run again and review the new plan."
          });
        }
        const manifestPath = safeProjectPath(projectRoot, INSTALL_MANIFEST_PATH);
        const snapshots: MigrationSnapshot[] = [manifestPath, ...plan.task_files.map((file) => safeProjectPath(projectRoot, file))].map(
          (filePath) => ({ path: filePath, content: fs.readFileSync(filePath), mode: fs.statSync(filePath).mode })
        );
        try {
          for (const [index, relativePath] of plan.task_files.entries()) {
            const filePath = safeProjectPath(projectRoot, relativePath);
            const legacy = readJson<LegacyTaskRecord>(filePath);
            assertSchema<LegacyTaskRecord>("legacyTask", legacy);
            const migrated = migrateTask(legacy);
            assertSchema<TaskRecord>("task", migrated);
            writeJsonAtomic(filePath, migrated);
            hooks.afterTaskWrite?.(relativePath, index);
          }
          const manifest = readInstallManifest(projectRoot);
          const migratedManifest: InstallManifest = {
            ...manifest,
            state_schema_version: CURRENT_STATE_SCHEMA_VERSION,
            updated_at: nowIso()
          };
          assertSchema<InstallManifest>("manifest", migratedManifest);
          writeJsonAtomic(manifestPath, migratedManifest);
          return migratedManifest;
        } catch (error) {
          try {
            restoreSnapshots(projectRoot, snapshots);
          } catch (rollbackError) {
            throw new OpenNoriError("migration_rollback_failed", "State migration failed and rollback was incomplete.", {
              context: {
                operation_error: error instanceof Error ? error.message : String(error),
                rollback_error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
              }
            });
          }
          throw error;
        }
      });
    })
  );
}
