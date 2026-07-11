import { defineCommand } from "citty";
import { runCliAction } from "../cli-output.ts";
import {
  assignCoordinationWorker,
  coordinationWorkerLabel,
  listCoordinationBindings,
  recordCoordinationContact,
  recordCoordinationInterruption
} from "../coordination.ts";
import { requirePlatformCoordination } from "../platform.ts";
import {
  ROOT_ARGS,
  SESSION_ARG,
  configuredPlatform,
  readyProjectRoot,
  requiredHostSessionKey
} from "./common.ts";

function coordinationRoot(value: string): string {
  const root = readyProjectRoot(value);
  requirePlatformCoordination(configuredPlatform(root));
  return root;
}

function commaSeparated(value?: string): string[] {
  return value?.split(",").map((entry) => entry.trim()).filter(Boolean) ?? [];
}

const coordinationAssignCommand = defineCommand({
  meta: { name: "assign", description: "Bind one host-native worker to this task revision" },
  args: {
    ...ROOT_ARGS,
    ...SESSION_ARG,
    task: { type: "positional", description: "Task id", required: true },
    worker: { type: "string", description: "Host worker reference", required: true },
    role: { type: "string", description: "Worker role", required: true },
    assignment: { type: "string", description: "Bounded assignment summary", required: true },
    outcomes: { type: "string", description: "Comma-separated Outcome ids" },
    paths: { type: "string", description: "Comma-separated project paths" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = coordinationRoot(args.root);
        return assignCoordinationWorker(root, args.task, {
          workerRef: args.worker,
          parentSession: requiredHostSessionKey(args.session),
          role: args.role,
          assignment: args.assignment,
          outcomeIds: commaSeparated(args.outcomes),
          paths: commaSeparated(args.paths)
        });
      },
      (binding) =>
        `Bound worker ${coordinationWorkerLabel(binding.worker_ref)} to ${binding.task_id} revision ${binding.implementation_revision}.`
    );
  }
});

const coordinationMessageCommand = defineCommand({
  meta: { name: "message", description: "Record that a host-native worker message succeeded" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    worker: { type: "string", description: "Host worker reference", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => recordCoordinationContact(coordinationRoot(args.root), args.task, args.worker),
      (binding) => `Recorded worker ${coordinationWorkerLabel(binding.worker_ref)} contact at ${binding.last_contact_at}.`
    );
  }
});

const coordinationInterruptCommand = defineCommand({
  meta: { name: "interrupt", description: "Record a successful host-native worker interruption" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    worker: { type: "string", description: "Host worker reference", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => recordCoordinationInterruption(coordinationRoot(args.root), args.task, args.worker),
      (binding) => `Recorded worker ${coordinationWorkerLabel(binding.worker_ref)} interruption at ${binding.interrupted_at}.`
    );
  }
});

const coordinationListCommand = defineCommand({
  meta: { name: "list", description: "Show local worker bindings and observations" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => listCoordinationBindings(coordinationRoot(args.root), args.task),
      (result) => {
        if (result.bindings.length === 0) return "No worker observations are recorded for this task.";
        const lines = result.bindings.map((binding) => {
          const observation = binding.stopped_at
            ? `stopped ${binding.stopped_at}`
            : binding.interrupted_at
              ? `interrupted ${binding.interrupted_at}`
              : binding.last_contact_at
                ? `contacted ${binding.last_contact_at}`
                : binding.started_at
                  ? `started ${binding.started_at}`
                  : "bound without a lifecycle observation";
          return `${coordinationWorkerLabel(binding.worker_ref)}  ${binding.role}  revision ${binding.implementation_revision}${binding.current_revision ? "" : " [stale]"}  ${observation}`;
        });
        if (result.invalid_records > 0) lines.push(`${result.invalid_records} invalid local binding record(s) were ignored.`);
        return lines.join("\n");
      }
    );
  }
});

export const coordinationCommand = defineCommand({
  meta: { name: "coordination", description: "Observe host-native workers without changing task completion" },
  subCommands: {
    assign: coordinationAssignCommand,
    message: coordinationMessageCommand,
    interrupt: coordinationInterruptCommand,
    list: coordinationListCommand
  }
});
