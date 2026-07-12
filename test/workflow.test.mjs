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

test("the public CLI enforces Plan, Implement, Verify, and Finish", (t) => {
  const root = temporaryProject(t, "opennori-workflow-");
  const session = "workflow-session";
  initializeProject(root, "Jarl");
  const { taskId, inputs } = prepareApprovedTask(root, "workflow", session);

  assert.match(taskId, /^\d{4}-\d{2}-\d{2}-workflow$/);
  assert.equal(runCli(root, ["status"], { session }).data.current.task.id, taskId);

  writeProjectJson(root, inputs.evidence, {
    outcome_id: "outcome-workflow",
    result: "failed",
    summary: "Implementation is not ready",
    sources: [{ type: "command", command: "npm test", exit_code: 1, stdout: "", stderr: "failed" }]
  });
  assert.equal(
    runCli(root, ["task", "evidence", "add", taskId, "--input", inputs.evidence], { ok: false, session }).error.code,
    "evidence_not_allowed"
  );

  assert.equal(runCli(root, ["task", "start", taskId], { session }).data.status, "in_progress");
  runCli(root, ["task", "review", taskId], { session });
  runCli(root, ["task", "evidence", "add", taskId, "--input", inputs.evidence], { session });
  assert.equal(runCli(root, ["task", "finish", taskId], { ok: false, session }).error.code, "required_evidence_incomplete");

  const nextRevision = runCli(root, ["task", "start", taskId], { session });
  assert.equal(nextRevision.data.implementation_revision, 2);
  runCli(root, ["task", "review", taskId], { session });
  const invalidated = runCli(root, ["task", "show", taskId], { session });
  assert.equal(invalidated.data.outcomes[0].status, "unproven");

  writeProjectJson(root, inputs.evidence, {
    outcome_id: "outcome-workflow",
    result: "proven",
    summary: "The workflow passed",
    sources: [{ type: "command", command: "npm test", exit_code: 0, stdout: "passed", stderr: "" }]
  });
  runCli(root, ["task", "evidence", "add", taskId, "--input", inputs.evidence], { session });
  assert.equal(runCli(root, ["task", "show", taskId], { session }).data.finish_ready, false);
  recordTaskDeliveryCommit(root, taskId, session);
  assert.equal(runCli(root, ["task", "show", taskId], { session }).data.finish_ready, true);
  assert.equal(runCli(root, ["task", "finish", taskId], { session }).data.status, "completed");

  const invalidArchive = runCli(
    root,
    [
      "task",
      "archive",
      taskId,
      "--summary",
      " ",
      "--knowledge",
      "none",
      "--knowledge-summary",
      "No reusable project knowledge"
    ],
    { ok: false, session }
  );
  assert.equal(invalidArchive.error.code, "journal_entry_invalid");
  assert.equal(fs.existsSync(path.join(root, ".opennori/tasks", taskId)), true);
  assert.equal(runCli(root, ["status"], { session }).data.current.task.id, taskId);

  const archived = runCli(
    root,
    [
      "task",
      "archive",
      taskId,
      "--summary",
      "Workflow completed",
      "--knowledge",
      "none",
      "--knowledge-summary",
      "No reusable project knowledge"
    ],
    { session }
  );
  assert.equal(fs.existsSync(archived.data.report), true);
  assert.match(archived.data.directory, /\/archive\//);
  assert.equal(archived.data.summary.title, "Approved task");
  assert.equal(archived.data.summary.goal, "Complete the requested workflow");
  assert.deepEqual(archived.data.summary.outcomes, [
    {
      id: "outcome-workflow",
      statement: "The requested workflow completes",
      status: "proven",
      evidence_summary: "The workflow passed",
      sources: ["command: npm test (exit 0)"]
    }
  ]);
  assert.deepEqual(archived.data.summary.knowledge, {
    decision: "none",
    summary: "No reusable project knowledge"
  });
  assert.equal(archived.data.summary.delivery.mode, "commit");
  assert.match(archived.data.summary.delivery.commit, /^[a-f0-9]{40,64}$/);
  assert.equal(runCli(root, ["status"], { session }).data.current, null);
  const journal = fs.readFileSync(archived.data.journal, "utf8");
  assert.equal(journal.split(`- Task: ${taskId}`).length - 1, 1);
  const archivedView = runCli(root, ["task", "show", taskId], { session }).data;
  assert.equal(archivedView.archived, true);
  assert.match(archivedView.delivery.commit, /^[a-f0-9]{40,64}$/);

  assert.equal(runCli(root, ["task", "delivery", "finalize", taskId], { ok: false, session }).error.code, "delivery_checkpoint_dirty");
  runGit(root, ["add", ".opennori"]);
  runGit(root, ["commit", "-m", `Finalize ${taskId}`]);
  const finalized = runCli(root, ["task", "delivery", "finalize", taskId], { session }).data;
  assert.equal(finalized.implementation_commit, archived.data.summary.delivery.commit);
  assert.equal(finalized.final_commit, runGit(root, ["rev-parse", "HEAD"]));

  const human = runCliHuman(
    root,
    [
      "task",
      "archive",
      taskId,
      "--summary",
      "Workflow completed",
      "--knowledge",
      "none",
      "--knowledge-summary",
      "No reusable project knowledge"
    ],
    { session }
  );
  assert.match(human, /Verified and archived: Approved task/);
  assert.match(human, /The requested workflow completes: verified - The workflow passed/);
  assert.match(human, /Project knowledge: none - No reusable project knowledge/);
  assert.doesNotMatch(human, /sha256|implementation_revision|\.opennori\/\.runtime/);
});

test("replanning archives the Contract, optional documents, contexts, and delivery", (t) => {
  const root = temporaryProject(t, "opennori-replan-");
  const session = "replan-session";
  initializeProject(root);
  const { taskId, inputs } = prepareApprovedTask(root, "replan", session);
  runCli(root, ["task", "start", taskId], { session });
  const directory = path.join(root, ".opennori/tasks", taskId);
  fs.writeFileSync(path.join(directory, "design.md"), "# Design\n\nCurrent technical design.\n");
  fs.writeFileSync(path.join(directory, "plan.md"), "# Plan\n\n- [ ] Implement the approved result.\n");

  runCli(root, ["task", "replan", taskId, "--reason", "The approved scope changed"], { session });
  for (const name of ["contract.json", "contract.md", "design.md", "plan.md", "implement.jsonl", "check.jsonl", "delivery.json"]) {
    assert.equal(fs.existsSync(path.join(directory, name)), false, `${name} should be invalidated`);
  }
  assert.equal(fs.readdirSync(path.join(directory, "research")).filter((name) => name.includes("replanned-")).length, 7);

  runCli(root, ["task", "unblock", taskId], { session });
  assert.equal(runCli(root, ["task", "start", taskId], { ok: false, session }).error.code, "contract_not_found");
  runCli(root, ["task", "contract", "write", taskId, "--input", inputs.contract], { session });
  runCli(
    root,
    ["task", "contract", "approve", taskId, "--approver", "Probe", "--confirmation", "replan-approval"],
    { session }
  );
  runCli(root, ["task", "delivery", "plan", taskId, "--mode", "commit"], { session });
  assert.equal(runCli(root, ["task", "start", taskId], { session }).data.status, "in_progress");
});
