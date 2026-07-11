import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  initializeProject,
  prepareApprovedTask,
  runCli,
  runCliPassthrough,
  temporaryProject
} from "./support/fixture.mjs";

const { loadContract } = await import("../dist/src/contract.js");
const { loadEvidence, runCommandEvidence } = await import("../dist/src/evidence.js");
const { findTask } = await import("../dist/src/task.js");

function captureFailure(operation) {
  try {
    operation();
  } catch (error) {
    return error;
  }
  assert.fail("Expected operation to fail");
}

test("evidence run executes exact argv without a shell and derives the result", (t) => {
  const root = temporaryProject(t, "opennori-evidence-command-");
  const session = "evidence-command-session";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "evidence-command", session);
  runCli(root, ["task", "start", taskId], { session });
  runCli(root, ["task", "review", taskId], { session });

  const literal = "$(echo should-not-run); > escaped";
  const proven = runCliPassthrough(
    root,
    [
      "task",
      "evidence",
      "run",
      taskId,
      "--outcome",
      "outcome-workflow",
      "--summary",
      "Exact argv completed"
    ],
    ["node", "-e", "process.stdout.write(process.argv[1] + '\\r\\n')", literal],
    { session }
  ).data;
  assert.equal(proven.result, "proven");
  assert.equal(proven.sources[0].exit_code, 0);
  assert.deepEqual(proven.sources[0].argv, [
    "node",
    "-e",
    "process.stdout.write(process.argv[1] + '\\r\\n')",
    literal
  ]);
  assert.equal(proven.sources[0].cwd, ".");
  assert.equal(proven.sources[0].stdout, `${literal}\n`);

  const failed = runCliPassthrough(
    root,
    [
      "task",
      "evidence",
      "run",
      taskId,
      "--outcome",
      "outcome-workflow",
      "--summary",
      "Command reported a failure"
    ],
    ["node", "-e", "process.stderr.write('failed\\n'); process.exit(3)"],
    { session }
  ).data;
  assert.equal(failed.result, "failed");
  assert.equal(failed.sources[0].exit_code, 3);
  assert.equal(failed.sources[0].stderr, "failed\n");
});

test("evidence run passes child help flags instead of showing OpenNori usage", (t) => {
  const root = temporaryProject(t, "opennori-evidence-child-help-");
  const session = "evidence-child-help-session";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "evidence-child-help", session);
  runCli(root, ["task", "start", taskId], { session });
  runCli(root, ["task", "review", taskId], { session });

  const evidence = runCliPassthrough(
    root,
    [
      "task",
      "evidence",
      "run",
      taskId,
      "--outcome",
      "outcome-workflow",
      "--summary",
      "Child help rendered"
    ],
    ["node", "--help"],
    { session }
  ).data;
  assert.equal(evidence.result, "proven");
  assert.deepEqual(evidence.sources[0].argv, ["node", "--help"]);
  assert.match(evidence.sources[0].stdout, /Usage: node/);
});

test("command Evidence refuses stale revisions and unavailable commands", (t) => {
  const root = temporaryProject(t, "opennori-evidence-revision-");
  const session = "evidence-revision-session";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "evidence-revision", session);
  runCli(root, ["task", "start", taskId], { session });
  runCli(root, ["task", "review", taskId], { session });
  const location = findTask(root, taskId);
  assert.ok(location);
  const contract = loadContract(location.directory, taskId);

  const stale = captureFailure(() =>
    runCommandEvidence(
      root,
      location.directory,
      location.task,
      contract,
      {
        outcome_id: "outcome-workflow",
        summary: "Revision changed",
        command: "node",
        args: []
      },
      () => {
        runCli(root, ["task", "start", taskId], { session });
        return { status: 0, stdout: "passed", stderr: "" };
      }
    )
  );
  assert.equal(stale.code, "evidence_revision_changed");
  assert.equal(loadEvidence(location.directory, taskId, contract).length, 0);

  runCli(root, ["task", "review", taskId], { session });
  const unavailable = captureFailure(() =>
    runCommandEvidence(
      root,
      location.directory,
      findTask(root, taskId).task,
      contract,
      {
        outcome_id: "outcome-workflow",
        summary: "Executable unavailable",
        command: "missing-command",
        args: [],
        cwd: path.relative(root, root)
      },
      () => Object.assign({ status: null, stdout: "", stderr: "" }, { error: Object.assign(new Error("missing"), { code: "ENOENT" }) })
    )
  );
  assert.equal(unavailable.code, "evidence_command_unavailable");
  assert.equal(loadEvidence(location.directory, taskId, contract).length, 0);
});

test("manual Evidence input rejects absolute paths with task-local recovery", (t) => {
  const root = temporaryProject(t, "opennori-evidence-input-path-");
  const session = "evidence-input-path-session";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "evidence-input-path", session);
  runCli(root, ["task", "start", taskId], { session });
  runCli(root, ["task", "review", taskId], { session });
  const failure = runCli(root, ["task", "evidence", "add", taskId, "--input", "/tmp/evidence.json"], {
    ok: false,
    session
  }).error;
  assert.equal(failure.code, "unsafe_path");
  assert.match(failure.recovery, new RegExp(`tasks/${taskId}/research/evidence-inputs`));
});

test("command Evidence validates lifecycle and cwd before invoking the runner", (t) => {
  const root = temporaryProject(t, "opennori-evidence-preflight-");
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "evidence-preflight");
  const location = findTask(root, taskId);
  assert.ok(location);
  const contract = loadContract(location.directory, taskId);
  let calls = 0;
  const runner = () => {
    calls += 1;
    return { status: 0, stdout: "passed", stderr: "" };
  };
  const planning = captureFailure(() =>
    runCommandEvidence(
      root,
      location.directory,
      location.task,
      contract,
      { outcome_id: "outcome-workflow", summary: "Should not run", command: "node", args: [] },
      runner
    )
  );
  assert.equal(planning.code, "evidence_not_allowed");
  assert.equal(calls, 0);

  runCli(root, ["task", "start", taskId]);
  runCli(root, ["task", "review", taskId]);
  const reviewTask = findTask(root, taskId).task;
  for (const cwd of ["../outside", "/tmp", "source.txt"]) {
    const failure = captureFailure(() =>
      runCommandEvidence(
        root,
        location.directory,
        reviewTask,
        contract,
        { outcome_id: "outcome-workflow", summary: "Unsafe cwd", command: "node", args: [], cwd },
        runner
      )
    );
    assert.ok(["unsafe_path", "evidence_cwd_invalid"].includes(failure.code));
  }
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "opennori-evidence-outside-"));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.symlinkSync(outside, path.join(root, "linked-outside"));
  const symlink = captureFailure(() =>
    runCommandEvidence(
      root,
      location.directory,
      reviewTask,
      contract,
      {
        outcome_id: "outcome-workflow",
        summary: "Symlink cwd",
        command: "node",
        args: [],
        cwd: "linked-outside"
      },
      runner
    )
  );
  assert.equal(symlink.code, "unsafe_path");
  assert.equal(calls, 0);
});

test("command Evidence validates the durable record before executing the child process", (t) => {
  const root = temporaryProject(t, "opennori-evidence-record-preflight-");
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "evidence-record-preflight");
  runCli(root, ["task", "start", taskId]);
  runCli(root, ["task", "review", taskId]);
  const location = findTask(root, taskId);
  const contract = loadContract(location.directory, taskId);
  let calls = 0;
  const failure = captureFailure(() =>
    runCommandEvidence(
      root,
      location.directory,
      location.task,
      contract,
      {
        outcome_id: "outcome-workflow",
        summary: "Argument list is too large",
        command: "node",
        args: Array.from({ length: 256 }, (_, index) => String(index))
      },
      () => {
        calls += 1;
        return { status: 0, stdout: "passed", stderr: "" };
      }
    )
  );
  assert.equal(failure.code, "schema_invalid");
  assert.equal(calls, 0);
  assert.equal(loadEvidence(location.directory, taskId, contract).length, 0);
});

test("command Evidence refuses oversized captured output without appending", (t) => {
  const root = temporaryProject(t, "opennori-evidence-output-");
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "evidence-output");
  runCli(root, ["task", "start", taskId]);
  runCli(root, ["task", "review", taskId]);
  const location = findTask(root, taskId);
  const contract = loadContract(location.directory, taskId);
  const failure = captureFailure(() =>
    runCommandEvidence(
      root,
      location.directory,
      location.task,
      contract,
      { outcome_id: "outcome-workflow", summary: "Too much output", command: "node", args: [] },
      () => ({ status: 0, stdout: "x".repeat(256 * 1024 + 1), stderr: "" })
    )
  );
  assert.equal(failure.code, "evidence_command_output_too_large");
  assert.equal(loadEvidence(location.directory, taskId, contract).length, 0);
});
