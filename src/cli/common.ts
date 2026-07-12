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

export function configuredPlatform(root: string, env: NodeJS.ProcessEnv = process.env): PlatformId {
  const configured = readProjectConfig(root).platforms;
  const detected = [
    env.CODEX_THREAD_ID?.trim() ? "codex" : null,
    env.CLAUDE_CODE_SESSION_ID?.trim() ? "claude" : null
  ].filter((platform): platform is PlatformId => platform !== null);
  if (detected.length > 1) {
    throw new OpenNoriError("platform_ambiguous", "Both Codex and Claude Code session identifiers are present.", {
      recovery: "Run the command from one supported host session."
    });
  }
  const platform = detected[0] ?? (configured.length === 1 ? configured[0] : undefined);
  if (!platform) {
    throw new OpenNoriError("platform_required", "The current agent platform cannot be determined for this multi-platform project.", {
      recovery: "Run the command from a Codex or Claude Code conversation."
    });
  }
  if (!configured.includes(platform)) {
    throw new OpenNoriError("platform_not_configured", `${platform} is not configured for this project.`, {
      recovery: `Preview 'opennori platform add ${platform} --dry-run', then apply it with --confirm.`
    });
  }
  return platform;
}
