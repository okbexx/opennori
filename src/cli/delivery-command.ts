import { defineCommand } from "citty";
import { runCliAction } from "../cli-output.ts";
import { loadDelivery } from "../delivery-state.ts";
import { finalizeTaskDelivery, planTaskDelivery, recordTaskDelivery } from "../delivery.ts";
import { OpenNoriError } from "../errors.ts";
import { ROOT_ARGS, readyProjectRoot, requireTaskLocation } from "./common.ts";

const deliveryPlanCommand = defineCommand({
  meta: { name: "plan", description: "Choose commit, pull request, or explicitly waived delivery" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    mode: { type: "enum", description: "Delivery boundary", options: ["commit", "pull-request", "waived"], required: true },
    base: { type: "string", description: "Base branch or ref; required for pull requests" },
    branch: { type: "string", description: "Checked-out task branch" },
    remote: { type: "string", description: "Git remote for pull request delivery", default: "origin" },
    actor: { type: "string", description: "Person explicitly confirming a delivery waiver" },
    confirmation: { type: "string", description: "Stable host confirmation reference for a waiver" },
    reason: { type: "string", description: "Concrete reason Git delivery is waived" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () =>
        planTaskDelivery(readyProjectRoot(args.root), args.task, {
          mode: args.mode === "pull-request" ? "pull_request" : args.mode,
          base: args.base,
          branch: args.branch,
          remote: args.remote,
          actor: args.actor,
          hostConfirmationRef: args.confirmation,
          reason: args.reason
        }),
      (delivery) =>
        delivery.mode === "waived"
          ? `Recorded delivery waiver for ${delivery.task_id}.`
          : `Planned ${delivery.mode === "pull_request" ? "pull request" : "commit"} delivery for ${delivery.task_id} from ${delivery.base_commit}.`
    );
  }
});

const deliveryRecordCommand = defineCommand({
  meta: { name: "record", description: "Verify and record the delivered commit or pull request" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    commit: { type: "string", description: "Delivered commit ref", default: "HEAD" },
    pr: { type: "string", description: "Created pull request HTTPS URL" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => recordTaskDelivery(readyProjectRoot(args.root), args.task, { commit: args.commit, pullRequestUrl: args.pr }),
      (delivery) =>
        delivery.pull_request_url
          ? `Verified ${delivery.commit} in ${delivery.pull_request_url}.`
          : `Verified delivered commit ${delivery.commit}.`
    );
  }
});

const deliveryShowCommand = defineCommand({
  meta: { name: "show", description: "Show the task delivery plan and verified result" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const location = requireTaskLocation(readyProjectRoot(args.root), args.task);
        const delivery = loadDelivery(location.directory, args.task);
        if (!delivery) throw new OpenNoriError("delivery_not_found", `Task ${args.task} has no delivery plan.`);
        return delivery;
      },
      (delivery) =>
        delivery.mode === "waived"
          ? `Delivery waived by ${delivery.waiver?.actor}: ${delivery.waiver?.reason}`
          : `${delivery.mode} ${delivery.status}\nBase: ${delivery.base_commit}\nBranch: ${delivery.branch}${delivery.commit ? `\nCommit: ${delivery.commit}` : ""}${delivery.pull_request_url ? `\nPull request: ${delivery.pull_request_url}` : ""}`
    );
  }
});

const deliveryFinalizeCommand = defineCommand({
  meta: { name: "finalize", description: "Verify the clean archived Git checkpoint and pull request head" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Archived task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => finalizeTaskDelivery(readyProjectRoot(args.root), args.task),
      (delivery) =>
        delivery.pull_request_url
          ? `Completed: ${delivery.title}\nGit delivery: ${delivery.final_commit}\nPull request: ${delivery.pull_request_url}`
          : `Completed: ${delivery.title}\nGit delivery: ${delivery.final_commit}`
    );
  }
});

export const deliveryCommand = defineCommand({
  meta: { name: "delivery", description: "Plan and verify the task's Git delivery boundary" },
  subCommands: { plan: deliveryPlanCommand, record: deliveryRecordCommand, finalize: deliveryFinalizeCommand, show: deliveryShowCommand }
});
