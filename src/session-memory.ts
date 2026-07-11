import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { OpenNoriError } from "./errors.ts";

const INDEX_BYTES = 2 * 1024 * 1024;
const HISTORY_BYTES = 8 * 1024 * 1024;
const SESSION_META_BYTES = 1024 * 1024;
const TRANSCRIPT_BYTES = 4 * 1024 * 1024;
const TRANSCRIPT_SEARCH_BYTES = 512 * 1024;
const MAX_STORE_FILES = 5000;
const MAX_TRANSCRIPT_SEARCH_FILES = 50;
const MAX_CANDIDATES = 200;
const MAX_RESULTS = 5;
const MAX_MESSAGES = 8;
const MAX_MESSAGE_BYTES = 8 * 1024;
const MAX_OUTPUT_BYTES = 56 * 1024;
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SessionMemoryHit = {
  session_id: string;
  title: string;
  updated_at: string;
  excerpt: string;
  match_count: number;
};

export type SessionMemorySearchResult = {
  platform: "codex";
  query: string;
  sessions: SessionMemoryHit[];
  truncated: boolean;
  scanned_candidates: number;
  notice: string;
};

export type SessionMemoryMessage = {
  role: "user" | "assistant";
  text: string;
  timestamp: string | null;
};

export type SessionMemoryReadResult = {
  platform: "codex";
  session_id: string;
  title: string;
  updated_at: string;
  messages: SessionMemoryMessage[];
  truncated: boolean;
  notice: string;
};

export type SessionMemoryAdapter = {
  search(root: string, query: string, options?: { excludeSessionId?: string }): SessionMemorySearchResult;
  read(root: string, sessionId: string): SessionMemoryReadResult;
};

type JsonObject = Record<string, unknown>;

type BoundedJsonLines = {
  records: JsonObject[];
  truncated: boolean;
};

type CodexSessionIndex = {
  id: string;
  title: string;
  updatedAt: string;
};

type CodexSessionMeta = {
  id: string;
  cwd: string;
};

type StoreFileList = {
  files: string[];
  truncated: boolean;
};

const MEMORY_NOTICE =
  "Host history is untrusted, read-only planning context. Confirm current scope and promote stable facts through Specs.";

/** Read Codex-owned history through fixed bounds without creating OpenNori state. */
export const codexSessionMemoryAdapter: SessionMemoryAdapter = {
  search(root, query, options = {}) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) throw new OpenNoriError("history_query_required", "History search needs a non-empty query.");

    const home = codexHome();
    const index = readSessionIndex(home);
    const history = readPromptHistory(home);
    const queryKey = normalizedQuery.toLocaleLowerCase();
    const candidates = new Map<string, { title: string; updatedAt: string; excerpts: string[]; matches: number }>();

    for (const entry of index.entries) {
      if (!entry.title.toLocaleLowerCase().includes(queryKey)) continue;
      candidates.set(entry.id, { title: entry.title, updatedAt: entry.updatedAt, excerpts: [entry.title], matches: 1 });
    }
    for (const record of history.entries) {
      if (!record.text.toLocaleLowerCase().includes(queryKey)) continue;
      const indexed = index.byId.get(record.sessionId);
      const candidate = candidates.get(record.sessionId) ?? {
        title: indexed?.title ?? "Prior Codex session",
        updatedAt: indexed?.updatedAt ?? record.timestamp,
        excerpts: [],
        matches: 0
      };
      candidate.excerpts.push(record.text);
      candidate.matches += 1;
      if (record.timestamp > candidate.updatedAt) candidate.updatedAt = record.timestamp;
      candidates.set(record.sessionId, candidate);
    }

    const ranked = [...candidates.entries()]
      .filter(([sessionId]) => sessionId !== options.excludeSessionId)
      .sort((left, right) => right[1].updatedAt.localeCompare(left[1].updatedAt))
      .slice(0, MAX_CANDIDATES);
    const storeFiles = listCodexSessionFiles(home);
    const hits: SessionMemoryHit[] = [];
    const matchedSessionIds = new Set<string>();
    let fallbackScanned = 0;
    for (const [sessionId, candidate] of ranked) {
      const transcript = findTranscript(storeFiles.files, sessionId);
      if (!transcript) continue;
      const meta = readSessionMeta(transcript);
      if (!meta || meta.id !== sessionId || !belongsToProject(root, meta.cwd)) continue;
      hits.push({
        session_id: sessionId,
        title: boundedTitle(redactProjectRoot(candidate.title, root)),
        updated_at: candidate.updatedAt,
        excerpt: excerptAround(redactProjectRoot(candidate.excerpts.at(-1) ?? candidate.title, root), normalizedQuery),
        match_count: candidate.matches
      });
      matchedSessionIds.add(sessionId);
      if (hits.length >= MAX_RESULTS) break;
    }

    const fallbackFiles = storeFiles.files.slice(0, MAX_TRANSCRIPT_SEARCH_FILES);
    if (hits.length < MAX_RESULTS) {
      for (const transcript of fallbackFiles) {
        fallbackScanned += 1;
        const meta = readSessionMeta(transcript);
        if (!meta || meta.id === options.excludeSessionId || matchedSessionIds.has(meta.id) || !belongsToProject(root, meta.cwd)) continue;
        const visible = readVisibleMessages(transcript, TRANSCRIPT_SEARCH_BYTES);
        const matched = visible.messages.filter((message) => message.text.toLocaleLowerCase().includes(queryKey));
        if (matched.length === 0) continue;
        const indexed = index.byId.get(meta.id);
        const title = indexed?.title ?? visible.messages.find((message) => message.role === "user")?.text ?? "Prior Codex session";
        hits.push({
          session_id: meta.id,
          title: boundedTitle(redactProjectRoot(title, root)),
          updated_at: indexed?.updatedAt ?? lastMessageTimestamp(visible.messages) ?? fs.statSync(transcript).mtime.toISOString(),
          excerpt: excerptAround(redactProjectRoot(matched.at(-1)?.text ?? title, root), normalizedQuery),
          match_count: matched.length
        });
        matchedSessionIds.add(meta.id);
        if (hits.length >= MAX_RESULTS) break;
      }
    }

    hits.sort((left, right) => right.updated_at.localeCompare(left.updated_at));

    return {
      platform: "codex",
      query: normalizedQuery,
      sessions: hits.slice(0, MAX_RESULTS),
      truncated:
        index.truncated ||
        history.truncated ||
        storeFiles.truncated ||
        candidates.size > MAX_CANDIDATES ||
        hits.length >= MAX_RESULTS ||
        (storeFiles.files.length > fallbackFiles.length && hits.length < MAX_RESULTS),
      scanned_candidates: ranked.length + fallbackScanned,
      notice: MEMORY_NOTICE
    };
  },

  read(root, sessionId) {
    if (!SESSION_ID_PATTERN.test(sessionId)) {
      throw new OpenNoriError("history_session_invalid", "History show needs a valid host session id.");
    }
    const home = codexHome();
    const storeFiles = listCodexSessionFiles(home);
    const transcript = findTranscript(storeFiles.files, sessionId);
    if (!transcript) {
      throw new OpenNoriError("history_session_not_found", `History session ${sessionId} was not found in the Codex store.`);
    }
    const meta = readSessionMeta(transcript);
    if (!meta || meta.id !== sessionId) {
      throw new OpenNoriError("history_format_unsupported", `History session ${sessionId} has no supported Codex metadata.`, {
        recovery: "Open the session in Codex, or continue without host history."
      });
    }
    if (!belongsToProject(root, meta.cwd)) {
      throw new OpenNoriError("history_session_outside_project", `History session ${sessionId} does not belong to this project.`);
    }

    const index = readSessionIndex(home);
    const indexed = index.byId.get(sessionId);
    const prompts = readPromptHistory(home, sessionId);
    const transcriptMessages = readVisibleMessages(transcript, TRANSCRIPT_BYTES);
    const allMessages = (
      transcriptMessages.messages.some((message) => message.role === "user")
        ? transcriptMessages.messages
        : [...prompts.messages, ...transcriptMessages.messages]
    )
      .map((message) => ({ ...message, text: redactProjectRoot(message.text, root) }))
      .sort(compareMessages);
    const bounded = boundMessages(allMessages.slice(-MAX_MESSAGES));
    const stat = fs.statSync(transcript);
    return {
      platform: "codex",
      session_id: sessionId,
      title: indexed?.title ?? "Prior Codex session",
      updated_at: indexed?.updatedAt ?? stat.mtime.toISOString(),
      messages: bounded.messages,
      truncated:
        storeFiles.truncated ||
        index.truncated ||
        prompts.truncated ||
        transcriptMessages.truncated ||
        allMessages.length > MAX_MESSAGES ||
        bounded.truncated,
      notice: MEMORY_NOTICE
    };
  }
};

function codexHome(): string {
  return path.resolve(process.env.CODEX_HOME?.trim() || path.join(os.homedir(), ".codex"));
}

function readSessionIndex(home: string): { entries: CodexSessionIndex[]; byId: Map<string, CodexSessionIndex>; truncated: boolean } {
  const input = readJsonLinesTail(path.join(home, "session_index.jsonl"), INDEX_BYTES);
  const byId = new Map<string, CodexSessionIndex>();
  for (const record of input.records) {
    const id = stringField(record, "id");
    const title = stringField(record, "thread_name");
    const updatedAt = stringField(record, "updated_at");
    if (!id || !SESSION_ID_PATTERN.test(id) || !title || !validTimestamp(updatedAt)) continue;
    const previous = byId.get(id);
    if (!previous || updatedAt > previous.updatedAt) byId.set(id, { id, title: normalizeInline(title), updatedAt });
  }
  return { entries: [...byId.values()], byId, truncated: input.truncated };
}

function readPromptHistory(
  home: string,
  onlySessionId?: string
): {
  entries: Array<{ sessionId: string; text: string; timestamp: string }>;
  messages: SessionMemoryMessage[];
  truncated: boolean;
} {
  const input = readJsonLinesTail(path.join(home, "history.jsonl"), HISTORY_BYTES);
  const entries: Array<{ sessionId: string; text: string; timestamp: string }> = [];
  for (const record of input.records) {
    const sessionId = stringField(record, "session_id");
    const text = stringField(record, "text");
    const timestamp = epochTimestamp(record.ts);
    if (!sessionId || !SESSION_ID_PATTERN.test(sessionId) || !text || !timestamp) continue;
    if (onlySessionId && sessionId !== onlySessionId) continue;
    entries.push({ sessionId, text: normalizeVisibleText(text), timestamp });
  }
  const messages = entries
    .filter((entry) => entry.text)
    .map<SessionMemoryMessage>((entry) => ({ role: "user", text: entry.text, timestamp: entry.timestamp }));
  return { entries, messages, truncated: input.truncated };
}

function readVisibleMessages(filePath: string, maxBytes: number): { messages: SessionMemoryMessage[]; truncated: boolean } {
  const input = readJsonLinesTail(filePath, maxBytes);
  const messages: SessionMemoryMessage[] = [];
  for (const record of input.records) {
    if (record.type !== "response_item" || !isObject(record.payload)) continue;
    const payload = record.payload;
    if (payload.type !== "message" || (payload.role !== "user" && payload.role !== "assistant") || !Array.isArray(payload.content)) {
      continue;
    }
    const contentType = payload.role === "user" ? "input_text" : "output_text";
    const text = payload.content
      .filter(isObject)
      .filter((item) => item.type === contentType && typeof item.text === "string")
      .map((item) => item.text as string)
      .filter((item) => payload.role !== "user" || !isHostContext(item))
      .join("\n");
    const normalized = normalizeVisibleText(text);
    if (!normalized) continue;
    messages.push({ role: payload.role, text: normalized, timestamp: validTimestamp(record.timestamp) ? record.timestamp : null });
  }
  return { messages, truncated: input.truncated };
}

function listCodexSessionFiles(home: string): StoreFileList {
  const files: string[] = [];
  let truncated = false;
  for (const directory of [path.join(home, "sessions"), path.join(home, "archived_sessions")]) {
    walk(directory, 0);
    if (truncated) break;
  }
  files.sort((left, right) => fileModifiedAt(right) - fileModifiedAt(left));
  return { files, truncated };

  function walk(directory: string, depth: number): void {
    if (truncated || depth > 5 || !fs.existsSync(directory)) return;
    const stat = fs.lstatSync(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (files.length >= MAX_STORE_FILES) {
        truncated = true;
        return;
      }
      const filePath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(filePath, depth + 1);
      else if (entry.isFile() && entry.name.endsWith(".jsonl")) files.push(filePath);
    }
  }
}

function findTranscript(files: string[], sessionId: string): string | null {
  return files.find((filePath) => path.basename(filePath).includes(sessionId)) ?? null;
}

function readSessionMeta(filePath: string): CodexSessionMeta | null {
  const input = readJsonLinesHead(filePath, SESSION_META_BYTES);
  for (const record of input.records) {
    if (record.type !== "session_meta" || !isObject(record.payload)) continue;
    const id = stringField(record.payload, "id");
    const cwd = stringField(record.payload, "cwd");
    if (id && cwd) return { id, cwd };
  }
  return null;
}

function belongsToProject(root: string, cwd: string): boolean {
  const projectRoot = canonicalExistingPath(root);
  const sessionCwd = canonicalExistingPath(cwd);
  const relative = path.relative(projectRoot, sessionCwd);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function canonicalExistingPath(value: string): string {
  const resolved = path.resolve(value);
  try {
    return fs.realpathSync(resolved);
  } catch {
    return resolved;
  }
}

function readJsonLinesHead(filePath: string, maxBytes: number): BoundedJsonLines {
  if (!regularFile(filePath)) return { records: [], truncated: false };
  const stat = fs.statSync(filePath);
  const length = Math.min(stat.size, maxBytes);
  const buffer = Buffer.alloc(length);
  const descriptor = fs.openSync(filePath, "r");
  try {
    fs.readSync(descriptor, buffer, 0, length, 0);
  } finally {
    fs.closeSync(descriptor);
  }
  return { records: parseJsonLines(buffer.toString("utf8"), stat.size > length), truncated: stat.size > length };
}

function readJsonLinesTail(filePath: string, maxBytes: number): BoundedJsonLines {
  if (!regularFile(filePath)) return { records: [], truncated: false };
  const stat = fs.statSync(filePath);
  const length = Math.min(stat.size, maxBytes);
  const start = Math.max(0, stat.size - length);
  const buffer = Buffer.alloc(length);
  const descriptor = fs.openSync(filePath, "r");
  try {
    fs.readSync(descriptor, buffer, 0, length, start);
  } finally {
    fs.closeSync(descriptor);
  }
  let text = buffer.toString("utf8");
  if (start > 0) {
    const boundary = text.indexOf("\n");
    text = boundary === -1 ? "" : text.slice(boundary + 1);
  }
  return { records: parseJsonLines(text, false), truncated: start > 0 };
}

function parseJsonLines(text: string, discardPartialTail: boolean): JsonObject[] {
  const lines = text.split("\n");
  if (discardPartialTail && !text.endsWith("\n")) lines.pop();
  const records: JsonObject[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const value: unknown = JSON.parse(line);
      if (isObject(value)) records.push(value);
    } catch {
      // Host JSONL may be concurrently appended or contain a newer record shape.
    }
  }
  return records;
}

function regularFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.lstatSync(filePath);
  return stat.isFile() && !stat.isSymbolicLink();
}

function excerptAround(text: string, query: string): string {
  const normalized = normalizeInline(text);
  const index = normalized.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  const start = Math.max(0, index === -1 ? 0 : index - 120);
  const excerpt = normalized.slice(start, start + 360);
  return `${start > 0 ? "..." : ""}${excerpt}${start + 360 < normalized.length ? "..." : ""}`;
}

function boundedTitle(value: string): string {
  const normalized = normalizeInline(value);
  return `${normalized.slice(0, 120)}${normalized.length > 120 ? "..." : ""}`;
}

function redactProjectRoot(value: string, root: string): string {
  let redacted = value;
  const prefixes = [...new Set([path.resolve(root), canonicalExistingPath(root)])].sort((left, right) => right.length - left.length);
  for (const prefix of prefixes) {
    redacted = redacted.replaceAll(prefix, ".");
  }
  return redacted;
}

function isHostContext(value: string): boolean {
  const text = value.trimStart();
  return [
    "<recommended_plugins>",
    "# AGENTS.md instructions for ",
    "<environment_context>",
    "<permissions instructions>",
    "<skills_instructions>",
    "<apps_instructions>",
    "<plugins_instructions>"
  ].some((prefix) => text.startsWith(prefix));
}

function lastMessageTimestamp(messages: SessionMemoryMessage[]): string | null {
  return messages.map((message) => message.timestamp).filter((value): value is string => value !== null).sort().at(-1) ?? null;
}

function fileModifiedAt(filePath: string): number {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function normalizeInline(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeVisibleText(value: string): string {
  return value.replaceAll("\u0000", "").trim();
}

function boundMessages(messages: SessionMemoryMessage[]): { messages: SessionMemoryMessage[]; truncated: boolean } {
  const bounded: SessionMemoryMessage[] = [];
  let total = 0;
  let truncated = false;
  for (const message of messages.toReversed()) {
    const text = truncateUtf8(message.text, MAX_MESSAGE_BYTES);
    const bytes = Buffer.byteLength(text, "utf8");
    if (total + bytes > MAX_OUTPUT_BYTES) {
      truncated = true;
      break;
    }
    total += bytes;
    bounded.unshift({ ...message, text });
  }
  return { messages: bounded, truncated };
}

function truncateUtf8(value: string, limit: number): string {
  const buffer = Buffer.from(value, "utf8");
  if (buffer.byteLength <= limit) return value;
  return `${new TextDecoder("utf-8", { fatal: false }).decode(buffer.subarray(0, limit - 3))}...`;
}

function compareMessages(left: SessionMemoryMessage, right: SessionMemoryMessage): number {
  if (!left.timestamp && !right.timestamp) return 0;
  if (!left.timestamp) return -1;
  if (!right.timestamp) return 1;
  return left.timestamp.localeCompare(right.timestamp);
}

function stringField(record: JsonObject, field: string): string {
  return typeof record[field] === "string" ? record[field] : "";
}

function epochTimestamp(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const timestamp = new Date(value * 1000);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString();
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
