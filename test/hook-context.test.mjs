import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { initializeProject, repositoryRoot, runCli, runGit, temporaryProject, writeProjectJson } from "./support/fixture.mjs";

const { buildCodexHookContext } = await import("../dist/src/hook-context.js");

function prepareContextTask(root, session, { implementContent = "implementation entry\n", checkContent = "verification entry\n" } = {}) {
  fs.writeFileSync(path.join(root, "implement-source.txt"), implementContent);
  fs.writeFileSync(path.join(root, "check-source.txt"), checkContent);
  runGit(root, ["add", "implement-source.txt", "check-source.txt"]);
  runGit(root, ["commit", "-m", "Add hook context sources"]);
  const contractInput = writeProjectJson(root, ".opennori/.runtime/hook-contract.json", {
    goal: "Exercise hook context injection",
    outcomes: [
      {
        id: "outcome-hook-context",
        statement: "The active stage receives its curated context",
        verification: "Inspect the hook output",
        required: true
      }
    ],
    assumptions: []
  });
  const implementInput = writeProjectJson(root, ".opennori/.runtime/hook-implement.json", [
    { file: "implement-source.txt", reason: "Needed only while implementing" }
  ]);
  const checkInput = writeProjectJson(root, ".opennori/.runtime/hook-check.json", [
    { file: "check-source.txt", reason: "Needed only while verifying" }
  ]);
  const created = runCli(root, ["task", "create", "--title", "Hook context", "--slug", "hook-context"], { session });
  const taskId = created.data.task.id;
  runCli(root, ["task", "contract", "write", taskId, "--input", contractInput], { session });
  runCli(
    root,
    ["task", "contract", "approve", taskId, "--approver", "Probe", "--confirmation", "hook-context-approval"],
    { session }
  );
  runCli(root, ["task", "context", "write", taskId, "--mode", "implement", "--input", implementInput], { session });
  runCli(root, ["task", "context", "write", taskId, "--mode", "check", "--input", checkInput], { session });
  runCli(root, ["task", "delivery", "plan", taskId, "--mode", "commit"], { session });
  return taskId;
}

function runHook(input) {
  const result = spawnSync("node", [path.join(repositoryRoot, "hooks/opennori-context.mjs")], {
    cwd: repositoryRoot,
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
    timeout: 10_000,
    maxBuffer: 1024 * 1024
  });
  assert.equal(result.status, 0, `hook failed\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

test("the package and Plugin wire context and coordination hooks", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8"));
  const plugin = JSON.parse(fs.readFileSync(path.join(repositoryRoot, ".codex-plugin/plugin.json"), "utf8"));
  const hooks = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "hooks/hooks.json"), "utf8"));

  assert.ok(packageJson.files.includes("hooks/"));
  assert.equal(plugin.hooks, "./hooks/hooks.json");
  assert.deepEqual(Object.keys(hooks.hooks).sort(), ["SessionStart", "SubagentStart", "SubagentStop", "UserPromptSubmit"]);
  for (const name of ["SessionStart", "SubagentStart", "UserPromptSubmit"]) {
    const event = hooks.hooks[name];
    const command = event[0].hooks[0];
    assert.equal(command.type, "command");
    assert.equal(command.command, 'node "$PLUGIN_ROOT/hooks/opennori-context.mjs"');
    assert.equal(command.commandWindows, 'node "%PLUGIN_ROOT%\\hooks\\opennori-context.mjs"');
    assert.equal(command.timeout, 10);
  }
  const startObserver = hooks.hooks.SubagentStart[0].hooks[1];
  const stopObserver = hooks.hooks.SubagentStop[0].hooks[0];
  for (const command of [startObserver, stopObserver]) {
    assert.equal(command.type, "command");
    assert.equal(command.command, 'node "$PLUGIN_ROOT/hooks/opennori-observe.mjs"');
    assert.equal(command.commandWindows, 'node "%PLUGIN_ROOT%\\hooks\\opennori-observe.mjs"');
    assert.equal(command.timeout, 10);
  }
  assert.equal(fs.existsSync(path.join(repositoryRoot, "dist/src/hook-context.js")), true);
  assert.equal(fs.existsSync(path.join(repositoryRoot, "dist/src/coordination.js")), true);
});

test("hook context is inert without a foundation project and matching session task", (t) => {
  const root = temporaryProject(t, "opennori-hook-inert-");
  const input = { session_id: "hook-session", cwd: root, hook_event_name: "SessionStart" };

  assert.equal(buildCodexHookContext(input), null);
  initializeProject(root);
  assert.equal(buildCodexHookContext(input), null);
  assert.equal(buildCodexHookContext({ ...input, session_id: "" }), null);
  assert.equal(buildCodexHookContext({ ...input, cwd: "" }), null);
});

test("planning context is discovered from a nested project directory", (t) => {
  const root = temporaryProject(t, "opennori-hook-plan-");
  const session = "hook-plan-session";
  initializeProject(root);
  const nested = path.join(root, "packages/app/src");
  fs.mkdirSync(nested, { recursive: true });
  const created = runCli(root, ["task", "create", "--title", "Plan hook", "--slug", "plan-hook"], { session });

  const result = buildCodexHookContext({ session_id: session, cwd: nested, hook_event_name: "SessionStart" });
  assert.equal(result.project_root, root);
  assert.equal(result.task_id, created.data.task.id);
  assert.equal(result.hook_event_name, "SessionStart");
  assert.match(result.context, new RegExp(`Task: ${created.data.task.id} - Plan hook`));
  assert.match(result.context, /Stage: plan/);
  assert.match(result.context, /Use the matching OpenNori Skill and CLI stage command/);
  assert.doesNotMatch(result.context, /Curated (implement|check) context/);
  assert.equal(buildCodexHookContext({ session_id: "other-session", cwd: nested, hook_event_name: "SessionStart" }), null);
});

test("Implement and Verify receive only their stage-specific curated context", (t) => {
  const root = temporaryProject(t, "opennori-hook-stage-");
  const session = "hook-stage-session";
  initializeProject(root);
  const taskId = prepareContextTask(root, session, {
    implementContent: "IMPLEMENT-CONTEXT-ONLY\n",
    checkContent: "CHECK-CONTEXT-ONLY\n"
  });
  runCli(root, ["task", "start", taskId], { session });

  const implement = buildCodexHookContext({ session_id: session, cwd: root, hook_event_name: "SessionStart" });
  assert.match(implement.context, /Stage: implement/);
  assert.match(implement.context, /Curated implement context:/);
  assert.match(implement.context, /IMPLEMENT-CONTEXT-ONLY/);
  assert.doesNotMatch(implement.context, /CHECK-CONTEXT-ONLY/);

  runCli(root, ["task", "review", taskId], { session });
  for (const hookEventName of ["UserPromptSubmit", "SubagentStart"]) {
    const verify = buildCodexHookContext({ session_id: session, cwd: root, hook_event_name: hookEventName });
    assert.equal(verify.hook_event_name, hookEventName);
    assert.match(verify.context, /Stage: verify/);
    assert.match(verify.context, /Curated check context:/);
    assert.match(verify.context, /CHECK-CONTEXT-ONLY/);
    assert.doesNotMatch(verify.context, /IMPLEMENT-CONTEXT-ONLY/);
  }
});

test("turn hooks omit oversized content while session hooks use the larger budget", (t) => {
  const root = temporaryProject(t, "opennori-hook-budget-");
  const session = "hook-budget-session";
  initializeProject(root);
  const largeMarker = `BEGIN-LARGE-CONTEXT\n${"x".repeat(12 * 1024)}\nEND-LARGE-CONTEXT\n`;
  const taskId = prepareContextTask(root, session, { implementContent: largeMarker });
  runCli(root, ["task", "start", taskId], { session });

  const turn = buildCodexHookContext({ session_id: session, cwd: root, hook_event_name: "UserPromptSubmit" });
  assert.ok(Buffer.byteLength(turn.context, "utf8") <= 8 * 1024);
  assert.match(turn.context, /Content omitted from this bounded hook/);
  assert.doesNotMatch(turn.context, /BEGIN-LARGE-CONTEXT/);

  const sessionStart = buildCodexHookContext({ session_id: session, cwd: root, hook_event_name: "SessionStart" });
  assert.ok(Buffer.byteLength(sessionStart.context, "utf8") <= 48 * 1024);
  assert.match(sessionStart.context, /BEGIN-LARGE-CONTEXT/);
  assert.match(sessionStart.context, /END-LARGE-CONTEXT/);
});

test("the executable hook emits Codex additionalContext and degrades to a system message", (t) => {
  const root = temporaryProject(t, "opennori-hook-process-");
  const session = "hook-process-session";
  initializeProject(root);
  const created = runCli(root, ["task", "create", "--title", "Process hook", "--slug", "process-hook"], { session });

  const output = runHook({ session_id: session, cwd: root, hook_event_name: "SessionStart" });
  assert.equal(output.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(output.hookSpecificOutput.additionalContext, new RegExp(created.data.task.id));
  assert.match(output.hookSpecificOutput.additionalContext, /^<opennori-context>/);
  assert.match(output.hookSpecificOutput.additionalContext, /<\/opennori-context>$/);

  const malformed = runHook("not-json");
  assert.match(malformed.systemMessage, /^OpenNori context could not be loaded:/);
});
