import fs from "node:fs";
import path from "node:path";
import { loadContextBundle, loadContextManifest } from "./context.ts";
import { isFoundationProject, readProjectConfig } from "./project.ts";
import { loadCurrentTask, loadTaskView, taskDirectory, taskNextAction } from "./task.ts";
import type { ContextMode, PlatformId, TaskView } from "./types.ts";

const SESSION_CONTEXT_LIMIT = 48 * 1024;
const TURN_CONTEXT_LIMIT = 8 * 1024;

export type HostHookInput = {
  session_id: string;
  cwd: string;
  hook_event_name: "SessionStart" | "UserPromptSubmit" | "SubagentStart";
};

export type HostHookContext = {
  hook_event_name: HostHookInput["hook_event_name"];
  project_root: string;
  task_id: string | null;
  context: string;
};

/** Build bounded developer context without changing canonical workflow state. */
export function buildHostHookContext(input: HostHookInput, platform: PlatformId): HostHookContext | null {
  if (!input.session_id?.trim() || !input.cwd?.trim()) return null;
  const root = findFoundationProjectRoot(input.cwd);
  if (!root) return null;
  if (!readProjectConfig(root).platforms.includes(platform)) return null;
  const task = loadCurrentTask(root, { sessionKey: input.session_id });
  if (!task) {
    if (input.hook_event_name === "SubagentStart") return null;
    return {
      hook_event_name: input.hook_event_name,
      project_root: root,
      task_id: null,
      context: renderNoTaskContext()
    };
  }
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

export function buildCodexHookContext(input: HostHookInput): HostHookContext | null {
  return buildHostHookContext(input, "codex");
}

export function buildClaudeHookContext(input: HostHookInput): HostHookContext | null {
  return buildHostHookContext(input, "claude");
}

function renderNoTaskContext(): string {
  return [
    "<opennori-context>",
    "OpenNori is available in this initialized project, but no task is selected for this session.",
    "Load the nori Skill and follow its task routing protocol.",
    "</opennori-context>"
  ].join("\n");
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
  const directory = taskDirectory(root, view.task.id);
  const documents = ["contract.md", "design.md", "plan.md"].filter((name) => isRegularTaskDocument(directory, name));
  if (documents.length > 0) {
    lines.push("Task documents:", ...documents.map((name) => `- ${path.posix.join(posixTaskDirectory(view.task.id), name)}`));
  }
  if (!mode) {
    lines.push("Use the matching OpenNori Skill and CLI stage command.", "</opennori-context>");
    return lines.join("\n");
  }

  try {
    const manifest = loadContextManifest(root, view.task.id, mode);
    if (manifest.length > 0) {
      lines.push(`Optional ${mode} context:`);
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
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    lines.push(`Optional ${mode} context is unavailable: ${message}`);
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

function posixTaskDirectory(taskId: string): string {
  return `.opennori/tasks/${taskId}`;
}

function isRegularTaskDocument(directory: string, name: string): boolean {
  const filePath = path.join(directory, name);
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.lstatSync(filePath);
  return stat.isFile() && !stat.isSymbolicLink();
}
