import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  initializeProject,
  prepareApprovedTask,
  recordTaskDeliveryCommit,
  runCli,
  runCliHuman,
  runGit,
  temporaryProject,
  writeProjectJson
} from "./support/fixture.mjs";

const { finalizeTaskDelivery, planTaskDelivery, recordTaskDelivery } = await import("../dist/src/delivery.js");
const { defaultHostCommandRunner } = await import("../dist/src/host-command.js");

function proveTask(root, taskId, evidencePath, session) {
  runCli(root, ["task", "start", taskId], { session });
  runCli(root, ["task", "review", taskId], { session });
  writeProjectJson(root, evidencePath, {
    outcome_id: "outcome-workflow",
    result: "proven",
    summary: "Independent verification passed",
    sources: [{ type: "command", command: "npm test", exit_code: 0, stdout: "passed", stderr: "" }]
  });
  runCli(root, ["task", "evidence", "add", taskId, "--input", evidencePath], { session });
}

test("Finish requires a current delivered commit and rejects uncommitted project changes", (t) => {
  const root = temporaryProject(t, "opennori-delivery-commit-");
  const session = "delivery-commit-session";
  initializeProject(root);
  const { taskId, inputs } = prepareApprovedTask(root, "delivery-commit", session);
  assert.throws(
    () => planTaskDelivery(root, taskId, { mode: "commit", base: "--help" }),
    (error) => error.code === "delivery_git_argument_invalid"
  );
  proveTask(root, taskId, inputs.evidence, session);

  assert.equal(runCli(root, ["task", "finish", taskId], { ok: false, session }).error.code, "delivery_incomplete");
  assert.equal(runCli(root, ["task", "delivery", "record", taskId], { ok: false, session }).error.code, "delivery_commit_empty");

  fs.writeFileSync(path.join(root, "uncommitted.txt"), "not delivered\n");
  runGit(root, ["commit", "--allow-empty", "-m", "Unrelated empty commit"]);
  const dirty = runCli(root, ["task", "delivery", "record", taskId], { ok: false, session });
  assert.equal(dirty.error.code, "delivery_changes_uncommitted");
  assert.deepEqual(dirty.error.context.paths, ["uncommitted.txt"]);
  fs.rmSync(path.join(root, "uncommitted.txt"));

  const delivered = recordTaskDeliveryCommit(root, taskId, session).data;
  assert.equal(delivered.mode, "commit");
  assert.equal(delivered.implementation_revision, 1);
  assert.match(delivered.commit, /^[a-f0-9]{40,64}$/);
  assert.equal(runCli(root, ["task", "finish", taskId], { session }).data.status, "completed");
});

test("delivery planning refuses pre-existing project changes", (t) => {
  const root = temporaryProject(t, "opennori-delivery-plan-dirty-");
  const session = "delivery-plan-dirty-session";
  initializeProject(root);
  const taskId = runCli(root, ["task", "create", "--title", "Dirty delivery plan", "--slug", "dirty-delivery-plan"], {
    session
  }).data.task.id;
  fs.writeFileSync(path.join(root, "existing-change.txt"), "unrelated work\n");

  const rejected = runCli(root, ["task", "delivery", "plan", taskId, "--mode", "commit"], { ok: false, session });
  assert.equal(rejected.error.code, "delivery_plan_dirty");
  assert.deepEqual(rejected.error.context.paths, ["existing-change.txt"]);
  assert.equal(fs.existsSync(path.join(root, ".opennori/tasks", taskId, "delivery.json")), false);

  fs.rmSync(path.join(root, "existing-change.txt"));
  assert.equal(runCli(root, ["task", "delivery", "plan", taskId, "--mode", "commit"], { session }).data.status, "planned");
});

test("a delivery waiver needs explicit human provenance", (t) => {
  const root = temporaryProject(t, "opennori-delivery-waiver-");
  const session = "delivery-waiver-session";
  initializeProject(root);
  const { taskId, inputs } = prepareApprovedTask(root, "delivery-waiver", session);

  assert.equal(
    runCli(root, ["task", "delivery", "plan", taskId, "--mode", "waived", "--reason", "No repository delivery"], {
      ok: false,
      session
    }).error.code,
    "delivery_waiver_incomplete"
  );
  const waiver = runCli(
    root,
    [
      "task",
      "delivery",
      "plan",
      taskId,
      "--mode",
      "waived",
      "--actor",
      "Jarl",
      "--confirmation",
      "conversation-message-42",
      "--reason",
      "The task intentionally changes no repository content"
    ],
    { session }
  ).data;
  assert.equal(waiver.status, "waived");
  proveTask(root, taskId, inputs.evidence, session);
  assert.equal(runCli(root, ["task", "finish", taskId], { session }).data.status, "completed");
  const archiveArgs = [
    "task",
    "archive",
    taskId,
    "--summary",
    "Waived task completed",
    "--knowledge",
    "none",
    "--knowledge-summary",
    "No stable knowledge"
  ];
  const archived = runCli(root, archiveArgs, { session });
  assert.equal(archived.data.summary.delivery.mode, "waived");
  const human = runCliHuman(root, archiveArgs, { session });
  assert.match(human, /Completed without Git finalization/);
  assert.doesNotMatch(human, /delivery finalize/);
});

test("pull request delivery verifies the remote head and base through GitHub CLI", (t) => {
  const root = temporaryProject(t, "opennori-delivery-pr-");
  const session = "delivery-pr-session";
  initializeProject(root);
  runGit(root, ["checkout", "-b", "feature/delivery"]);
  runGit(root, ["remote", "add", "origin", "https://github.com/example/opennori-delivery-test.git"]);
  const { taskId, inputs } = prepareApprovedTask(root, "delivery-pr", session);
  runCli(root, ["task", "delivery", "plan", taskId, "--mode", "pull-request", "--base", "main"], { session });
  proveTask(root, taskId, inputs.evidence, session);
  fs.appendFileSync(path.join(root, "source.txt"), "pull request delivery\n");
  runGit(root, ["add", "source.txt"]);
  runGit(root, ["commit", "-m", "Deliver pull request task"]);
  const head = runGit(root, ["rev-parse", "HEAD"]);
  const pullRequestUrl = "https://github.com/example/opennori-delivery-test/pull/7";
  const runner = (command, args, cwd) => {
    if (command === "gh") {
      return {
        status: 0,
        stdout: `${JSON.stringify({ url: pullRequestUrl, headRefOid: head, baseRefName: "main", state: "OPEN" })}\n`,
        stderr: ""
      };
    }
    return defaultHostCommandRunner(command, args, cwd);
  };
  const delivery = recordTaskDelivery(root, taskId, { pullRequestUrl }, runner);
  assert.equal(delivery.mode, "pull_request");
  assert.equal(delivery.pull_request_url, pullRequestUrl);
  assert.equal(delivery.commit, head);
  assert.equal(runCli(root, ["task", "finish", taskId], { session }).data.status, "completed");
  runCli(
    root,
    [
      "task",
      "archive",
      taskId,
      "--summary",
      "Pull request task completed",
      "--knowledge",
      "none",
      "--knowledge-summary",
      "No stable knowledge"
    ],
    { session }
  );
  runGit(root, ["add", ".opennori"]);
  runGit(root, ["commit", "-m", `Finalize ${taskId}`]);
  const finalHead = runGit(root, ["rev-parse", "HEAD"]);
  const finalRunner = (command, args, cwd) => {
    if (command === "gh") {
      return {
        status: 0,
        stdout: `${JSON.stringify({ url: pullRequestUrl, headRefOid: finalHead, baseRefName: "main", state: "OPEN" })}\n`,
        stderr: ""
      };
    }
    return defaultHostCommandRunner(command, args, cwd);
  };
  const finalized = finalizeTaskDelivery(root, taskId, finalRunner);
  assert.equal(finalized.implementation_commit, head);
  assert.equal(finalized.final_commit, finalHead);
});
