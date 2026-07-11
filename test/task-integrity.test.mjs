import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  completeTask,
  holdLock,
  initializeProject,
  journalLockTarget,
  prepareApprovedTask,
  runCli,
  sessionLockTarget,
  taskLockTarget,
  temporaryProject
} from "./support/fixture.mjs";

const { retryStateBusy } = await import("../dist/src/cli-output.js");
const { approveContract, writeContractDraft } = await import("../dist/src/contract.js");
const { OpenNoriError } = await import("../dist/src/errors.js");
const { initProject } = await import("../dist/src/lifecycle.js");
const { appendJsonLine } = await import("../dist/src/io.js");
const { createTask, loadCurrentTask, replanTask } = await import("../dist/src/task.js");

test("Evidence JSONL append leaves the canonical log unchanged when persistence fails", (t) => {
  const root = temporaryProject(t, "opennori-evidence-transaction-");
  const filePath = path.join(root, "evidence.jsonl");
  const original = `${JSON.stringify({ id: "evidence-existing" })}\n`;
  fs.writeFileSync(filePath, original);

  const renameSync = fs.renameSync;
  fs.renameSync = (source, target) => {
    if (target === filePath) throw new Error("simulated Evidence persistence failure");
    return renameSync(source, target);
  };
  try {
    assert.throws(
      () => appendJsonLine(filePath, { id: "evidence-next" }),
      /simulated Evidence persistence failure/
    );
  } finally {
    fs.renameSync = renameSync;
  }

  assert.equal(fs.readFileSync(filePath, "utf8"), original);
  assert.deepEqual(fs.readdirSync(root), ["evidence.jsonl"]);
});

test("Contract JSON and Markdown writes roll back as one transaction", (t) => {
  const root = temporaryProject(t, "opennori-contract-transaction-");
  initProject(root, { developer: "Probe", confirm: true });
  const created = createTask(root, { title: "Contract transaction", creator: "Probe", slug: "contract-transaction" });
  const jsonPath = path.join(created.directory, "contract.json");
  const markdownPath = path.join(created.directory, "contract.md");
  const input = {
    goal: "Keep Contract review files consistent",
    outcomes: [{ id: "outcome-contract", statement: "Both files agree", verification: "Read both files", required: true }],
    assumptions: []
  };

  fs.mkdirSync(markdownPath);
  assert.throws(
    () => writeContractDraft(created.directory, created.task, input),
    (error) => error.code === "contract_write_blocked"
  );
  assert.equal(fs.existsSync(jsonPath), false);

  fs.rmSync(markdownPath, { recursive: true });
  writeContractDraft(created.directory, created.task, input);
  fs.rmSync(markdownPath);
  fs.mkdirSync(markdownPath);
  assert.throws(
    () => approveContract(created.directory, created.task, { approver: "Probe", host_confirmation_ref: "transaction" }),
    (error) => error.code === "contract_write_blocked"
  );
  assert.equal(JSON.parse(fs.readFileSync(jsonPath, "utf8")).status, "draft");

  fs.rmSync(markdownPath, { recursive: true });
  const approved = approveContract(created.directory, created.task, {
    approver: "Probe",
    host_confirmation_ref: "transaction-retry"
  });
  assert.equal(approved.status, "approved");
  assert.match(fs.readFileSync(markdownPath, "utf8"), /Status: approved/);
});

test("Contract rollback preserves a concurrent replacement", (t) => {
  const root = temporaryProject(t, "opennori-contract-concurrent-rollback-");
  initProject(root, { developer: "Probe", confirm: true });
  const created = createTask(root, { title: "Contract race", creator: "Probe", slug: "contract-race" });
  const jsonPath = path.join(created.directory, "contract.json");
  const markdownPath = path.join(created.directory, "contract.md");
  const originalRename = fs.renameSync;
  let injected = false;
  fs.renameSync = (source, target) => {
    if (!injected && target === markdownPath) {
      injected = true;
      fs.rmSync(jsonPath);
      fs.mkdirSync(jsonPath);
      fs.writeFileSync(path.join(jsonPath, "user.txt"), "concurrent contract content\n");
      throw new Error("injected Contract review write failure");
    }
    return originalRename(source, target);
  };
  try {
    assert.throws(
      () =>
        writeContractDraft(created.directory, created.task, {
          goal: "Preserve concurrent content",
          outcomes: [{ id: "outcome-race", statement: "Content remains", verification: "Read it", required: true }],
          assumptions: []
        }),
      (error) => error.code === "contract_rollback_failed"
    );
  } finally {
    fs.renameSync = originalRename;
  }

  assert.equal(injected, true);
  assert.equal(fs.readFileSync(path.join(jsonPath, "user.txt"), "utf8"), "concurrent contract content\n");
});

test("replan restores the Contract and contexts when task persistence fails", (t) => {
  const root = temporaryProject(t, "opennori-replan-rollback-");
  const session = "replan-rollback-session";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "replan-rollback", session);
  runCli(root, ["task", "start", taskId], { session });
  const taskDirectory = path.join(root, ".opennori/tasks", taskId);
  const names = ["contract.json", "contract.md", "implement.jsonl", "check.jsonl"];
  const before = new Map(names.map((name) => [name, fs.readFileSync(path.join(taskDirectory, name))]));
  const originalRename = fs.renameSync;
  let injected = false;
  fs.renameSync = (source, target) => {
    if (!injected && target === path.join(taskDirectory, "task.json")) {
      injected = true;
      throw new Error("injected task persistence failure");
    }
    return originalRename(source, target);
  };
  try {
    assert.throws(() => replanTask(root, taskId, "Contract scope changed"), /injected task persistence failure/);
  } finally {
    fs.renameSync = originalRename;
  }

  assert.equal(injected, true);
  for (const name of names) assert.deepEqual(fs.readFileSync(path.join(taskDirectory, name)), before.get(name));
  assert.equal(runCli(root, ["task", "show", taskId], { session }).data.task.status, "in_progress");
  assert.equal(fs.readdirSync(path.join(taskDirectory, "research")).some((name) => name.startsWith("replanned-")), false);
});

test("CLI retry only repeats state_busy failures", async () => {
  let busyCalls = 0;
  const result = await retryStateBusy(() => {
    busyCalls += 1;
    if (busyCalls < 3) throw new OpenNoriError("state_busy", "held by another process");
    return "ready";
  });
  assert.equal(result, "ready");
  assert.equal(busyCalls, 3);

  let domainCalls = 0;
  await assert.rejects(
    retryStateBusy(() => {
      domainCalls += 1;
      throw new OpenNoriError("contract_not_found", "missing Contract");
    }),
    (error) => error.code === "contract_not_found"
  );
  assert.equal(domainCalls, 1);
});

test("corrupt host session pointers self-heal without changing task state", (t) => {
  const root = temporaryProject(t, "opennori-session-heal-");
  const session = "corrupt-session";
  initializeProject(root);
  const created = runCli(root, ["task", "create", "--title", "Session task", "--slug", "session-task"], { session });
  const sessionId = crypto.createHash("sha256").update(session).digest("hex");
  const pointer = path.join(root, ".opennori/.runtime/sessions", `${sessionId}.json`);
  fs.writeFileSync(pointer, `${JSON.stringify({ task_id: created.data.task.id, unexpected: true })}\n`);

  assert.equal(loadCurrentTask(root, { sessionKey: session }), null);
  assert.equal(fs.existsSync(pointer), false);
  assert.equal(runCli(root, ["task", "show", created.data.task.id], { session }).data.task.status, "planning");
});

test("CLI waits for a contended task lock without applying the transition twice", { timeout: 10_000 }, async (t) => {
  const root = temporaryProject(t, "opennori-task-lock-");
  const session = "task-lock-session";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "task-lock", session);
  const holder = await holdLock(taskLockTarget(root, taskId), 500);

  const started = runCli(root, ["task", "start", taskId], { session });
  await holder.exited;
  assert.equal(started.data.status, "in_progress");
  assert.equal(started.data.implementation_revision, 1);
});

test("task creation does not duplicate a task when session selection times out", { timeout: 15_000 }, async (t) => {
  const root = temporaryProject(t, "opennori-selection-timeout-");
  const session = "selection-timeout-session";
  initializeProject(root);
  const holder = await holdLock(sessionLockTarget(root, session), 6_200);

  const created = runCli(root, ["task", "create", "--title", "Create once", "--slug", "create-once"], {
    session,
    timeout: 12_000
  });
  assert.equal(created.data.selected, false);
  assert.equal(created.data.selection_error, "state_busy");
  await holder.exited;

  const matching = runCli(root, ["task", "list"], { session }).data.filter((entry) => entry.task.id === created.data.task.id);
  assert.equal(matching.length, 1);
});

test("archive rolls back the task move when journal persistence fails", (t) => {
  const root = temporaryProject(t, "opennori-archive-rollback-");
  const session = "archive-rollback-session";
  initializeProject(root);
  const { taskId } = completeTask(root, "archive-rollback", session);
  const journalPath = path.join(root, ".opennori/workspace/probe/journal.md");
  fs.rmSync(journalPath);
  fs.mkdirSync(journalPath);
  const archiveArgs = [
    "task",
    "archive",
    taskId,
    "--summary",
    "Archive transaction completed",
    "--knowledge",
    "none",
    "--knowledge-summary",
    "No reusable project knowledge"
  ];

  assert.equal(runCli(root, archiveArgs, { ok: false, session }).error.code, "internal_error");
  assert.equal(fs.existsSync(path.join(root, ".opennori/tasks", taskId)), true);
  assert.equal(runCli(root, ["status"], { session }).data.current.task.id, taskId);

  fs.rmSync(journalPath, { recursive: true });
  const archived = runCli(root, archiveArgs, { session });
  assert.equal(fs.existsSync(archived.data.report), true);
  assert.equal(runCli(root, ["status"], { session }).data.current, null);
});

test("archive retries journal lock contention without duplicating the journal entry", { timeout: 10_000 }, async (t) => {
  const root = temporaryProject(t, "opennori-archive-contention-");
  const session = "archive-contention-session";
  initializeProject(root);
  const { taskId } = completeTask(root, "archive-contention", session);
  const holder = await holdLock(journalLockTarget(root, "probe"), 800);
  const startedAt = Date.now();

  const archived = runCli(
    root,
    [
      "task",
      "archive",
      taskId,
      "--summary",
      "Contended archive completed",
      "--knowledge",
      "none",
      "--knowledge-summary",
      "No reusable project knowledge"
    ],
    { session }
  );
  await holder.exited;
  assert.ok(Date.now() - startedAt >= 600);
  const journal = fs.readFileSync(archived.data.journal, "utf8");
  assert.equal(journal.split(`- Task: ${taskId}`).length - 1, 1);
  assert.equal(fs.existsSync(path.join(root, ".opennori/tasks", taskId)), false);
  assert.equal(runCli(root, ["status"], { session }).data.current, null);
});
