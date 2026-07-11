import { defineCommand } from "citty";
import { runCliAction } from "../cli-output.ts";
import { loadContextBundle, loadContextFiles, writeContextManifest } from "../context.ts";
import { OpenNoriError } from "../errors.ts";
import type { ContextEntry, ContextMode } from "../types.ts";
import { ROOT_ARGS, readProjectInput, readyProjectRoot } from "./common.ts";

function contextMaxBytes(value?: string): number | undefined {
  if (value === undefined) return undefined;
  const bytes = Number(value);
  if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > 1024 * 1024) {
    throw new OpenNoriError("context_budget_invalid", "Context max bytes must be an integer from 1 to 1048576.");
  }
  return bytes;
}

const contextWriteCommand = defineCommand({
  meta: { name: "write", description: "Write an implement or check context manifest" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    mode: { type: "enum", description: "Context mode", options: ["implement", "check"], required: true },
    input: { type: "string", description: "Project-relative JSON array of context entries", required: true, valueHint: "file" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => {
        const root = readyProjectRoot(args.root);
        const entries = readProjectInput<unknown>(root, args.input);
        if (!Array.isArray(entries)) throw new OpenNoriError("context_input_invalid", "Context input must be a JSON array.");
        return writeContextManifest(root, args.task, args.mode, entries as ContextEntry[]);
      },
      (entries) => `Wrote ${entries.length} ${args.mode} context entries.`
    );
  }
});

const contextShowCommand = defineCommand({
  meta: { name: "show", description: "Load and verify one context manifest" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    mode: { type: "enum", description: "Context mode", options: ["implement", "check"], required: true }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () => loadContextFiles(readyProjectRoot(args.root), args.task, args.mode as ContextMode),
      (entries) => (entries.length ? entries.map((entry) => `${entry.file}  ${entry.reason}`).join("\n") : `No ${args.mode} context.`)
    );
  }
});

const contextLoadCommand = defineCommand({
  meta: { name: "load", description: "Load bounded text content from one context manifest" },
  args: {
    ...ROOT_ARGS,
    task: { type: "positional", description: "Task id", required: true },
    mode: { type: "enum", description: "Context mode", options: ["implement", "check"], required: true },
    file: { type: "string", description: "Exact file registered in the context manifest", valueHint: "path" },
    "max-bytes": { type: "string", description: "Maximum complete-file content bytes", valueHint: "bytes" }
  },
  async run({ args }) {
    await runCliAction(
      args.json,
      () =>
        loadContextBundle(readyProjectRoot(args.root), args.task, args.mode as ContextMode, {
          file: args.file,
          maxBytes: contextMaxBytes(typeof args.maxBytes === "string" ? args.maxBytes : undefined)
        }),
      (bundle) => {
        const loaded = bundle.entries
          .map((entry) => `===== ${entry.file} =====\nReason: ${entry.reason}\n\n${entry.content.trimEnd()}`)
          .join("\n\n");
        const omitted = bundle.omitted
          .map((entry) => `Omitted ${entry.file} (${entry.bytes} bytes). Next: ${entry.recovery}`)
          .join("\n");
        return [loaded, omitted].filter(Boolean).join("\n\n");
      }
    );
  }
});

export const contextCommand = defineCommand({
  meta: { name: "context", description: "Curate separate implementation and verification context" },
  subCommands: { write: contextWriteCommand, show: contextShowCommand, load: contextLoadCommand }
});
