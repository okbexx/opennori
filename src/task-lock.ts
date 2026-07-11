import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { OpenNoriError } from "./errors.ts";
import { withExclusiveLock } from "./exclusive-lock.ts";
import { safeProjectPath } from "./io.ts";

/** Serialize canonical writes for one task across processes and nested domain calls. */
export function withTaskLock<T>(root: string, taskId: string, operation: () => T): T {
  return withTaskDirectoryLock(safeProjectPath(root, `.opennori/tasks/${taskId}`), operation);
}

export function withTaskDirectoryLock<T>(taskDirectory: string, operation: () => T): T {
  const resolvedDirectory = path.resolve(taskDirectory);
  const segments = resolvedDirectory.split(path.sep);
  const projectIndex = segments.lastIndexOf(".opennori");
  if (projectIndex <= 0) {
    throw new OpenNoriError("task_path_invalid", `Task directory is outside an OpenNori project: ${taskDirectory}`);
  }
  const projectRoot = segments.slice(0, projectIndex).join(path.sep) || path.parse(resolvedDirectory).root;
  const taskId = path.basename(resolvedDirectory);
  const lockId = crypto.createHash("sha256").update(taskId).digest("hex");
  const lockTarget = safeProjectPath(projectRoot, `.opennori/.runtime/locks/${lockId}`);
  fs.mkdirSync(path.dirname(lockTarget), { recursive: true });
  return withExclusiveLock(lockTarget, `task ${taskId}`, operation);
}
