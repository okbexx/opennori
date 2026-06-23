import type { ArgsDef, CommandDef } from "citty";
import { runCommand } from "citty";

export type CliCommand<T extends ArgsDef = ArgsDef> = CommandDef<T>;

export async function runJsonCommand<T extends ArgsDef>(command: CliCommand<T>, rawArgs: string[], data?: unknown): Promise<unknown> {
  const { result } = await runCommand(command, { rawArgs, data });
  return result;
}
