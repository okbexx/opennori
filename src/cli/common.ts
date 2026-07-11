import path from "node:path";
import { OpenNoriError } from "../errors.ts";
import { readJson, safeProjectPath } from "../io.ts";
import { readProjectConfig, requireCurrentStateSchema } from "../project.ts";
import { findTask } from "../task.ts";
import type { PlatformId } from "../types.ts";

export const ROOT_ARGS = {
  root: { type: "string", description: "Project root", default: ".", valueHint: "path" },
  json: { type: "boolean", description: "Emit stable JSON output", default: false }
} as const;

export const SESSION_ARG = {
  session: { type: "string", description: "Stable host session key", valueHint: "id" }
} as const;

export function projectRoot(value: string): string {
  return path.resolve(value);
}

export function hostSessionKey(value?: string): string | undefined {
  return value || process.env.OPENNORI_SESSION_ID || process.env.CODEX_THREAD_ID || process.env.CLAUDE_CODE_SESSION_ID;
}

export function requiredHostSessionKey(value?: string): string {
  const session = hostSessionKey(value);
  if (!session) {
    throw new OpenNoriError("session_id_required", "A stable host session key is required for worker coordination.", {
      recovery: "Pass --session or run from a supported host conversation."
    });
  }
  return session;
}

export function readyProjectRoot(value: string): string {
  const root = projectRoot(value);
  readProjectConfig(root);
  requireCurrentStateSchema(root);
  return root;
}

export function readProjectInput<T>(root: string, relativePath: string): T {
  return readJson<T>(safeProjectPath(root, relativePath));
}

export function requireTaskLocation(root: string, taskId: string): NonNullable<ReturnType<typeof findTask>> {
  const location = findTask(root, taskId);
  if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`);
  return location;
}

export function configuredPlatform(root: string): PlatformId {
  const platform = readProjectConfig(root).platforms[0];
  if (!platform) throw new OpenNoriError("platform_missing", "The project does not configure an agent platform.");
  return platform;
}
