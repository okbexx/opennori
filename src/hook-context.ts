import path from "node:path";
import { loadContextBundle, loadContextManifest } from "./context.ts";
import { isFoundationProject } from "./project.ts";
import { loadCurrentTask, loadTaskView, taskNextAction } from "./task.ts";
import type { ContextMode, TaskView } from "./types.ts";

const SESSION_CONTEXT_LIMIT = 48 * 1024;
const TURN_CONTEXT_LIMIT = 8 * 1024;

export type CodexHookInput = {
  session_id: string;
  cwd: string;
  hook_event_name: "SessionStart" | "UserPromptSubmit" | "SubagentStart";
};

export type CodexHookContext = {
  hook_event_name: CodexHookInput["hook_event_name"];
  project_root: string;
  task_id: string;
  context: string;
};

/** Build bounded developer context without changing canonical workflow state. */
export function buildCodexHookContext(input: CodexHookInput): CodexHookContext | null {
  if (!input.session_id?.trim() || !input.cwd?.trim()) return null;
  const root = findFoundationProjectRoot(input.cwd);
  if (!root) return null;
  const task = loadCurrentTask(root, { sessionKey: input.session_id });
  if (!task) return null;
  const view = loadTaskView(root, task.id);
  const mode = contextMode(view);
  const limit = input.hook_event_name === "UserPromptSubmit" ? TURN_CONTEXT_LIMIT : SESSION_CONTEXT_LIMIT;
  return {
    hook_event_name: input.hook_event_name,
    project_root: root,
    task_id: task.id,
    context: renderHookContext(root, view, mode, limit)
  };
}

export function findFoundationProjectRoot(start: string): string | null {
  let current = path.resolve(start);
  while (true) {
    const parent = path.dirname(current);
    if (parent === current) return null;
    if (isFoundationProject(current)) return current;
    current = parent;
  }
}

function contextMode(view: TaskView): ContextMode | null {
  if (view.phase === "implement") return "implement";
  if (view.phase === "verify") return "check";
  return null;
}

function renderHookContext(root: string, view: TaskView, mode: ContextMode | null, limit: number): string {
  const lines = [
    "<opennori-context>",
    `Task: ${view.task.id} - ${view.task.title}`,
    `Stage: ${view.phase}`,
    `Contract: ${view.contract?.status ?? "missing"}`,
    `Delivery: ${view.task.delivery_required ? (view.delivery_ready ? "ready" : view.delivery?.status ?? "missing") : "not required"}`,
    `Finish ready: ${view.finish_ready ? "yes" : "no"}`,
    `Current gap: ${view.current_gap ? `${view.current_gap.id} (${view.current_gap.status})` : "none"}`,
    `Next: ${taskNextAction(view)}`
  ];
  if (view.task.package) lines.push(`Package: ${view.task.package}`);
  if (!mode) {
    lines.push("Use the matching OpenNori Skill and CLI stage command.", "</opennori-context>");
    return lines.join("\n");
  }

  const manifest = loadContextManifest(root, view.task.id, mode);
  lines.push(`Curated ${mode} context:`);
  for (const entry of manifest) lines.push(`- ${entry.file}: ${entry.reason}`);
  const bundle = loadContextBundle(root, view.task.id, mode);
  for (const entry of bundle.entries) {
    const block = [`\n## ${entry.file}`, `Reason: ${entry.reason}`, entry.content].join("\n");
    const current = Buffer.byteLength(lines.join("\n"), "utf8");
    if (current + Buffer.byteLength(block, "utf8") + 64 <= limit) lines.push(block);
    else {
      lines.push(
        `\n## ${entry.file}\nContent omitted from this bounded hook; run opennori task context load ${view.task.id} --mode ${mode} --file ${entry.file} --json.`
      );
    }
  }
  lines.push("</opennori-context>");
  const output = lines.join("\n");
  if (Buffer.byteLength(output, "utf8") <= limit) return output;
  return [
    "<opennori-context>",
    `Task: ${view.task.id} - ${view.task.title}`,
    `Stage: ${view.phase}`,
    `Next: ${taskNextAction(view)}`,
    `Curated ${mode} context exceeds the hook budget; run opennori task context show ${view.task.id} --mode ${mode} --json, then load selected files.`,
    "</opennori-context>"
  ].join("\n");
}
