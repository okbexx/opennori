import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const cliPath = path.join(repositoryRoot, "dist/bin/opennori.js");
const { initProject } = await import("../../dist/src/lifecycle.js");

export function temporaryProject(t, prefix = "opennori-test-") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

export function writeProjectJson(root, relativePath, payload) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  return relativePath;
}

export function runCli(root, args, { ok = true, session = "integration-session", timeout = 15_000 } = {}) {
  const result = spawnSync("node", [cliPath, ...args, "--root", root, "--json"], {
    encoding: "utf8",
    timeout,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, CODEX_THREAD_ID: session }
  });
  assert.equal(
    result.status === 0,
    ok,
    `${args.join(" ")}\nstatus=${result.status}\nstdout=${result.stdout}\nstderr=${result.stderr}`
  );
  const output = (result.status === 0 ? result.stdout : result.stderr).trim();
  assert.ok(output, `CLI produced no JSON for: ${args.join(" ")}`);
  return JSON.parse(output);
}

export function runCliHuman(root, args, { ok = true, session = "integration-session", timeout = 15_000 } = {}) {
  const result = spawnSync("node", [cliPath, ...args, "--root", root], {
    encoding: "utf8",
    timeout,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, CODEX_THREAD_ID: session }
  });
  assert.equal(
    result.status === 0,
    ok,
    `${args.join(" ")}\nstatus=${result.status}\nstdout=${result.stdout}\nstderr=${result.stderr}`
  );
  return (result.status === 0 ? result.stdout : result.stderr).trim();
}

export function runCliPassthrough(
  root,
  args,
  commandArgs,
  { ok = true, session = "integration-session", timeout = 15_000 } = {}
) {
  const result = spawnSync("node", [cliPath, ...args, "--root", root, "--json", "--", ...commandArgs], {
    encoding: "utf8",
    timeout,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, CODEX_THREAD_ID: session }
  });
  assert.equal(
    result.status === 0,
    ok,
    `${args.join(" ")} -- ${commandArgs.join(" ")}\nstatus=${result.status}\nstdout=${result.stdout}\nstderr=${result.stderr}`
  );
  const output = (result.status === 0 ? result.stdout : result.stderr).trim();
  assert.ok(output, `CLI produced no JSON for passthrough command: ${commandArgs.join(" ")}`);
  return JSON.parse(output);
}

export function initializeProject(root, user = "Probe") {
  runGit(root, ["init", "--initial-branch", "main"]);
  runGit(root, ["config", "user.name", "OpenNori Test"]);
  runGit(root, ["config", "user.email", "opennori-test@example.invalid"]);
  const initialized = initProject(root, { developer: user, confirm: true });
  runGit(root, ["add", "--all"]);
  runGit(root, ["commit", "-m", "Initialize OpenNori test project"]);
  return initialized;
}

export function runGit(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, `git ${args.join(" ")}\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  return result.stdout.trim();
}

export function taskInputPaths(root, outcomeId = "outcome-workflow") {
  fs.writeFileSync(path.join(root, "source.txt"), "verification source\n");
  return {
    contract: writeProjectJson(root, ".opennori/.runtime/contract-input.json", {
      goal: "Complete the requested workflow",
      outcomes: [
        {
          id: outcomeId,
          statement: "The requested workflow completes",
          verification: "Run the integration workflow",
          required: true
        }
      ],
      assumptions: []
    }),
    context: writeProjectJson(root, ".opennori/.runtime/context-input.json", [
      { file: "source.txt", reason: "Stable integration input" }
    ]),
    evidence: ".opennori/.runtime/evidence-input.json"
  };
}

export function prepareApprovedTask(root, slug = "approved-task", session = "integration-session") {
  const inputs = taskInputPaths(root);
  if (runGit(root, ["status", "--porcelain", "--", "source.txt"])) {
    runGit(root, ["add", "source.txt"]);
    runGit(root, ["commit", "-m", "Add stable task input"]);
  }
  const created = runCli(root, ["task", "create", "--title", "Approved task", "--slug", slug], { session });
  const taskId = created.data.task.id;
  runCli(root, ["task", "contract", "write", taskId, "--input", inputs.contract], { session });
  runCli(
    root,
    ["task", "contract", "approve", taskId, "--approver", "Probe", "--confirmation", `${slug}-approval`],
    { session }
  );
  for (const mode of ["implement", "check"]) {
    runCli(root, ["task", "context", "write", taskId, "--mode", mode, "--input", inputs.context], { session });
  }
  runCli(root, ["task", "delivery", "plan", taskId, "--mode", "commit"], { session });
  return { taskId, inputs };
}

export function recordTaskDeliveryCommit(root, taskId, session = "integration-session") {
  fs.appendFileSync(path.join(root, "source.txt"), `delivered by ${taskId}\n`);
  runGit(root, ["add", "source.txt"]);
  runGit(root, ["commit", "-m", `Deliver ${taskId}`]);
  return runCli(root, ["task", "delivery", "record", taskId], { session });
}

export function completeTask(root, slug = "completed-task", session = "integration-session") {
  const prepared = prepareApprovedTask(root, slug, session);
  runCli(root, ["task", "start", prepared.taskId], { session });
  runCli(root, ["task", "review", prepared.taskId], { session });
  writeProjectJson(root, prepared.inputs.evidence, {
    outcome_id: "outcome-workflow",
    result: "proven",
    summary: "The completed task passed verification",
    sources: [{ type: "command", command: "npm test", exit_code: 0, stdout: "passed", stderr: "" }]
  });
  runCli(root, ["task", "evidence", "add", prepared.taskId, "--input", prepared.inputs.evidence], { session });
  recordTaskDeliveryCommit(root, prepared.taskId, session);
  runCli(root, ["task", "finish", prepared.taskId], { session });
  return prepared;
}

export function taskLockTarget(root, taskId) {
  const lockId = crypto.createHash("sha256").update(taskId).digest("hex");
  return path.join(root, ".opennori/.runtime/locks", lockId);
}

export function sessionLockTarget(root, session) {
  const sessionId = crypto.createHash("sha256").update(session).digest("hex");
  return path.join(root, ".opennori/.runtime/locks", `session-${sessionId}`);
}

export function journalLockTarget(root, developer) {
  const lockId = crypto.createHash("sha256").update(developer).digest("hex");
  return path.join(root, ".opennori/.runtime/locks", `journal-${lockId}`);
}

export async function holdLock(lockTarget, durationMs) {
  const child = spawn("node", [path.join(repositoryRoot, "test/support/hold-lock.mjs"), lockTarget, String(durationMs)], {
    cwd: repositoryRoot,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  await new Promise((resolve, reject) => {
    const onExit = (code) => reject(new Error(`Lock holder exited before acquiring the lock (${code}): ${stderr}`));
    child.once("exit", onExit);
    child.stdout.setEncoding("utf8");
    child.stdout.once("data", (chunk) => {
      child.off("exit", onExit);
      if (!chunk.includes("locked")) reject(new Error(`Unexpected lock holder output: ${chunk}`));
      else resolve();
    });
  });
  return {
    child,
    exited: new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Lock holder failed (${code}): ${stderr}`));
      });
    })
  };
}
