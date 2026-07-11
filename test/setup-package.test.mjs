import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  initializeProject,
  prepareApprovedTask,
  repositoryRoot,
  runCli,
  temporaryProject,
  writeProjectJson
} from "./support/fixture.mjs";

const { doctorProject } = await import("../dist/src/doctor.js");
const { inspectCodexPlugin, installCodexPlugin } = await import("../dist/src/codex-plugin.js");
const { initProject, uninstallProject, updateProject } = await import("../dist/src/lifecycle.js");
const { currentProductVersion, readProjectConfig, renderProjectConfig } = await import("../dist/src/project.js");
const { setupHost } = await import("../dist/src/setup.js");
const publicApi = await import("../dist/src/index.js");

function runHost(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    ...options
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")}\nstatus=${result.status}\nstdout=${result.stdout}\nstderr=${result.stderr}`
  );
  return result;
}

test("package, Plugin, marketplace, and public API expose one release contract", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8"));
  const plugin = JSON.parse(fs.readFileSync(path.join(repositoryRoot, ".codex-plugin/plugin.json"), "utf8"));
  const marketplace = JSON.parse(fs.readFileSync(path.join(repositoryRoot, ".agents/plugins/marketplace.json"), "utf8"));
  assert.equal(plugin.version, packageJson.version);
  assert.equal(marketplace.plugins[0].source.version, packageJson.version);
  assert.equal(packageJson.exports["."].import, "./dist/src/index.js");
  if (process.platform !== "win32") {
    assert.notEqual(fs.statSync(path.join(repositoryRoot, packageJson.bin.opennori)).mode & 0o111, 0);
  }
  assert.deepEqual(Object.keys(packageJson.exports), [".", "./task", "./project", "./memory", "./testing", "./package.json"]);
  for (const subpath of ["task", "project", "memory", "testing"]) {
    assert.equal(packageJson.exports[`./${subpath}`].import, `./dist/src/public/${subpath}.js`);
    assert.equal(packageJson.exports[`./${subpath}`].types, `./dist/src/public/${subpath}.d.ts`);
  }
  const publishWorkflow = fs.readFileSync(path.join(repositoryRoot, ".github/workflows/publish.yml"), "utf8");
  assert.match(publishWorkflow, /id-token: write/);
  assert.match(publishWorkflow, /--provenance --tag/);
  assert.match(publishWorkflow, /\*-alpha\.\*\) tag=alpha/);
  assert.equal(publicApi.OPENNORI_API_VERSION, 1);
  assert.equal(publicApi.CURRENT_STATE_SCHEMA_VERSION, 2);
  for (const name of ["initProject", "updateProject", "doctorProject", "loadTaskView", "planTaskDelivery", "recordTaskDelivery"]) {
    assert.equal(typeof publicApi[name], "function", name);
  }
});

test("Codex Plugin refresh never removes the installed version before add succeeds", (t) => {
  const root = temporaryProject(t, "opennori-plugin-refresh-");
  const bin = path.join(root, "bin");
  const statePath = path.join(root, "state.json");
  const executable = path.join(bin, "codex");
  fs.mkdirSync(bin);
  fs.writeFileSync(
    executable,
    [
      "#!/usr/bin/env node",
      "const fs = require('node:fs');",
      "const statePath = process.env.OPENNORI_FAKE_CODEX_STATE;",
      "const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));",
      "const command = process.argv.slice(2).join(' ');",
      "state.calls.push(command);",
      "if (command === 'plugin marketplace list --json') {",
      "  console.log(JSON.stringify({ marketplaces: [{ name: 'opennori', marketplaceSource: { sourceType: 'git', source: 'https://github.com/okbexx/opennori.git' } }] }));",
      "} else if (command === 'plugin marketplace upgrade opennori --json') {",
      "  console.log('{}');",
      "} else if (command === 'plugin list --available --json') {",
      "  console.log(JSON.stringify({ installed: state.installed ? [{ pluginId: 'opennori@opennori', version: state.version, installed: true, enabled: true, source: { source: 'npm', version: 'new' } }] : [], available: [] }));",
      "} else if (command === 'plugin add opennori@opennori --json') {",
      "  if (process.env.OPENNORI_FAKE_CODEX_ADD_FAIL === '1') { fs.writeFileSync(statePath, JSON.stringify(state)); console.error('injected add failure'); process.exit(1); }",
      "  state.installed = true; state.version = 'new'; console.log('{}');",
      "} else if (command.startsWith('plugin remove ')) {",
      "  state.installed = false; console.log('{}');",
      "} else {",
      "  console.error('unexpected command: ' + command); process.exit(1);",
      "}",
      "fs.writeFileSync(statePath, JSON.stringify(state));",
      ""
    ].join("\n")
  );
  fs.chmodSync(executable, 0o755);
  const previousPath = process.env.PATH;
  const previousState = process.env.OPENNORI_FAKE_CODEX_STATE;
  const previousFailure = process.env.OPENNORI_FAKE_CODEX_ADD_FAIL;
  process.env.PATH = `${bin}${path.delimiter}${previousPath ?? ""}`;
  process.env.OPENNORI_FAKE_CODEX_STATE = statePath;
  try {
    fs.writeFileSync(statePath, JSON.stringify({ installed: true, version: "old", calls: [] }));
    const installed = installCodexPlugin(root, "new");
    assert.equal(installed.ready, true);
    let state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.equal(state.version, "new");
    assert.equal(state.calls.some((command) => command.startsWith("plugin remove ")), false);

    fs.writeFileSync(statePath, JSON.stringify({ installed: true, version: "old", calls: [] }));
    process.env.OPENNORI_FAKE_CODEX_ADD_FAIL = "1";
    assert.throws(() => installCodexPlugin(root, "new"), /Codex command failed/);
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.equal(state.installed, true);
    assert.equal(state.version, "old");
    assert.equal(state.calls.some((command) => command.startsWith("plugin remove ")), false);
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
    if (previousState === undefined) delete process.env.OPENNORI_FAKE_CODEX_STATE;
    else process.env.OPENNORI_FAKE_CODEX_STATE = previousState;
    if (previousFailure === undefined) delete process.env.OPENNORI_FAKE_CODEX_ADD_FAIL;
    else process.env.OPENNORI_FAKE_CODEX_ADD_FAIL = previousFailure;
  }
});

test("Codex accepts only a readable version-matched local OpenNori Plugin and never upgrades its marketplace", (t) => {
  const root = temporaryProject(t, "opennori-local-marketplace-");
  const bin = path.join(root, "bin");
  const pluginRoot = path.join(root, "plugin");
  const marketplaceRoot = path.join(root, "marketplace");
  const statePath = path.join(root, "state.json");
  const executable = path.join(bin, "codex");
  fs.mkdirSync(bin);
  fs.mkdirSync(path.join(pluginRoot, ".codex-plugin"), { recursive: true });
  fs.mkdirSync(marketplaceRoot);
  fs.writeFileSync(
    executable,
    [
      "#!/usr/bin/env node",
      "const fs = require('node:fs');",
      "const statePath = process.env.OPENNORI_FAKE_CODEX_STATE;",
      "const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));",
      "const command = process.argv.slice(2).join(' ');",
      "state.calls.push(command);",
      "if (command === 'plugin marketplace list --json') {",
      "  console.log(JSON.stringify({ marketplaces: [{ name: 'opennori', marketplaceSource: { sourceType: 'local', source: state.marketplaceRoot } }] }));",
      "} else if (command === 'plugin list --available --json') {",
      "  console.log(JSON.stringify({ installed: [{ pluginId: 'opennori@opennori', version: state.version, installed: true, enabled: true, source: { source: 'local', path: state.pluginRoot } }], available: [] }));",
      "} else if (command === 'plugin add opennori@opennori --json') {",
      "  state.version = 'new'; console.log('{}');",
      "} else if (command.startsWith('plugin marketplace upgrade')) {",
      "  console.error('local marketplaces must not be upgraded'); process.exit(1);",
      "} else {",
      "  console.error('unexpected command: ' + command); process.exit(1);",
      "}",
      "fs.writeFileSync(statePath, JSON.stringify(state));",
      ""
    ].join("\n")
  );
  fs.chmodSync(executable, 0o755);
  const previousPath = process.env.PATH;
  const previousState = process.env.OPENNORI_FAKE_CODEX_STATE;
  process.env.PATH = `${bin}${path.delimiter}${previousPath ?? ""}`;
  process.env.OPENNORI_FAKE_CODEX_STATE = statePath;
  t.after(() => {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
    if (previousState === undefined) delete process.env.OPENNORI_FAKE_CODEX_STATE;
    else process.env.OPENNORI_FAKE_CODEX_STATE = previousState;
  });

  const writeState = () =>
    fs.writeFileSync(statePath, JSON.stringify({ version: "old", calls: [], pluginRoot, marketplaceRoot }));
  const writeManifest = (manifest) =>
    fs.writeFileSync(path.join(pluginRoot, ".codex-plugin", "plugin.json"), JSON.stringify(manifest));

  writeManifest({ name: "opennori", version: "new" });
  writeState();
  const installed = installCodexPlugin(root, "new");
  assert.equal(installed.ready, true);
  assert.equal(installed.marketplace_source_type, "local");
  assert.equal(installed.marketplace_upgraded, false);
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(state.calls.includes("plugin add opennori@opennori --json"), true);
  assert.equal(state.calls.some((command) => command.startsWith("plugin marketplace upgrade")), false);

  writeManifest({ name: "opennori", version: "old" });
  writeState();
  let inspection = inspectCodexPlugin(root, "new");
  assert.equal(inspection.marketplace_source_type, "local");
  assert.equal(inspection.marketplace_source_valid, false);
  assert.throws(() => installCodexPlugin(root, "new"), /does not expose a readable OpenNori new Plugin manifest/);

  fs.rmSync(path.join(pluginRoot, ".codex-plugin", "plugin.json"));
  writeState();
  inspection = inspectCodexPlugin(root, "new");
  assert.equal(inspection.marketplace_source_type, "local");
  assert.equal(inspection.marketplace_source_valid, false);
  assert.throws(() => installCodexPlugin(root, "new"), /does not expose a readable OpenNori new Plugin manifest/);
});

test("host setup upgrades the CLI, reports partial progress, and converges on retry", (t) => {
  const root = temporaryProject(t, "opennori-setup-");
  const expectedVersion = "0.2.0-alpha.1";
  const prefix = path.join(root, "global");
  const executable = path.join(prefix, "bin", "opennori");
  const originalPath = process.env.PATH;
  process.env.PATH = `${path.dirname(executable)}${path.delimiter}${originalPath ?? ""}`;
  t.after(() => {
    process.env.PATH = originalPath;
  });

  let installedVersion = "0.1.30";
  const calls = [];
  const runner = (command, args) => {
    calls.push([command, ...args]);
    if (command === "npm" && args[0] === "ls") {
      return {
        status: 0,
        stdout: JSON.stringify({ dependencies: { opennori: { version: installedVersion } } }),
        stderr: ""
      };
    }
    if (command === "npm" && args[0] === "prefix") return { status: 0, stdout: `${prefix}\n`, stderr: "" };
    if (command === "npm" && args[0] === "install") {
      assert.deepEqual(args, ["install", "--global", `opennori@${expectedVersion}`]);
      installedVersion = expectedVersion;
      return { status: 0, stdout: "installed\n", stderr: "" };
    }
    if ((command === executable || command === "opennori") && args[0] === "--version") {
      return { status: 0, stdout: `${installedVersion}\n`, stderr: "" };
    }
    throw new Error(`Unexpected host command: ${command} ${args.join(" ")}`);
  };
  const pluginReady = {
    cli: true,
    marketplace_present: true,
    marketplace_source_valid: true,
    installed: true,
    enabled: true,
    installed_version: expectedVersion,
    available_version: expectedVersion,
    version: expectedVersion,
    expected_version: expectedVersion,
    ready: true,
    marketplace_added: false,
    marketplace_upgraded: true,
    plugin_reinstalled: true
  };

  assert.throws(
    () =>
      setupHost(root, {
        expectedVersion,
        runner,
        binaryExists: (filePath) => filePath === executable,
        pluginInstaller: () => {
          throw new Error("injected platform setup failure");
        }
      }),
    (error) => {
      assert.match(error.message, /CLI was installed successfully/);
      assert.match(error.recovery, /installed CLI will be reused/);
      assert.deepEqual(error.context.host_setup, {
        cli_installed: true,
        cli_version: expectedVersion,
        platform: "codex"
      });
      return true;
    }
  );
  assert.equal(installedVersion, expectedVersion);

  const result = setupHost(root, {
    expectedVersion,
    runner,
    binaryExists: (filePath) => filePath === executable,
    pluginInstaller: () => pluginReady
  });
  assert.equal(result.cli_installed, false);
  assert.equal(result.cli.command_ready, true);
  assert.equal(result.cli.ready, true);
  assert.equal(result.platform.ready, true);
  assert.ok(calls.filter(([command, argument]) => command === "opennori" && argument === "--version").length >= 2);
});

test("the packed artifact installs a ready CLI and completes Git delivery in a real temporary project", { timeout: 45_000 }, (t) => {
  const root = temporaryProject(t, "opennori-packed-artifact-");
  const expectedVersion = currentProductVersion();
  const packDirectory = path.join(root, "pack");
  const prefix = path.join(root, "prefix");
  const project = path.join(root, "project");
  fs.mkdirSync(packDirectory);
  fs.mkdirSync(project);

  const packed = runHost("npm", ["pack", repositoryRoot, "--pack-destination", packDirectory, "--json"], {
    cwd: root
  });
  const packResult = JSON.parse(packed.stdout);
  const tarball = path.join(packDirectory, packResult[0].filename);
  assert.equal(fs.existsSync(tarball), true);

  const consumer = path.join(root, "consumer");
  fs.mkdirSync(consumer);
  fs.writeFileSync(path.join(consumer, "package.json"), '{"name":"opennori-consumer","private":true,"type":"module"}\n');
  runHost("npm", ["install", tarball, "--ignore-scripts"], { cwd: consumer });
  const imported = runHost(
    "node",
    [
      "--input-type=module",
      "--eval",
      [
        "import { OPENNORI_API_VERSION, CURRENT_STATE_SCHEMA_VERSION } from 'opennori';",
        "import { createTask, OPENNORI_API_VERSION as taskApiVersion } from 'opennori/task';",
        "import { planUpdate, OPENNORI_API_VERSION as projectApiVersion } from 'opennori/project';",
        "import { codexSessionMemoryAdapter, OPENNORI_API_VERSION as memoryApiVersion } from 'opennori/memory';",
        "import { buildTaskRecord, createRecordingHostCommandRunner, createTemporaryGitProject, OPENNORI_API_VERSION as testingApiVersion } from 'opennori/testing';",
        "const recorder = createRecordingHostCommandRunner();",
        "recorder.runner('git', ['status'], process.cwd());",
        "const temporary = createTemporaryGitProject();",
        "const branch = temporary.runGit(['branch', '--show-current']);",
        "temporary.cleanup();",
        "console.log(JSON.stringify({ OPENNORI_API_VERSION, CURRENT_STATE_SCHEMA_VERSION, versions: [taskApiVersion, projectApiVersion, memoryApiVersion, testingApiVersion], taskId: buildTaskRecord().id, branch, calls: recorder.calls.length, createTask: typeof createTask, planUpdate: typeof planUpdate, memorySearch: typeof codexSessionMemoryAdapter.search }));"
      ].join("\n")
    ],
    { cwd: consumer }
  );
  assert.deepEqual(JSON.parse(imported.stdout), {
    OPENNORI_API_VERSION: 1,
    CURRENT_STATE_SCHEMA_VERSION: 2,
    versions: [1, 1, 1, 1],
    taskId: "2025-01-01-example-task",
    branch: "main",
    calls: 1,
    createTask: "function",
    planUpdate: "function",
    memorySearch: "function"
  });
  fs.writeFileSync(
    path.join(consumer, "consumer.ts"),
    [
      'import { OPENNORI_API_VERSION, planUpdate, type DeliveryPlanInput, type LifecycleRunResult } from "opennori";',
      'import { createTask, type TaskRecord } from "opennori/task";',
      'import { doctorProject, type DoctorResult } from "opennori/project";',
      'import { codexSessionMemoryAdapter, type SessionMemoryAdapter } from "opennori/memory";',
      'import { buildContract, buildTaskRecord, createRecordingHostCommandRunner, type HostCommandCall } from "opennori/testing";',
      'const delivery: DeliveryPlanInput = { mode: "commit" };',
      "const version: 1 = OPENNORI_API_VERSION;",
      'const plan = planUpdate(".");',
      "const result: LifecycleRunResult | null = null;",
      "const task: TaskRecord = buildTaskRecord();",
      "const memory: SessionMemoryAdapter = codexSessionMemoryAdapter;",
      "const calls: HostCommandCall[] = createRecordingHostCommandRunner().calls;",
      "const diagnosis: DoctorResult | null = null;",
      "void [delivery, version, plan, result, task, memory, calls, diagnosis, createTask, doctorProject, buildContract];",
      ""
    ].join("\n")
  );
  runHost(
    path.join(repositoryRoot, "node_modules/.bin/tsc"),
    ["--noEmit", "--strict", "--target", "ES2023", "--module", "NodeNext", "--moduleResolution", "NodeNext", "consumer.ts"],
    { cwd: consumer }
  );

  const environment = {
    ...process.env,
    npm_config_prefix: prefix,
    OPENNORI_TEST_VERSION: expectedVersion
  };
  runHost("npm", ["install", "--global", tarball, "--ignore-scripts"], { cwd: root, env: environment });
  const executableDirectory = path.join(prefix, "bin");
  const executable = path.join(executableDirectory, "opennori");
  const fakeCodex = path.join(executableDirectory, "codex");
  const fakeClaude = path.join(executableDirectory, "claude");
  fs.writeFileSync(
    fakeCodex,
    [
      "#!/usr/bin/env node",
      "const args = process.argv.slice(2).join(' ');",
      "const version = process.env.OPENNORI_TEST_VERSION;",
      "if (args === 'plugin marketplace list --json') {",
      "  console.log(JSON.stringify({ marketplaces: [{ name: 'opennori', marketplaceSource: { sourceType: 'github', source: 'https://github.com/okbexx/opennori' } }] }));",
      "} else if (args === 'plugin list --available --json') {",
      "  console.log(JSON.stringify({ installed: [{ pluginId: 'opennori@opennori', version, installed: true, enabled: true, source: { source: 'npm', version } }], available: [] }));",
      "} else {",
      "  console.error('Unexpected fake Codex command: ' + args);",
      "  process.exitCode = 1;",
      "}",
      ""
    ].join("\n")
  );
  fs.chmodSync(fakeCodex, 0o755);
  fs.writeFileSync(
    fakeClaude,
    [
      "#!/usr/bin/env node",
      "if (process.argv[2] === '--version') console.log('2.1.89');",
      "else { console.error('Unexpected fake Claude command'); process.exitCode = 1; }",
      ""
    ].join("\n")
  );
  fs.chmodSync(fakeClaude, 0o755);
  environment.PATH = `${executableDirectory}${path.delimiter}${process.env.PATH ?? ""}`;

  const sessionEnvironment = { ...environment, CODEX_THREAD_ID: "packed-product-session" };
  const packedCli = (args) =>
    JSON.parse(
      runHost(executable, [...args, "--root", project, "--json"], {
        cwd: project,
        env: sessionEnvironment
      }).stdout
    );
  const projectGit = (args) => runHost("git", args, { cwd: project, env: sessionEnvironment }).stdout.trim();

  assert.equal(runHost(executable, ["--version"], { cwd: project, env: environment }).stdout.trim(), environment.OPENNORI_TEST_VERSION);
  projectGit(["init", "--initial-branch", "main"]);
  projectGit(["config", "user.name", "OpenNori Packed Test"]);
  projectGit(["config", "user.email", "packed-test@example.invalid"]);
  const initialized = runHost(executable, ["init", "--user", "Packed", "--root", project, "--json"], {
    cwd: project,
    env: environment
  });
  assert.equal(JSON.parse(initialized.stdout).data.applied, true);
  assert.equal(fs.existsSync(path.join(project, ".opennori/workflow.md")), true);
  assert.equal(fs.existsSync(path.join(project, "AGENTS.md")), true);
  fs.writeFileSync(path.join(project, "app.txt"), "baseline\n");
  projectGit(["add", "--all"]);
  projectGit(["commit", "-m", "Initialize packed product project"]);

  const diagnosis = runHost(executable, ["doctor", "--root", project, "--json"], { cwd: project, env: environment });
  assert.equal(JSON.parse(diagnosis.stdout).data.status, "ready");

  const task = packedCli([
    "task",
    "create",
    "--title",
    "Deliver packed product change",
    "--slug",
    "packed-git-delivery"
  ]).data.task;
  const contractInput = writeProjectJson(project, ".opennori/.runtime/packed-contract-input.json", {
    goal: "Deliver one verified change from the packed product",
    outcomes: [
      {
        id: "outcome-packed-delivery",
        statement: "The packed product change is verified and committed",
        verification: "Inspect app.txt and the final Git checkpoint",
        required: true
      }
    ],
    assumptions: []
  });
  const contextInput = writeProjectJson(project, ".opennori/.runtime/packed-context-input.json", [
    { file: "app.txt", reason: "Accepted project artifact" }
  ]);
  packedCli(["task", "contract", "write", task.id, "--input", contractInput]);
  packedCli([
    "task",
    "contract",
    "approve",
    task.id,
    "--approver",
    "Packed",
    "--confirmation",
    "packed-product-approval"
  ]);
  packedCli(["task", "context", "write", task.id, "--mode", "implement", "--input", contextInput]);
  packedCli(["task", "context", "write", task.id, "--mode", "check", "--input", contextInput]);
  packedCli(["task", "delivery", "plan", task.id, "--mode", "commit"]);
  fs.rmSync(path.join(project, contractInput));
  fs.rmSync(path.join(project, contextInput));

  packedCli(["task", "start", task.id]);
  fs.appendFileSync(path.join(project, "app.txt"), "delivered\n");
  packedCli(["task", "review", task.id]);
  const evidenceInput = writeProjectJson(project, ".opennori/.runtime/packed-evidence-input.json", {
    outcome_id: "outcome-packed-delivery",
    result: "proven",
    summary: "The packed project artifact contains the delivered state",
    sources: [
      {
        type: "command",
        command: "test $(tail -n 1 app.txt) = delivered",
        exit_code: 0,
        stdout: "delivered",
        stderr: ""
      }
    ]
  });
  packedCli(["task", "evidence", "add", task.id, "--input", evidenceInput]);
  fs.rmSync(path.join(project, evidenceInput));
  projectGit(["add", "--all"]);
  projectGit(["commit", "-m", "Deliver packed product change"]);
  const implementationCommit = projectGit(["rev-parse", "HEAD"]);
  assert.equal(packedCli(["task", "delivery", "record", task.id]).data.commit, implementationCommit);
  assert.equal(packedCli(["task", "finish", task.id]).data.status, "completed");
  const archived = packedCli([
    "task",
    "archive",
    task.id,
    "--summary",
    "Packed Git delivery completed",
    "--knowledge",
    "none",
    "--knowledge-summary",
    "No reusable project knowledge was introduced"
  ]).data;
  assert.equal(archived.summary.delivery.mode, "commit");
  projectGit(["add", "--all"]);
  projectGit(["commit", "-m", `Finalize ${task.id}`]);
  const finalCommit = projectGit(["rev-parse", "HEAD"]);
  const finalized = packedCli(["task", "delivery", "finalize", task.id]).data;
  assert.equal(finalized.implementation_commit, implementationCommit);
  assert.equal(finalized.final_commit, finalCommit);
  assert.equal(packedCli(["doctor"]).data.status, "ready");
  assert.equal(packedCli(["uninstall", "--dry-run"]).data.applied, false);
  assert.equal(packedCli(["uninstall", "--confirm"]).data.applied, true);
  assert.equal(fs.existsSync(path.join(project, ".opennori/manifest.json")), false);
  assert.equal(fs.existsSync(path.join(project, ".opennori/tasks/archive")), true);

  const claudeProject = path.join(root, "claude-project");
  fs.mkdirSync(claudeProject);
  const claudeSetup = runHost(executable, ["setup", "--platform", "claude", "--dry-run", "--json"], {
    cwd: claudeProject,
    env: environment
  });
  assert.equal(JSON.parse(claudeSetup.stdout).data.platform.ready, true);
  const claudeSetupHuman = runHost(executable, ["setup", "--platform", "claude", "--dry-run"], {
    cwd: claudeProject,
    env: environment
  });
  assert.match(claudeSetupHuman.stdout, /opennori init --user <name> --platform claude/);
  const claudeInit = runHost(
    executable,
    ["init", "--user", "Packed", "--platform", "claude", "--root", claudeProject, "--json"],
    { cwd: claudeProject, env: environment }
  );
  assert.equal(JSON.parse(claudeInit.stdout).data.applied, true);
  assert.equal(fs.existsSync(path.join(claudeProject, "CLAUDE.md")), true);
  assert.equal(fs.existsSync(path.join(claudeProject, ".claude/skills/nori/SKILL.md")), true);
  const claudeSessionEnvironment = {
    ...environment,
    CODEX_THREAD_ID: "",
    OPENNORI_SESSION_ID: "",
    CLAUDE_CODE_SESSION_ID: "claude-session"
  };
  const claudeTask = runHost(
    executable,
    ["task", "create", "--title", "Claude task", "--slug", "claude-task", "--root", claudeProject, "--json"],
    { cwd: claudeProject, env: claudeSessionEnvironment }
  );
  assert.equal(JSON.parse(claudeTask.stdout).data.selected, true);
  const claudeCurrent = runHost(executable, ["task", "current", "--root", claudeProject, "--json"], {
    cwd: claudeProject,
    env: claudeSessionEnvironment
  });
  assert.match(JSON.parse(claudeCurrent.stdout).data.task.title, /Claude task/);

  const claudeHumanProject = path.join(root, "claude-human-project");
  fs.mkdirSync(claudeHumanProject);
  const claudeHumanInit = runHost(executable, ["init", "--user", "Packed", "--platform", "claude", "--root", claudeHumanProject], {
    cwd: claudeHumanProject,
    env: environment
  });
  assert.match(claudeHumanInit.stdout, /new Claude Code conversation/);

  const previewProject = path.join(root, "preview-project");
  fs.mkdirSync(previewProject);
  fs.writeFileSync(path.join(previewProject, "AGENTS.md"), "<!-- OPENNORI:START -->\nbroken managed section\n");
  const preview = runHost(executable, ["init", "--user", "Packed", "--root", previewProject, "--json"], {
    cwd: previewProject,
    env: environment
  });
  const previewData = JSON.parse(preview.stdout).data;
  assert.equal(previewData.applied, false);
  assert.equal(previewData.platform, null);
  assert.equal(Object.hasOwn(previewData, "codex"), false);
  const previewHuman = runHost(executable, ["init", "--user", "Packed", "--root", previewProject], {
    cwd: previewProject,
    env: environment
  });
  assert.match(previewHuman.stdout, /rerun without --dry-run and with --confirm/i);
  const claudeDiagnosis = runHost(executable, ["doctor", "--root", claudeProject, "--json"], {
    cwd: claudeProject,
    env: environment
  });
  assert.equal(JSON.parse(claudeDiagnosis.stdout).data.status, "ready");
});

test("the Claude adapter manages native project instructions and Skills safely", (t) => {
  const root = temporaryProject(t, "opennori-claude-adapter-");
  const instructions = path.join(root, "CLAUDE.md");
  fs.writeFileSync(instructions, "user instructions\n");
  initProject(root, { developer: "Probe", platforms: ["claude"], confirm: true });

  const config = readProjectConfig(root);
  assert.deepEqual(config.platforms, ["claude"]);
  const content = fs.readFileSync(instructions, "utf8");
  assert.match(content, /^user instructions\n/);
  assert.equal(content.split("<!-- OPENNORI:CLAUDE:START -->").length - 1, 1);
  for (const skill of [
    "nori",
    "nori-plan",
    "nori-implement",
    "nori-check",
    "nori-finish",
    "nori-update-spec",
    "nori-project-health"
  ]) {
    assert.equal(fs.existsSync(path.join(root, ".claude/skills", skill, "SKILL.md")), true);
  }
  assert.match(fs.readFileSync(path.join(root, ".claude/skills/nori-plan/SKILL.md"), "utf8"), /first configured platform is `codex`/);
  assert.match(fs.readFileSync(path.join(root, ".claude/skills/nori-implement/SKILL.md"), "utf8"), /platforms without coordination support/);
  assert.match(fs.readFileSync(path.join(root, ".claude/skills/nori-check/SKILL.md"), "utf8"), /task evidence run/);
  assert.match(fs.readFileSync(path.join(root, ".claude/skills/nori-finish/SKILL.md"), "utf8"), /archive command writes exactly one/);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori/manifest.json"), "utf8"));
  assert.deepEqual(manifest.platforms, ["claude"]);

  uninstallProject(root, { confirm: true });
  assert.equal(fs.readFileSync(instructions, "utf8"), "user instructions\n");
  assert.equal(fs.existsSync(path.join(root, ".claude/skills/nori/SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(root, ".claude/skills/nori")), false);
});

test("default and explicit package scopes are recorded at task creation", (t) => {
  const root = temporaryProject(t, "opennori-packages-");
  initProject(root, { developer: "Probe", confirm: true });
  fs.mkdirSync(path.join(root, "packages/app"), { recursive: true });
  fs.mkdirSync(path.join(root, "packages/tools"), { recursive: true });
  const configPath = path.join(root, ".opennori/config.yaml");
  const config = {
    ...readProjectConfig(root),
    packages: { app: { path: "packages/app" }, tools: { path: "packages/tools" } },
    default_package: "app"
  };
  fs.writeFileSync(configPath, renderProjectConfig(config));
  const configBeforeUpdate = fs.readFileSync(configPath, "utf8");

  const defaultTask = runCli(root, ["task", "create", "--title", "Default package", "--slug", "default-package"]);
  assert.equal(defaultTask.data.task.package, "app");
  const explicitTask = runCli(root, ["task", "create", "--title", "Explicit package", "--slug", "explicit-package", "--package", "tools"]);
  assert.equal(explicitTask.data.task.package, "tools");

  const unknown = runCli(
    root,
    ["task", "create", "--title", "Unknown package", "--slug", "unknown-package", "--package", "missing"],
    { ok: false }
  );
  assert.equal(unknown.error.code, "task_package_unknown");
  assert.equal(runCli(root, ["task", "list"]).data.length, 2);

  updateProject(root, { confirm: true });
  assert.equal(fs.readFileSync(configPath, "utf8"), configBeforeUpdate);
});

test("package paths reject non-canonical values and directory aliases", (t) => {
  const root = temporaryProject(t, "opennori-package-paths-");
  initProject(root, { developer: "Probe", confirm: true });
  fs.mkdirSync(path.join(root, "packages/app"), { recursive: true });
  const configPath = path.join(root, ".opennori/config.yaml");
  const base = readProjectConfig(root);

  fs.writeFileSync(
    configPath,
    [
      "schema_version: opennori/project-v1",
      "developer: Probe",
      "platforms:",
      "  - codex",
      "packages:",
      "  app:",
      "    path: packages/app/",
      "default_package: app",
      ""
    ].join("\n")
  );
  assert.equal(
    runCli(root, ["task", "create", "--title", "Bad path", "--slug", "bad-path"], { ok: false }).error.code,
    "config_package_path_invalid"
  );

  fs.symlinkSync("app", path.join(root, "packages/alias"));
  fs.writeFileSync(
    configPath,
    renderProjectConfig({
      ...base,
      packages: { app: { path: "packages/app" }, alias: { path: "packages/alias" } },
      default_package: "app"
    })
  );
  assert.equal(
    runCli(root, ["task", "create", "--title", "Aliased path", "--slug", "aliased-path"], { ok: false }).error.code,
    "unsafe_path"
  );
});

test("a missing active package blocks work but still allows selection for recovery", (t) => {
  const root = temporaryProject(t, "opennori-package-recovery-");
  const session = "package-recovery-session";
  initializeProject(root);
  fs.mkdirSync(path.join(root, "packages/app"), { recursive: true });
  const configPath = path.join(root, ".opennori/config.yaml");
  fs.writeFileSync(
    configPath,
    renderProjectConfig({
      ...readProjectConfig(root),
      packages: { app: { path: "packages/app" } },
      default_package: "app"
    })
  );
  const { taskId } = prepareApprovedTask(root, "package-recovery", session);
  runCli(root, ["task", "start", taskId], { session });
  fs.rmSync(path.join(root, "packages/app"), { recursive: true });

  assert.equal(runCli(root, ["task", "review", taskId], { ok: false, session }).error.code, "config_package_path_missing");
  assert.equal(runCli(root, ["task", "select", taskId], { session }).data.id, taskId);
  const diagnosis = doctorProject(root);
  const packageCheck = diagnosis.checks.find((check) => check.id === `task.${taskId}.package`);
  assert.equal(packageCheck.ok, false);
});
