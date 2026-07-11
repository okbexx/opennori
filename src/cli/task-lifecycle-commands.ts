import path from "node:path";
import { defineCommand } from "citty";
import { retryStateBusy, runCliAction } from "../cli-output.ts";
import { asOpenNoriError, OpenNoriError } from "../errors.ts";
import { developerSlug, readProjectConfig } from "../project.ts";
import {
  appendJournalEntry,
  buildCompletionSummary,
  renderCompletionSummary,
  validateJournalEntry,
  writeTaskReport
} from "../report.ts";
import {
  archiveTask,
  blockTask,
  createTask,
  finalizeTaskArchive,
  finishTask,
  listTasks,
  loadCurrentTask,
  loadTaskView,
  replanTask,
  reviewTask,
  rollbackTaskArchive,
  selectTask,
  startTask,
  unblockTask
} from "../task.ts";
import { withTaskLock } from "../task-lock.ts";
import { ROOT_ARGS, SESSION_ARG, hostSessionKey, readyProjectRoot, requireTaskLocation } from "./common.ts";
import { renderTaskView } from "./task-view.ts";

const taskCreateCommand = defineCommand({
  meta: { name: "create", description: "Create one planning task" },
  args: {
    ...ROOT_ARGS,
    title: { type: "string", description: "Task title", required: true },
    description: { type: "string", description: "Task boundary", default: "" },
    priority: { type: "enum", description: "Task priority", options: ["P0", "P1", "P2", "P3"], default: "P2" },
    package: { type: "string", description: "Optional package scope" },
    slug: { type: "string", description: "ASCII task id suffix" },
    ...SESSION_ARG
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      async () => {
        const root = readyProjectRoot(args.root);
        const config = readProjectConfig(root);
        const created = await retryStateBusy(() =>
          createTask(root, {
            title: args.title,
            description: args.description,
            creator: config.developer,
            priority: args.priority,
            package: args.package,
            slug: args.slug
          })
        );
        const sessionKey = hostSessionKey(args.session);
        let selected = false;
        let selection_error: string | null = null;
        if (sessionKey) {
          try {
            await retryStateBusy(() => selectTask(root, created.task.id, { sessionKey }));
            selected = true;
          } catch (error) {
            const failure = asOpenNoriError(error);
            if (failure.code !== "state_busy") throw error;
            selection_error = failure.code;
          }
        }
        return { ...created, selected, selection_error };
      },
      (result) =>
        result.selection_error
          ? `Created ${result.task.id}: ${result.task.title}\nSelection is still busy. Next: retry task selection with the same --root and --session values.`
          : `Created ${result.task.id}: ${result.task.title}\nNext: Draft and review its Nori Contract.`,
      { retryBusy: false }
    );
  }
});

const taskListCommand = defineCommand({
  meta: { name: "list", description: "List active or archived tasks" },
  args: { ...ROOT_ARGS, archived: { type: "boolean", description: "Include archived tasks", default: false } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        return listTasks(root, { includeArchived: args.archived });
      },
      (tasks) =>
        tasks.length === 0
          ? "No OpenNori tasks."
          : tasks.map(({ task, archived }) => `${task.id}  ${task.status.padEnd(11)} ${task.title}${archived ? " [archived]" : ""}`).join("\n")
    );
  }
});

const taskShowCommand = defineCommand({
  meta: { name: "show", description: "Show one task and its derived Outcome state" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(args.json, () => loadTaskView(readyProjectRoot(args.root), args.task), renderTaskView);
  }
});

const taskStartCommand = defineCommand({
  meta: { name: "start", description: "Start approved implementation and select it for this session" },
  args: { ...ROOT_ARGS, ...SESSION_ARG, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => startTask(readyProjectRoot(args.root), args.task, { sessionKey: hostSessionKey(args.session) }),
      (task) => `Started ${task.id}.\nNext: Load implement context and implement the approved Contract.`
    );
  }
});

const taskSelectCommand = defineCommand({
  meta: { name: "select", description: "Select an active task for this host session" },
  args: { ...ROOT_ARGS, ...SESSION_ARG, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => selectTask(readyProjectRoot(args.root), args.task, { sessionKey: hostSessionKey(args.session) }),
      (task) => `Selected ${task.id} for this session.`
    );
  }
});

const taskCurrentCommand = defineCommand({
  meta: { name: "current", description: "Read this session's selected task" },
  args: { ...ROOT_ARGS, ...SESSION_ARG },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const task = loadCurrentTask(root, { sessionKey: hostSessionKey(args.session) });
        return task ? loadTaskView(root, task.id) : null;
      },
      (view) => (view ? renderTaskView(view) : "No current task is selected for this session.")
    );
  }
});

const taskReviewCommand = defineCommand({
  meta: { name: "review", description: "Move an implemented task into Verify" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => reviewTask(readyProjectRoot(args.root), args.task),
      (task) => `${task.id} is ready for independent verification.`
    );
  }
});

const taskReplanCommand = defineCommand({
  meta: { name: "replan", description: "Return to Plan before Outcome evidence exists" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    reason: { type: "string", description: "Scope or Contract conflict", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => replanTask(readyProjectRoot(args.root), args.task, args.reason),
      (task) => `${task.id} returned to Plan.\nNext: Revise and reapprove its Nori Contract.`
    );
  }
});

const taskBlockCommand = defineCommand({
  meta: { name: "block", description: "Record a blocker without changing the current stage" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    reason: { type: "string", description: "Concrete blocker", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => blockTask(readyProjectRoot(args.root), args.task, args.reason),
      (task) => `${task.id} remains ${task.status} and is blocked: ${task.blocker}`
    );
  }
});

const taskUnblockCommand = defineCommand({
  meta: { name: "unblock", description: "Clear a resolved blocker without changing stage" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => unblockTask(readyProjectRoot(args.root), args.task),
      (task) => `${task.id} is unblocked and remains ${task.status}.`
    );
  }
});

const taskFinishCommand = defineCommand({
  meta: { name: "finish", description: "Complete a verified task when required Outcomes are resolved" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => finishTask(readyProjectRoot(args.root), args.task),
      (task) =>
        `Required results and Git delivery are verified for ${task.id}.\nNext: Preserve reusable project knowledge and archive the task.`
    );
  }
});

const taskArchiveCommand = defineCommand({
  meta: { name: "archive", description: "Finalize the report and journal while archiving a completed task" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    summary: { type: "string", description: "Durable journal summary", required: true },
    knowledge: {
      type: "enum",
      description: "Whether stable project knowledge was promoted",
      options: ["promoted", "none"],
      required: true
    },
    "knowledge-summary": { type: "string", description: "What was promoted or why none was needed", required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const config = readProjectConfig(root);
        return withTaskLock(root, args.task, () => {
          const initialLocation = requireTaskLocation(root, args.task);
          const task = initialLocation.task;
          if (task.status !== "completed") throw new OpenNoriError("task_not_completed", `Task ${task.id} is not completed.`);
          const view = loadTaskView(root, task.id);
          const journalEntry = {
            task_id: task.id,
            title: task.title,
            summary: args.summary,
            status: "completed",
            knowledge: args.knowledge,
            knowledge_summary: args["knowledge-summary"],
            commits: view.delivery?.commit ? [view.delivery.commit] : []
          } as const;
          validateJournalEntry(journalEntry);
          const summary = buildCompletionSummary(view, {
            decision: args.knowledge,
            summary: args["knowledge-summary"]
          });
          writeTaskReport(root, task.id);
          const archived = archiveTask(root, task.id);
          const movedByThisCommand = !initialLocation.archived;
          try {
            const journal = appendJournalEntry(root, developerSlug(config.developer), journalEntry);
            finalizeTaskArchive(root, task.id);
            return {
              task: archived.task,
              directory: archived.directory,
              report: path.join(archived.directory, "report.md"),
              journal,
              summary
            };
          } catch (error) {
            if (movedByThisCommand) rollbackTaskArchive(root, task.id);
            throw error;
          }
        });
      },
      (result) => {
        const summary = `${renderCompletionSummary(result.summary)}\nReport: ${result.report}\nJournal: ${result.journal}`;
        return !result.task.delivery_required || result.summary.delivery?.mode === "waived"
          ? `${summary}\nCompletion is recorded; no additional Git verification is required.`
          : `${summary}\nNext: Commit the final report and project knowledge, then run opennori task delivery finalize ${result.task.id}.`;
      }
    );
  }
});

const taskReportCommand = defineCommand({
  meta: { name: "report", description: "Generate a human-readable task report" },
  args: { ...ROOT_ARGS, task: { type: "positional", description: "Task id", required: true } },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => ({ path: writeTaskReport(readyProjectRoot(args.root), args.task) }),
      (result) => `Wrote ${result.path}`
    );
  }
});

export const taskLifecycleCommands = {
  create: taskCreateCommand,
  list: taskListCommand,
  show: taskShowCommand,
  select: taskSelectCommand,
  start: taskStartCommand,
  current: taskCurrentCommand,
  block: taskBlockCommand,
  unblock: taskUnblockCommand,
  replan: taskReplanCommand,
  review: taskReviewCommand,
  finish: taskFinishCommand,
  archive: taskArchiveCommand,
  report: taskReportCommand
};
