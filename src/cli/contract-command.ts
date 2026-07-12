import { defineCommand } from "citty";
import { runCliAction } from "../cli-output.ts";
import { approveContract, loadContract, renderContractMarkdown, writeContractDraft } from "../contract.ts";
import { loadTask, taskDirectory } from "../task.ts";
import type { ContractInput } from "../types.ts";
import { ROOT_ARGS, readProjectInput, readyProjectRoot, requireTaskLocation } from "./common.ts";

const contractWriteCommand = defineCommand({
  meta: { name: "write", description: "Write a draft Contract from project-local JSON" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    input: { type: "string", description: "Project-relative Contract input JSON", required: true, valueHint: "file" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const task = loadTask(root, args.task);
        return writeContractDraft(taskDirectory(root, task.id), task, readProjectInput<ContractInput>(root, args.input));
      },
      (contract) => `Drafted Contract for ${contract.task_id} with ${contract.outcomes.length} Outcomes.`
    );
  }
});

const contractApproveCommand = defineCommand({
  meta: { name: "approve", description: "Record a confirmed human approval of the reviewed Contract" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    approver: { type: "string", description: "Person who explicitly approved the Contract", required: true },
    confirmation: { type: "string", description: "Stable host confirmation reference, when available" },
    note: { type: "string", description: "Optional approval note" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const task = loadTask(root, args.task);
        return approveContract(taskDirectory(root, task.id), task, {
          approver: args.approver,
          host_confirmation_ref: args.confirmation,
          note: args.note
        });
      },
      (contract) =>
        `Recorded Contract approval by ${contract.approval?.approver} for ${contract.task_id}.\nNext: Start the task in a stable session.`
    );
  }
});

const contractShowCommand = defineCommand({
  meta: { name: "show", description: "Show the canonical Contract" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        return loadContract(requireTaskLocation(root, args.task).directory, args.task);
      },
      (contract) => renderContractMarkdown(contract).trimEnd()
    );
  }
});

export const contractCommand = defineCommand({
  meta: { name: "contract", description: "Draft, inspect, and approve the task Contract" },
  subCommands: { write: contractWriteCommand, approve: contractApproveCommand, show: contractShowCommand }
});
