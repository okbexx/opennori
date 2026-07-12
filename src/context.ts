import fs from "node:fs";
import path from "node:path";
import { OpenNoriError } from "./errors.ts";
import { posixRelative, readJsonLines, safeProjectPath, writeTextAtomic } from "./io.ts";
import { findTask } from "./task.ts";
import type { ContextEntry, ContextMode } from "./types.ts";
import { assertSchema } from "./validation.ts";
import { withTaskLock } from "./task-lock.ts";

const MAX_CONTEXT_FILE_BYTES = 256 * 1024;
const MAX_CONTEXT_TOTAL_BYTES = 1024 * 1024;

export type LoadedContextEntry = ContextEntry & {
  content: string;
  bytes: number;
};

export type ContextBundle = {
  mode: ContextMode;
  entries: LoadedContextEntry[];
  total_bytes: number;
  omitted: ContextOmission[];
};

export type ContextOmission = ContextEntry & {
  bytes: number;
  recovery: string;
};

export type ContextLoadOptions = {
  file?: string;
  maxBytes?: number;
};

export function writeContextManifest(root: string, taskId: string, mode: ContextMode, entries: ContextEntry[]): ContextEntry[] {
  return withTaskLock(root, taskId, () => writeContextManifestUnlocked(root, taskId, mode, entries));
}

function writeContextManifestUnlocked(root: string, taskId: string, mode: ContextMode, entries: ContextEntry[]): ContextEntry[] {
  const location = requireWritableTask(root, taskId);
  const validated = validateEntries(root, entries);
  const content = validated.map((entry) => JSON.stringify(entry)).join("\n");
  writeTextAtomic(manifestPath(root, location.directory, mode), content ? `${content}\n` : "");
  return validated;
}

export function loadContextManifest(root: string, taskId: string, mode: ContextMode): ContextEntry[] {
  const location = requireActiveTask(root, taskId);
  const filePath = manifestPath(root, location.directory, mode);
  if (!fs.existsSync(filePath)) return [];
  return validateEntries(root, readJsonLines<ContextEntry>(filePath));
}

export function loadContextFiles(
  root: string,
  taskId: string,
  mode: ContextMode
): Array<ContextEntry & { absolute_path: string }> {
  return loadContextManifest(root, taskId, mode).map((entry) => ({
    ...entry,
    absolute_path: safeProjectPath(root, entry.file)
  }));
}

/** Load curated text context with fixed bounds so one manifest cannot flood an agent session. */
export function loadContextBundle(
  root: string,
  taskId: string,
  mode: ContextMode,
  options: ContextLoadOptions = {}
): ContextBundle {
  const manifestFiles = loadContextFiles(root, taskId, mode);
  const requestedFile = options.file?.trim();
  const files = requestedFile
    ? manifestFiles.filter((entry) => entry.file === requestedFile)
    : manifestFiles;
  if (requestedFile && files.length === 0) {
    throw new OpenNoriError("context_file_not_registered", `${requestedFile} is not registered in ${mode} context.`, {
      context: { file: requestedFile, mode },
      recovery: `Run opennori task context show ${taskId} --mode ${mode} --json and choose an exact manifest file.`
    });
  }
  const maxBytes = options.maxBytes ?? MAX_CONTEXT_TOTAL_BYTES;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_CONTEXT_TOTAL_BYTES) {
    throw new OpenNoriError("context_budget_invalid", "Context max bytes must be an integer from 1 to 1048576.");
  }
  let totalBytes = 0;
  const entries: LoadedContextEntry[] = [];
  const omitted: ContextOmission[] = [];
  for (const { absolute_path: absolutePath, file, reason } of files) {
    const safePath = safeProjectPath(root, file);
    if (safePath !== absolutePath) throw new OpenNoriError("context_path_changed", `Context path changed while loading: ${file}.`);
    const data = fs.readFileSync(safePath);
    const bytes = data.byteLength;
    if (bytes > MAX_CONTEXT_FILE_BYTES) {
      throw new OpenNoriError("context_file_too_large", `Context file exceeds 256 KiB: ${file}.`, {
        context: { file, bytes, limit: MAX_CONTEXT_FILE_BYTES },
        recovery: "Reference a smaller focused file or move the relevant excerpt into task research."
      });
    }
    if (totalBytes + bytes > maxBytes) {
      if (requestedFile) {
        throw new OpenNoriError("context_budget_too_small", `Context budget is smaller than ${file}.`, {
          context: { file, bytes, max_bytes: maxBytes },
          recovery: `Rerun with --max-bytes ${bytes}, up to the 1048576 byte product limit.`
        });
      }
      if (options.maxBytes !== undefined) {
        omitted.push({
          file,
          reason,
          bytes,
          recovery: `opennori task context load ${taskId} --mode ${mode} --file ${file} --json`
        });
        continue;
      }
      throw new OpenNoriError("context_bundle_too_large", `${mode} context exceeds 1 MiB.`, {
        context: { bytes: totalBytes + bytes, limit: MAX_CONTEXT_TOTAL_BYTES },
        recovery: "Remove unrelated context entries and load the manifest again."
      });
    }
    if (data.includes(0)) {
      throw new OpenNoriError("context_binary_unsupported", `Context file is not plain text: ${file}.`, {
        recovery: "Use a text description or reviewable artifact path instead of loading binary content."
      });
    }
    let content: string;
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(data);
    } catch {
      throw new OpenNoriError("context_encoding_unsupported", `Context file is not valid UTF-8: ${file}.`, {
        recovery: "Convert the file to UTF-8 or use a text description in task research."
      });
    }
    entries.push({ file, reason, content, bytes });
    totalBytes += bytes;
  }
  return { mode, entries, total_bytes: totalBytes, omitted };
}

function validateEntries(root: string, entries: ContextEntry[]): ContextEntry[] {
  const seen = new Set<string>();
  return entries.map((entry) => {
    assertSchema<ContextEntry>("context", entry);
    const absolutePath = safeProjectPath(root, entry.file);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      throw new OpenNoriError("context_file_missing", `Context file does not exist: ${entry.file}.`, {
        context: { file: entry.file }
      });
    }
    const file = posixRelative(root, absolutePath);
    if (seen.has(file)) throw new OpenNoriError("context_file_duplicate", `Context manifest repeats ${file}.`);
    seen.add(file);
    const reason = entry.reason.trim();
    if (!reason) throw new OpenNoriError("context_reason_empty", `Context entry ${file} needs a reason.`);
    return { file, reason };
  });
}

function manifestPath(root: string, taskDirectory: string, mode: ContextMode): string {
  if (mode !== "implement" && mode !== "check") {
    throw new OpenNoriError("context_mode_invalid", `Unsupported context mode: ${String(mode)}.`);
  }
  const relativeTask = posixRelative(root, taskDirectory);
  return safeProjectPath(root, path.posix.join(relativeTask, `${mode}.jsonl`));
}

function requireActiveTask(root: string, taskId: string): NonNullable<ReturnType<typeof findTask>> {
  const location = findTask(root, taskId);
  if (!location) throw new OpenNoriError("task_not_found", `Task ${taskId} was not found.`);
  if (location.archived) throw new OpenNoriError("task_archived", `Task ${taskId} is archived and its context is read-only.`);
  return location;
}

function requireWritableTask(root: string, taskId: string): NonNullable<ReturnType<typeof findTask>> {
  const location = requireActiveTask(root, taskId);
  if (location.task.status === "completed") {
    throw new OpenNoriError("task_completed", `Task ${taskId} is completed and its context is read-only.`);
  }
  return location;
}
