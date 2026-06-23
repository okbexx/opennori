import type { AnyCommand, CommandPolicy } from "./command-types.ts";

const COMMAND_POLICIES = new WeakMap<AnyCommand, CommandPolicy>();

export function withPolicy<T extends AnyCommand>(command: T, policy: CommandPolicy = {}): T {
  COMMAND_POLICIES.set(command, policy);
  return command;
}

export function policyFor(command: AnyCommand): CommandPolicy {
  return COMMAND_POLICIES.get(command) || {};
}
