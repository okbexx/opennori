import { spawnSync } from "node:child_process";

const COMMAND_OUTPUT_LIMIT = 4 * 1024 * 1024;

export type HostCommandOptions = {
  maxBuffer?: number;
  timeoutMs?: number;
};

export type HostCommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
  signal?: string;
};

export type HostCommandRunner = (
  command: string,
  args: readonly string[],
  cwd: string,
  options?: HostCommandOptions
) => HostCommandResult;

export const defaultHostCommandRunner: HostCommandRunner = (command, args, cwd, options = {}) => {
  const result = spawnSync(command, [...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: options.maxBuffer ?? COMMAND_OUTPUT_LIMIT,
    ...(options.timeoutMs === undefined ? {} : { timeout: options.timeoutMs }),
    stdio: ["ignore", "pipe", "pipe"]
  });
  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    ...(result.error ? { error: result.error } : {}),
    ...(result.signal ? { signal: result.signal } : {})
  };
};
