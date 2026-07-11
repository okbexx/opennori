import { defaultHostCommandRunner, type HostCommandRunner } from "./host-command.ts";

export type ClaudeHostInspection = {
  platform: "claude";
  display_name: "Claude Code";
  cli_available: boolean;
  version: string | null;
  ready: boolean;
};

/** Inspect the external Claude Code runtime without modifying host settings. */
export function inspectClaudeHost(
  cwd: string,
  runner: HostCommandRunner = defaultHostCommandRunner
): ClaudeHostInspection {
  const result = runner("claude", ["--version"], cwd);
  const cliAvailable = !result.error && result.status === 0;
  const version = cliAvailable ? result.stdout.trim() || null : null;
  return {
    platform: "claude",
    display_name: "Claude Code",
    cli_available: cliAvailable,
    version,
    ready: cliAvailable
  };
}
