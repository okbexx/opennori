import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeJson } from "../core.ts";
import { inferRootFromAcceptancePath, inferRootFromDossierPath } from "./active-goal-store.ts";

function waitSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function argValue(rawArgs: string[], name: string): string | undefined {
  const rawName = name.startsWith("--") ? name : `--${name}`;
  for (let index = 0; index < rawArgs.length; index += 1) {
    const item = rawArgs[index];
    if (item === undefined) continue;
    if (item === rawName) {
      const next = rawArgs[index + 1];
      return next && !next.startsWith("-") ? next : undefined;
    }
    if (item.startsWith(`${rawName}=`)) return item.slice(rawName.length + 1);
  }
  return undefined;
}

function lockRootFromArgs(rawArgs: string[]): string {
  const dossierPath = argValue(rawArgs, "dossier");
  if (dossierPath) return inferRootFromDossierPath(dossierPath);
  const acceptancePath = argValue(rawArgs, "acceptance");
  if (acceptancePath) return inferRootFromAcceptancePath(acceptancePath);
  return path.resolve(argValue(rawArgs, "root") || process.cwd());
}

function lockParentForRoot(root: string): string {
  const noriDir = path.join(root, ".opennori");
  if (fs.existsSync(noriDir)) return path.join(noriDir, ".locks");
  return path.join(os.tmpdir(), "opennori-locks", Buffer.from(root).toString("hex").slice(0, 80));
}

export function activeGoalWriteLockPath(root: string): string {
  return path.join(lockParentForRoot(root), "active-goal.write.lock");
}

function acquireActiveGoalWriteLock(root: string): string {
  const lockPath = activeGoalWriteLockPath(root);
  const startedAt = Date.now();
  const timeoutMs = 15_000;
  const staleMs = 120_000;
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });

  while (true) {
    try {
      fs.mkdirSync(lockPath);
      writeJson(path.join(lockPath, "owner.json"), {
        pid: process.pid,
        root,
        created_at: new Date().toISOString()
      });
      return lockPath;
    } catch (error) {
      const typedError = error as NodeJS.ErrnoException;
      if (typedError.code !== "EEXIST") throw error;
      try {
        const stat = fs.statSync(lockPath);
        if (Date.now() - stat.mtimeMs > staleMs) {
          fs.rmSync(lockPath, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error(`Timed out waiting for OpenNori active goal write lock: ${lockPath}`);
      }
      waitSync(50);
    }
  }
}

export async function withActiveGoalWriteLock<T>(rawArgs: string[], action: () => Promise<T>): Promise<T> {
  const root = lockRootFromArgs(rawArgs);
  const lockPath = acquireActiveGoalWriteLock(root);
  try {
    return await action();
  } finally {
    fs.rmSync(lockPath, { recursive: true, force: true });
  }
}
