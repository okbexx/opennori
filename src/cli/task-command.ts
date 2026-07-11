import { defineCommand } from "citty";
import { contextCommand } from "./context-command.ts";
import { contractCommand } from "./contract-command.ts";
import { coordinationCommand } from "./coordination-command.ts";
import { deliveryCommand } from "./delivery-command.ts";
import { evidenceCommand } from "./evidence-command.ts";
import { taskLifecycleCommands } from "./task-lifecycle-commands.ts";

export const taskCommand = defineCommand({
  meta: { name: "task", description: "Manage one durable OpenNori task" },
  subCommands: {
    ...taskLifecycleCommands,
    contract: contractCommand,
    context: contextCommand,
    evidence: evidenceCommand,
    delivery: deliveryCommand,
    coordination: coordinationCommand
  }
});
