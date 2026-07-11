import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const cliPath = path.join(repositoryRoot, "dist/bin/opennori.js");
export const published0130Package = Object.freeze({
  name: "opennori",
  version: "0.1.30",
  shasum: "0dfe116aec3886cb4f981b473c884f6531d9eb76",
  integrity: "sha512-O2tqCgAKORiK9iG0koDmBqA900Jjg2zfZ3W4lNGfN82bQ4kXwgRZJlpLMvyOY76IOc347nYI288F4n3ycvRxkg=="
});
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

function publishedContentHash(content) {
  return crypto.createHash("sha256").update(content.replace(/\r\n/g, "\n"), "utf8").digest("hex");
}

/** Materialize a sanitized offline snapshot of the project shape emitted by the pinned published package. */
export function materializePublished0130Project(root) {
  const hooks = `${JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: "node .codex/hooks/opennori-activity.mjs", timeout: 5 }] }] } }, null, 2)}\n`;
  const hookScript = "#!/usr/bin/env node\nprocess.exit(0);\n";
  const managedFile = (relativePath, kind, content) => ({
    path: relativePath,
    kind,
    required: true,
    exists: true,
    ownership: {
      owner: "opennori",
      scope: "file",
      status: "current",
      expected_hash: publishedContentHash(content),
      current_hash: publishedContentHash(content),
      last_written_hash: publishedContentHash(content)
    }
  });

  fs.mkdirSync(path.join(root, ".opennori/current"), { recursive: true });
  fs.mkdirSync(path.join(root, ".opennori/profile"), { recursive: true });
  fs.mkdirSync(path.join(root, ".codex/hooks"), { recursive: true });
  fs.writeFileSync(path.join(root, ".codex/hooks.json"), hooks);
  fs.writeFileSync(path.join(root, ".codex/hooks/opennori-activity.mjs"), hookScript, { mode: 0o755 });
  fs.writeFileSync(path.join(root, ".opennori/profile/README.md"), "# Project preferences\n\nKeep this user-authored project guidance.\n");
  fs.writeFileSync(path.join(root, ".opennori/profile/profile.json"), '{"schema_version":"opennori/project-profile-v1","items":[]}\n');
  fs.writeFileSync(path.join(root, ".opennori/current/user-goal.md"), "# User goal\n\nKeep this historical project outcome.\n");
  fs.writeFileSync(path.join(root, ".opennori/current/user-evidence.json"), '{"summary":"Keep this historical evidence."}\n');
  writeProjectJson(root, ".opennori/manifest.json", {
    schema_version: "opennori/manifest-v1",
    protocol_version: "opennori/v1",
    opennori_version: published0130Package.version,
    created_at: "2026-07-09T09:55:39.172Z",
    updated_at: "2026-07-09T09:55:39.172Z",
    capabilities: [],
    managed_files: [
      managedFile(".codex/hooks.json", "codex-hooks", hooks),
      managedFile(".codex/hooks/opennori-activity.mjs", "codex-hook-script", hookScript)
    ],
    current_goals: [],
    current_goal: null,
    draft_goals: [],
    history_goals: [],
    plugin: {},
    architecture: {},
    lifecycle: {}
  });
  fs.writeFileSync(path.join(root, "AGENTS.md"), "Project-owned agent guidance.\n", { mode: 0o600 });

  return {
    package: published0130Package,
    user_files: [
      ".opennori/profile/README.md",
      ".opennori/profile/profile.json",
      ".opennori/current/user-goal.md",
      ".opennori/current/user-evidence.json"
    ],
    generated_hooks: [".codex/hooks.json", ".codex/hooks/opennori-activity.mjs"]
  };
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
