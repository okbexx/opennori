import { spawnSync } from "node:child_process";
import type { ExternalCommandAction } from "../external-actions.ts";

export type ExternalCommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
};

export type ExternalCommandRunner = (command: string, args: string[]) => ExternalCommandResult;

export function defaultExternalCommandRunner(command: string, args: string[]): ExternalCommandResult {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error
  };
}

export function runExternalCommandAction<T extends ExternalCommandAction>(action: T, runner: ExternalCommandRunner): T {
  if (!action.command || !action.will_write || action.action !== "will-run") return action;
  const [command, ...args] = action.command;
  if (!command) return action;
  const result = runner(command, args);
  if (result.status === 0) {
    return {
      ...action,
      action: "applied",
      stdout: result.stdout.trim() || undefined,
      stderr: result.stderr.trim() || undefined
    };
  }
  return {
    ...action,
    action: "failed",
    stdout: result.stdout.trim() || undefined,
    stderr: result.stderr.trim() || result.error?.message || undefined
  };
}
