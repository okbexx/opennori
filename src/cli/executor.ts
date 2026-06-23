import type { CommandDef } from "citty";
import { runCommand } from "citty";

export type CliCommand = CommandDef<any>;

export async function runJsonCommand(command: CliCommand, rawArgs: string[], data?: unknown): Promise<unknown> {
  const { result } = await runCommand(command, { rawArgs, data });
  return result;
}
