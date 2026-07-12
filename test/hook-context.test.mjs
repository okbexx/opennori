import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { initializeProject, repositoryRoot, runCli, runGit, temporaryProject, writeProjectJson } from "./support/fixture.mjs";

const { buildClaudeHookContext, buildCodexHookContext } = await import("../dist/src/hook-context.js");
const { initProject } = await import("../dist/src/lifecycle.js");

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

function runHook(input, platform = "codex") {
  const result = spawnSync("node", [path.join(repositoryRoot, "hooks/opennori-context.mjs"), platform], {
    cwd: repositoryRoot,
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
    timeout: 10_000,
    maxBuffer: 1024 * 1024
  });
  assert.equal(result.status, 0, `hook failed\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

test("the package and Plugins wire bounded context hooks", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8"));
  const codexPlugin = JSON.parse(fs.readFileSync(path.join(repositoryRoot, ".codex-plugin/plugin.json"), "utf8"));
  const claudePlugin = JSON.parse(fs.readFileSync(path.join(repositoryRoot, ".claude-plugin/plugin.json"), "utf8"));
  const codexHooks = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "hooks/codex-hooks.json"), "utf8"));
  const claudeHooks = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "hooks/hooks.json"), "utf8"));

  assert.ok(packageJson.files.includes("hooks/"));
  assert.ok(packageJson.files.includes(".claude-plugin/"));
  assert.equal(codexPlugin.hooks, "./hooks/codex-hooks.json");
  assert.equal(claudePlugin.hooks, undefined);
  assert.deepEqual(Object.keys(codexHooks.hooks).sort(), ["SessionStart", "SubagentStart", "UserPromptSubmit"]);
  assert.deepEqual(Object.keys(claudeHooks.hooks).sort(), ["SessionStart", "SubagentStart", "UserPromptSubmit"]);
  for (const name of ["SessionStart", "SubagentStart", "UserPromptSubmit"]) {
    const event = codexHooks.hooks[name];
    const command = event[0].hooks[0];
    assert.equal(command.type, "command");
    assert.equal(command.command, 'node "$PLUGIN_ROOT/hooks/opennori-context.mjs" codex');
    assert.equal(command.commandWindows, 'node "%PLUGIN_ROOT%\\hooks\\opennori-context.mjs" codex');
    assert.equal(command.timeout, 10);
  }
  for (const name of ["SessionStart", "SubagentStart", "UserPromptSubmit"]) {
    const command = claudeHooks.hooks[name][0].hooks[0];
    assert.equal(command.type, "command");
    assert.equal(command.command, `node "\${CLAUDE_PLUGIN_ROOT}/hooks/opennori-context.mjs" claude`);
    assert.equal(command.timeout, 10);
  }
  assert.equal(fs.existsSync(path.join(repositoryRoot, "dist/src/hook-context.js")), true);
});

test("workflow assets require task-creation consent before Plan", () => {
  for (const relativePath of ["skills/nori/SKILL.md", "skills/nori-plan/SKILL.md", "templates/workflow.md"]) {
    const content = fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
    assert.match(content, /consent/i, relativePath);
    assert.match(content, /not[\s\S]{0,100}Contract/i, relativePath);
  }
  for (const relativePath of ["templates/agents-section.md", "templates/claude-section.md"]) {
    const content = fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
    assert.match(content, /load the installed `nori` Skill/i, relativePath);
    assert.doesNotMatch(content, /simple conversation|task-creation consent|Contract approval/i, relativePath);
  }
});

test("Plan shares the Contract as a host-native file link before inline fallback", () => {
  const skill = fs.readFileSync(path.join(repositoryRoot, "skills/nori-plan/SKILL.md"), "utf8");
  const workflow = fs.readFileSync(path.join(repositoryRoot, "templates/workflow.md"), "utf8");
  const plugin = JSON.parse(fs.readFileSync(path.join(repositoryRoot, ".codex-plugin/plugin.json"), "utf8"));

  assert.match(skill, /On Codex[\s\S]{0,180}Markdown link[\s\S]{0,180}absolute file path/);
  assert.match(skill, /On Claude Code[\s\S]{0,180}project-relative/);
  assert.match(skill, /Do not paste the Contract body into the conversation by default/);
  assert.match(skill, /only when[\s\S]{0,120}user asks[\s\S]{0,120}host cannot open/);
  assert.match(workflow, /host's native file link/);
  assert.match(workflow, /Do not paste its body into the\s+conversation by default/);
  assert.match(plugin.interface.longDescription, /directly openable/);
});

test("hook context is silent outside OpenNori and routes an initialized project through nori", (t) => {
  const root = temporaryProject(t, "opennori-hook-inert-");
  const input = { session_id: "hook-session", cwd: root, hook_event_name: "SessionStart" };

  assert.equal(buildCodexHookContext(input), null);
  initializeProject(root);
  const noTask = buildCodexHookContext(input);
  assert.equal(noTask.task_id, null);
  assert.match(noTask.context, /no task is selected/i);
  assert.match(noTask.context, /Load the nori Skill/);
  assert.doesNotMatch(noTask.context, /Simple conversation|Never create a task|Contract approval/);
  assert.equal(buildCodexHookContext({ ...input, hook_event_name: "SubagentStart" }), null);
  assert.equal(buildCodexHookContext({ ...input, session_id: "" }), null);
  assert.equal(buildCodexHookContext({ ...input, cwd: "" }), null);
});

test("Codex hooks stay silent in a Claude-only OpenNori project", (t) => {
  const root = temporaryProject(t, "opennori-hook-claude-only-");
  initProject(root, { developer: "Probe", platforms: ["claude"], confirm: true });
  assert.equal(
    buildCodexHookContext({ session_id: "codex-session", cwd: root, hook_event_name: "SessionStart" }),
    null
  );
  const claude = buildClaudeHookContext({ session_id: "claude-session", cwd: root, hook_event_name: "SessionStart" });
  assert.match(claude.context, /no task is selected/i);
  assert.match(runHook({ session_id: "claude-session", cwd: root, hook_event_name: "SessionStart" }, "claude").hookSpecificOutput.additionalContext, /no task is selected/i);
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
  const otherSession = buildCodexHookContext({
    session_id: "other-session",
    cwd: nested,
    hook_event_name: "SessionStart"
  });
  assert.equal(otherSession.task_id, null);
  assert.match(otherSession.context, /no task is selected/i);
  assert.match(otherSession.context, /Load the nori Skill/);
  assert.doesNotMatch(otherSession.context, new RegExp(created.data.task.id));
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
  assert.match(implement.context, /Optional implement context:/);
  assert.match(implement.context, /IMPLEMENT-CONTEXT-ONLY/);
  assert.doesNotMatch(implement.context, /CHECK-CONTEXT-ONLY/);

  runCli(root, ["task", "review", taskId], { session });
  for (const hookEventName of ["UserPromptSubmit", "SubagentStart"]) {
    const verify = buildCodexHookContext({ session_id: session, cwd: root, hook_event_name: hookEventName });
    assert.equal(verify.hook_event_name, hookEventName);
    assert.match(verify.context, /Stage: verify/);
    assert.match(verify.context, /Optional check context:/);
    assert.match(verify.context, /CHECK-CONTEXT-ONLY/);
    assert.doesNotMatch(verify.context, /IMPLEMENT-CONTEXT-ONLY/);
  }
});

test("optional task documents and context never become an implementation gate", (t) => {
  const root = temporaryProject(t, "opennori-hook-optional-context-");
  const session = "hook-optional-context-session";
  initializeProject(root);
  const taskId = prepareContextTask(root, session);
  const directory = path.join(root, ".opennori/tasks", taskId);
  fs.writeFileSync(path.join(directory, "design.md"), "# Design\n\nA reviewable technical choice.\n");
  fs.writeFileSync(path.join(directory, "plan.md"), "# Plan\n\n- [ ] Deliver the result.\n");
  fs.rmSync(path.join(directory, "implement.jsonl"));
  fs.rmSync(path.join(directory, "check.jsonl"));

  assert.equal(runCli(root, ["task", "start", taskId], { session }).data.status, "in_progress");
  const hook = buildCodexHookContext({ session_id: session, cwd: root, hook_event_name: "SessionStart" });
  assert.match(hook.context, /Task documents:/);
  assert.ok(hook.context.includes(`.opennori/tasks/${taskId}/contract.md`));
  assert.ok(hook.context.includes(`.opennori/tasks/${taskId}/design.md`));
  assert.ok(hook.context.includes(`.opennori/tasks/${taskId}/plan.md`));
  assert.doesNotMatch(hook.context, /Optional implement context:/);

  runCli(
    root,
    ["task", "context", "write", taskId, "--mode", "implement", "--input", ".opennori/.runtime/hook-implement.json"],
    { session }
  );
  const refreshed = buildCodexHookContext({ session_id: session, cwd: root, hook_event_name: "SessionStart" });
  assert.match(refreshed.context, /Optional implement context:/);
  assert.match(refreshed.context, /implementation entry/);
});

test("stale optional context fails soft without hiding canonical task state", (t) => {
  const root = temporaryProject(t, "opennori-hook-stale-context-");
  const session = "hook-stale-context-session";
  initializeProject(root);
  const taskId = prepareContextTask(root, session);
  runCli(root, ["task", "start", taskId], { session });
  fs.rmSync(path.join(root, "implement-source.txt"));

  const hook = buildCodexHookContext({ session_id: session, cwd: root, hook_event_name: "SessionStart" });
  assert.match(hook.context, new RegExp(`Task: ${taskId}`));
  assert.match(hook.context, /Stage: implement/);
  assert.match(hook.context, /Optional implement context is unavailable:/);
  assert.match(hook.context, /Context file does not exist/);
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

  const noTask = runHook({ session_id: session, cwd: root, hook_event_name: "SessionStart" });
  assert.match(noTask.hookSpecificOutput.additionalContext, /no task is selected/i);

  const created = runCli(root, ["task", "create", "--title", "Process hook", "--slug", "process-hook"], { session });

  const output = runHook({ session_id: session, cwd: root, hook_event_name: "SessionStart" });
  assert.equal(output.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(output.hookSpecificOutput.additionalContext, new RegExp(created.data.task.id));
  assert.match(output.hookSpecificOutput.additionalContext, /^<opennori-context>/);
  assert.match(output.hookSpecificOutput.additionalContext, /<\/opennori-context>$/);

  const malformed = runHook("not-json");
  assert.match(malformed.systemMessage, /^OpenNori context could not be loaded:/);
});
