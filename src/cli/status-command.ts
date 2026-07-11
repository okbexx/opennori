import { defineCommand } from "citty";
import { runCliAction } from "../cli-output.ts";
import { readProjectConfig } from "../project.ts";
import { listTasks, loadCurrentTask, loadTaskView, taskNextAction } from "../task.ts";
import { ROOT_ARGS, SESSION_ARG, hostSessionKey, readyProjectRoot } from "./common.ts";
import { renderTaskView, summarizeTaskView } from "./task-view.ts";

function loadStatusState(rootValue: string, session?: string) {
  const root = readyProjectRoot(rootValue);
  const config = readProjectConfig(root);
  const sessionKey = hostSessionKey(session);
  const currentTask = sessionKey ? loadCurrentTask(root, { sessionKey }) : null;
  const current = currentTask ? loadTaskView(root, currentTask.id) : null;
  const active = listTasks(root).map((location) => location.task);
  return {
    project: { root, developer: config.developer, platforms: config.platforms },
    current,
    active_tasks: active,
    next_action: current
      ? taskNextAction(current)
      : active.length > 0
        ? "Select an active task or continue its planning conversation."
        : "Create a task and draft its Nori Contract."
  };
}

function summarizeStatusState(state: ReturnType<typeof loadStatusState>) {
  return {
    project: state.project,
    current: state.current ? summarizeTaskView(state.current) : null,
    active_tasks: state.active_tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      implementation_revision: task.implementation_revision,
      package: task.package ?? null,
      blocker: task.blocker ?? null
    })),
    next_action: state.next_action
  };
}

export const statusCommand = defineCommand({
  meta: { name: "status", description: "Show current task, stage, gap, and next action" },
  args: {
    ...ROOT_ARGS,
    ...SESSION_ARG,
    summary: { type: "boolean", description: "Omit raw Evidence sources from JSON output", default: false }
  },
  async run({ args }) {
    if (args.json && args.summary) {
      await runCliAction(
        true,
        () => summarizeStatusState(loadStatusState(args.root, args.session)),
        () => ""
      );
      return;
    }
    await runCliAction(
      args.json,
      () => loadStatusState(args.root, args.session),
      (result) => {
        if (result.current) return renderTaskView(result.current);
        return [
          "No OpenNori task is selected in this conversation.",
          `Active tasks: ${result.active_tasks.length}`,
          result.active_tasks.length > 0
            ? "Next: Ask the agent to continue or select an active task."
            : "Next: Start a goal in a new agent conversation."
        ].join("\n");
      }
    );
  }
});
