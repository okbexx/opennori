import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  initializeProject,
  holdLock,
  prepareApprovedTask,
  repositoryRoot,
  runCli,
  runCliHuman,
  temporaryProject
} from "./support/fixture.mjs";

const observerPath = path.join(repositoryRoot, "hooks/opennori-observe.mjs");

function observerInput(root, session, worker, event) {
  return {
    session_id: session,
    cwd: root,
    hook_event_name: event,
    agent_id: worker,
    agent_type: "reviewer",
    turn_id: "turn-probe"
  };
}

function runObserver(input) {
  const result = spawnSync("node", [observerPath], {
    cwd: repositoryRoot,
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
    timeout: 10_000
  });
  assert.equal(result.status, 0, `observer failed\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  return JSON.parse(result.stdout);
}

function runObserverAsync(input) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [observerPath], { cwd: repositoryRoot, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code !== 0) reject(new Error(`observer failed (${code}): ${stderr}`));
      else resolve(JSON.parse(stdout));
    });
    child.stdin.end(JSON.stringify(input));
  });
}

function runCliAsync(root, args, session) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(repositoryRoot, "dist/bin/opennori.js"), ...args, "--root", root, "--json"], {
      cwd: repositoryRoot,
      env: { ...process.env, CODEX_THREAD_ID: session },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code !== 0) reject(new Error(`CLI failed (${code}): ${stderr}`));
      else resolve(JSON.parse(stdout));
    });
  });
}

function canonicalTaskBytes(root, taskId) {
  const taskDirectory = path.join(root, ".opennori", "tasks", taskId);
  const result = {};
  for (const name of ["task.json", "contract.json", "evidence.jsonl"]) {
    const filePath = path.join(taskDirectory, name);
    result[name] = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
  }
  return result;
}

test("worker hooks and explicit observations stay outside completion authority", (t) => {
  const root = temporaryProject(t, "opennori-coordination-");
  const session = "coordination-session";
  const worker = "worker-sensitive-host-reference";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "coordination", session);
  runCli(root, ["task", "start", taskId], { session });
  const before = canonicalTaskBytes(root, taskId);

  assert.deepEqual(runObserver(observerInput(root, session, worker, "SubagentStart")), {});
  const first = runCli(root, ["task", "coordination", "list", taskId], { session }).data;
  assert.equal(first.bindings.length, 1);
  assert.equal(first.bindings[0].started_at !== null, true);
  assert.equal(first.bindings[0].stopped_at, null);
  assert.equal(first.bindings[0].current_revision, true);
  assert.equal(first.bindings[0].parent_session_ref.includes(session), false);

  const bindingFile = path.join(root, ".opennori", ".runtime", "coordination", taskId, fs.readdirSync(path.join(root, ".opennori", ".runtime", "coordination", taskId))[0]);
  const duplicateBefore = fs.readFileSync(bindingFile);
  assert.deepEqual(runObserver(observerInput(root, session, worker, "SubagentStart")), {});
  assert.deepEqual(fs.readFileSync(bindingFile), duplicateBefore);

  runCli(
    root,
    [
      "task",
      "coordination",
      "assign",
      taskId,
      "--worker",
      worker,
      "--role",
      "reviewer",
      "--assignment",
      "Review recovery behavior",
      "--outcomes",
      "outcome-workflow",
      "--paths",
      "source.txt"
    ],
    { session }
  );
  runCli(root, ["task", "coordination", "message", taskId, "--worker", worker], { session });
  runCli(root, ["task", "coordination", "interrupt", taskId, "--worker", worker], { session });
  assert.deepEqual(runObserver(observerInput(root, session, worker, "SubagentStop")), {});

  const observed = runCli(root, ["task", "coordination", "list", taskId], { session }).data.bindings[0];
  assert.equal(observed.assignment, "Review recovery behavior");
  assert.deepEqual(observed.outcome_ids, ["outcome-workflow"]);
  assert.deepEqual(observed.paths, ["source.txt"]);
  assert.equal(observed.last_contact_at !== null, true);
  assert.equal(observed.interrupted_at !== null, true);
  assert.equal(observed.stopped_at !== null, true);
  assert.deepEqual(canonicalTaskBytes(root, taskId), before);
  assert.equal(runCli(root, ["task", "show", taskId], { session }).data.task.status, "in_progress");

  const human = runCliHuman(root, ["task", "coordination", "list", taskId], { session });
  assert.doesNotMatch(human, new RegExp(worker));
  assert.doesNotMatch(human, new RegExp(session));
  assert.match(fs.readFileSync(path.join(root, ".gitignore"), "utf8"), /\.opennori\/\.runtime\//);
});

test("coordination bindings expose stale implementation revisions without rewriting them", (t) => {
  const root = temporaryProject(t, "opennori-coordination-revision-");
  const session = "coordination-revision-session";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "coordination-revision", session);
  runCli(root, ["task", "start", taskId], { session });
  runObserver(observerInput(root, session, "worker-revision-one", "SubagentStart"));

  runCli(root, ["task", "review", taskId], { session });
  runCli(root, ["task", "start", taskId], { session });
  runObserver(observerInput(root, session, "worker-revision-two", "SubagentStart"));
  runObserver(observerInput(root, session, "worker-revision-one", "SubagentStop"));

  for (const command of ["message", "interrupt"]) {
    const staleUpdate = runCli(
      root,
      ["task", "coordination", command, taskId, "--worker", "worker-revision-one"],
      { ok: false, session }
    );
    assert.equal(staleUpdate.error.code, "coordination_worker_unknown");
  }

  const result = runCli(root, ["task", "coordination", "list", taskId], { session }).data;
  assert.equal(result.implementation_revision, 2);
  assert.equal(result.bindings.length, 2);
  const oldBinding = result.bindings.find((binding) => binding.worker_ref === "worker-revision-one");
  const newBinding = result.bindings.find((binding) => binding.worker_ref === "worker-revision-two");
  assert.equal(oldBinding.current_revision, false);
  assert.equal(oldBinding.stopped_at !== null, true);
  assert.equal(newBinding.current_revision, true);
});

test("concurrent SubagentStart observations are serialized without loss", async (t) => {
  const root = temporaryProject(t, "opennori-coordination-concurrent-");
  const session = "coordination-concurrent-session";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "coordination-concurrent", session);
  runCli(root, ["task", "start", taskId], { session });

  const workers = Array.from({ length: 6 }, (_, index) => `worker-concurrent-${index}`);
  const outputs = await Promise.all(
    workers.map((worker) => runObserverAsync(observerInput(root, session, worker, "SubagentStart")))
  );
  assert.deepEqual(outputs, workers.map(() => ({})));
  const result = runCli(root, ["task", "coordination", "list", taskId], { session }).data;
  assert.deepEqual(
    result.bindings.map((binding) => binding.worker_ref).sort(),
    workers
  );
});

test("uninstall and worker hooks cannot leave unignored coordination state", async (t) => {
  const root = temporaryProject(t, "opennori-coordination-uninstall-race-");
  const session = "coordination-uninstall-race-session";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "coordination-uninstall-race", session);
  runCli(root, ["task", "start", taskId], { session });
  fs.rmSync(path.join(root, ".opennori/.runtime/contract-input.json"));
  fs.rmSync(path.join(root, ".opennori/.runtime/context-input.json"));
  const holder = await holdLock(path.join(root, ".opennori-runtime"), 500);

  const [observation, uninstall] = await Promise.all([
    runObserverAsync(observerInput(root, session, "worker-racing-uninstall", "SubagentStart")),
    runCliAsync(root, ["uninstall", "--confirm"], session)
  ]);
  await holder.exited;

  assert.equal(uninstall.ok, true);
  assert.equal(typeof observation, "object");
  assert.equal(fs.existsSync(path.join(root, ".opennori/manifest.json")), false);
  assert.equal(fs.existsSync(path.join(root, ".gitignore")), false);
  assert.equal(fs.existsSync(path.join(root, ".opennori/.runtime/coordination")), false);
});

test("coordination observers fail soft and unsupported platforms remain sequential", (t) => {
  const empty = temporaryProject(t, "opennori-coordination-empty-");
  assert.deepEqual(runObserver(observerInput(empty, "missing", "worker", "SubagentStart")), {});
  assert.match(runObserver("not-json").systemMessage, /^OpenNori coordination observation was not recorded:/);

  const root = temporaryProject(t, "opennori-coordination-unsupported-");
  initializeProject(root);
  const configPath = path.join(root, ".opennori", "config.yaml");
  fs.writeFileSync(configPath, fs.readFileSync(configPath, "utf8").replace("- codex", "- claude"));
  const result = runCli(root, ["task", "coordination", "list", "2026-07-01-missing"], { ok: false });
  assert.equal(result.error.code, "coordination_unsupported");
});
