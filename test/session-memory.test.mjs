import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { initializeProject, runCli, runCliHuman, temporaryProject } from "./support/fixture.mjs";

const { addProjectPlatform } = await import("../dist/src/lifecycle.js");

function writeJsonLines(filePath, records) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`);
}

function sessionRecord(id, cwd, timestamp = "2026-07-01T08:00:00.000Z") {
  return {
    timestamp,
    type: "session_meta",
    payload: { id, cwd }
  };
}

function assistantRecord(text, timestamp = "2026-07-01T08:01:00.000Z") {
  return {
    timestamp,
    type: "response_item",
    payload: { type: "message", role: "assistant", content: [{ type: "output_text", text }] }
  };
}

function userRecord(text, timestamp = "2026-07-01T08:00:30.000Z") {
  return {
    timestamp,
    type: "response_item",
    payload: { type: "message", role: "user", content: [{ type: "input_text", text }] }
  };
}

function projectSnapshot(directory) {
  const records = [];
  walk(directory, "");
  return records;

  function walk(current, relative) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const next = path.join(current, entry.name);
      const name = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) walk(next, name);
      else if (entry.isFile()) {
        const stat = fs.statSync(next);
        records.push({
          name,
          bytes: stat.size,
          mtime: stat.mtimeMs,
          hash: crypto.createHash("sha256").update(fs.readFileSync(next)).digest("hex")
        });
      }
    }
  }
}

function withCodexHome(t, root) {
  const previous = process.env.CODEX_HOME;
  process.env.CODEX_HOME = root;
  t.after(() => {
    if (previous === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = previous;
  });
}

test("history search is project-scoped, bounded, and finds archived Codex sessions", (t) => {
  const root = temporaryProject(t, "opennori-history-project-");
  const other = temporaryProject(t, "opennori-history-other-");
  const codexHome = temporaryProject(t, "opennori-history-host-");
  withCodexHome(t, codexHome);
  initializeProject(root);

  const projectId = "11111111-1111-4111-8111-111111111111";
  const outsideId = "22222222-2222-4222-8222-222222222222";
  writeJsonLines(path.join(codexHome, "session_index.jsonl"), [
    { id: projectId, thread_name: "Durable search design", updated_at: "2026-07-01T08:02:00.000Z" },
    { id: outsideId, thread_name: "Durable search elsewhere", updated_at: "2026-07-02T08:02:00.000Z" }
  ]);
  writeJsonLines(path.join(codexHome, "history.jsonl"), [
    { session_id: projectId, ts: 1_751_356_800, text: "Continue the durable search design" },
    { session_id: outsideId, ts: 1_751_443_200, text: "Continue the durable search design outside" }
  ]);
  writeJsonLines(path.join(codexHome, "archived_sessions", `rollout-${projectId}.jsonl`), [sessionRecord(projectId, root)]);
  writeJsonLines(path.join(codexHome, "sessions", "2026", "07", "02", `rollout-${outsideId}.jsonl`), [
    sessionRecord(outsideId, other)
  ]);

  const excluded = runCli(root, ["history", "search", "--query", "durable search"], { session: projectId });
  assert.deepEqual(excluded.data.sessions, []);
  const result = runCli(root, ["history", "search", "--query", "durable search"]);
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.data.sessions.map((session) => session.session_id),
    [projectId]
  );
  assert.equal(result.data.platform, "codex");
  assert.equal(result.data.notice.includes("untrusted"), true);

  const human = runCliHuman(root, ["history", "search", "--query", "durable search"]);
  assert.match(human, new RegExp(projectId));
  assert.doesNotMatch(human, new RegExp(outsideId));
  assert.doesNotMatch(human, new RegExp(codexHome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("history show returns visible user and assistant text without internal records", (t) => {
  const root = temporaryProject(t, "opennori-history-show-");
  const codexHome = temporaryProject(t, "opennori-history-show-host-");
  withCodexHome(t, codexHome);
  initializeProject(root);
  const sessionId = "33333333-3333-4333-8333-333333333333";
  writeJsonLines(path.join(codexHome, "session_index.jsonl"), [
    { id: sessionId, thread_name: "Review the previous decision", updated_at: "2026-07-01T08:03:00.000Z" }
  ]);
  writeJsonLines(path.join(codexHome, "history.jsonl"), [
    { session_id: sessionId, ts: 1_751_356_800, text: "What did we decide about recovery?" }
  ]);
  writeJsonLines(path.join(codexHome, "sessions", `rollout-${sessionId}.jsonl`), [
    sessionRecord(sessionId, root),
    {
      timestamp: "2026-07-01T08:00:30.000Z",
      type: "response_item",
      payload: { type: "message", role: "developer", content: [{ type: "input_text", text: "PRIVATE INSTRUCTION" }] }
    },
    {
      timestamp: "2026-07-01T08:00:40.000Z",
      type: "response_item",
      payload: { type: "reasoning", summary: [{ type: "summary_text", text: "PRIVATE REASONING" }] }
    },
    assistantRecord("Keep recovery explicit and reversible.")
  ]);

  const result = runCli(root, ["history", "show", sessionId]);
  assert.deepEqual(
    result.data.messages.map((message) => [message.role, message.text]),
    [
      ["user", "What did we decide about recovery?"],
      ["assistant", "Keep recovery explicit and reversible."]
    ]
  );
  assert.equal(JSON.stringify(result.data).includes("PRIVATE"), false);
  assert.ok(Buffer.byteLength(JSON.stringify(result.data), "utf8") < 64 * 1024 + 2048);
});

test("history search falls back to project transcripts when host indexes are absent", (t) => {
  const root = temporaryProject(t, "opennori-history-transcript-");
  const codexHome = temporaryProject(t, "opennori-history-transcript-host-");
  withCodexHome(t, codexHome);
  initializeProject(root);
  const sessionId = "66666666-6666-4666-8666-666666666666";
  const canonicalRoot = fs.realpathSync(root);
  writeJsonLines(path.join(codexHome, "sessions", `rollout-${sessionId}.jsonl`), [
    sessionRecord(sessionId, root),
    userRecord("Discuss transcript-only recovery"),
    assistantRecord(`Transcript-only recovery remains bounded at ${canonicalRoot}/file.txt.`)
  ]);

  const search = runCli(root, ["history", "search", "--query", "transcript-only"]);
  assert.deepEqual(search.data.sessions.map((session) => session.session_id), [sessionId]);
  assert.equal(JSON.stringify(search.data).includes(root), false);
  assert.equal(JSON.stringify(search.data).includes(canonicalRoot), false);
  const show = runCli(root, ["history", "show", sessionId]);
  assert.deepEqual(
    show.data.messages.map((message) => message.role),
    ["user", "assistant"]
  );
  assert.equal(JSON.stringify(show.data).includes(root), false);
  assert.equal(JSON.stringify(show.data).includes(canonicalRoot), false);
  assert.match(show.data.messages.at(-1).text, /\.\/file\.txt/);
});

test("history show keeps the newest messages within its serialized output budget", (t) => {
  const root = temporaryProject(t, "opennori-history-budget-");
  const codexHome = temporaryProject(t, "opennori-history-budget-host-");
  withCodexHome(t, codexHome);
  initializeProject(root);
  const sessionId = "55555555-5555-4555-8555-555555555555";
  writeJsonLines(path.join(codexHome, "session_index.jsonl"), [
    { id: sessionId, thread_name: "Bounded transcript", updated_at: "2026-07-01T08:03:00.000Z" }
  ]);
  writeJsonLines(path.join(codexHome, "history.jsonl"), []);
  writeJsonLines(path.join(codexHome, "sessions", `rollout-${sessionId}.jsonl`), [
    sessionRecord(sessionId, root),
    ...Array.from({ length: 12 }, (_, index) =>
      assistantRecord(`${String(index).padStart(2, "0")}:${"x".repeat(9 * 1024)}`, `2026-07-01T08:${String(index + 1).padStart(2, "0")}:00.000Z`)
    )
  ]);

  const result = runCli(root, ["history", "show", sessionId]);
  assert.equal(result.data.truncated, true);
  assert.ok(result.data.messages.length <= 8);
  assert.match(result.data.messages.at(-1).text, /^11:/);
  assert.ok(Buffer.byteLength(JSON.stringify(result.data), "utf8") < 64 * 1024);
});

test("history reads tolerate malformed tails and never mutate host or project state", (t) => {
  const root = temporaryProject(t, "opennori-history-readonly-");
  const codexHome = temporaryProject(t, "opennori-history-readonly-host-");
  withCodexHome(t, codexHome);
  initializeProject(root);
  const sessionId = "44444444-4444-4444-8444-444444444444";
  writeJsonLines(path.join(codexHome, "session_index.jsonl"), [
    { id: sessionId, thread_name: "Bounded recovery", updated_at: "2026-07-01T08:03:00.000Z" }
  ]);
  writeJsonLines(path.join(codexHome, "history.jsonl"), [
    { session_id: sessionId, ts: 1_751_356_800, text: "Bounded recovery" }
  ]);
  const transcript = path.join(codexHome, "sessions", `rollout-${sessionId}.jsonl`);
  writeJsonLines(transcript, [sessionRecord(sessionId, root), assistantRecord("Recovery remains bounded.")]);
  fs.appendFileSync(transcript, "{partial");

  const beforeHost = projectSnapshot(codexHome);
  const beforeProject = projectSnapshot(path.join(root, ".opennori"));
  const search = runCli(root, ["history", "search", "--query", "bounded recovery"]);
  const show = runCli(root, ["history", "show", sessionId]);
  assert.equal(search.data.sessions.length, 1);
  assert.equal(show.data.messages.at(-1).text, "Recovery remains bounded.");
  assert.deepEqual(projectSnapshot(codexHome), beforeHost);
  assert.deepEqual(projectSnapshot(path.join(root, ".opennori")), beforeProject);
});

test("unsupported platform memory fails explicitly without falling back", (t) => {
  const root = temporaryProject(t, "opennori-history-unsupported-");
  initializeProject(root);
  addProjectPlatform(root, "claude", { confirm: true });
  const result = runCli(root, ["history", "search", "--query", "anything"], {
    ok: false,
    platform: "claude"
  });
  assert.equal(result.error.code, "session_memory_unsupported");
});
