import fs from "node:fs";
import path from "node:path";
import { lockSync } from "proper-lockfile";
import { OpenNoriError } from "./errors.ts";
import { safeProjectPath } from "./io.ts";

const heldLocks = new Set<string>();

/** Run a synchronous state mutation under one mature cross-process lock. */
export function withExclusiveLock<T>(lockTarget: string, description: string, operation: () => T): T {
  const resolvedTarget = path.resolve(lockTarget);
  fs.mkdirSync(path.dirname(resolvedTarget), { recursive: true });
  if (heldLocks.has(resolvedTarget)) return operation();

  let release: (() => void) | undefined;
  try {
    release = lockSync(resolvedTarget, {
      realpath: false,
      stale: 10 * 60 * 1000,
      update: 60 * 1000
    });
  } catch (error) {
    throw new OpenNoriError("state_busy", `OpenNori state is busy: ${description}.`, {
      context: { lock_target: resolvedTarget, cause: error instanceof Error ? error.message : String(error) },
      recovery: "Wait for the active OpenNori command to finish, then retry."
    });
  }

  heldLocks.add(resolvedTarget);
  try {
    return operation();
  } finally {
    heldLocks.delete(resolvedTarget);
    release();
  }
}

/** Exclude lifecycle commits from host-local runtime reads and writes. */
export function withProjectRuntimeLock<T>(root: string, description: string, operation: () => T): T {
  return withExclusiveLock(safeProjectPath(root, ".opennori-runtime"), description, operation);
}
