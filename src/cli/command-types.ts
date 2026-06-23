import type { CommandDef } from "citty";

export type Resolvable<T> = T | Promise<T> | (() => T | Promise<T>);
export type AnyCommand = CommandDef<any>;
export type UsageArgDefinition = {
  type?: string;
  required?: boolean;
  default?: unknown;
};

export type CommandPolicy = {
  activeGoal?: boolean;
  activeGoalWrite?: boolean;
  commandResult?: boolean;
  stdioServer?: boolean;
};

export type ResolvedCliCommand = {
  ok: true;
  command: AnyCommand;
  parent?: AnyCommand;
  path: string[];
  rawArgs: string[];
  policy: CommandPolicy;
} | {
  ok: false;
  path: string[];
  message: string;
};

export async function resolveValue<T>(value: Resolvable<T> | undefined): Promise<T | undefined> {
  if (typeof value === "function") return await (value as () => T | Promise<T>)();
  return await value;
}

export function asCommand(command: unknown): AnyCommand {
  return command as AnyCommand;
}
