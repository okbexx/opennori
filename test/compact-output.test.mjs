import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  initializeProject,
  prepareApprovedTask,
  recordTaskDeliveryCommit,
  runCli,
  runGit,
  taskInputPaths,
  temporaryProject,
  writeProjectJson
} from "./support/fixture.mjs";

test("summary status omits raw Evidence sources while preserving routing state", (t) => {
  const root = temporaryProject(t, "opennori-status-summary-");
  const session = "status-summary-session";
  initializeProject(root);
  const { taskId, inputs } = prepareApprovedTask(root, "status-summary", session);
  runCli(root, ["task", "start", taskId], { session });
  runCli(root, ["task", "review", taskId], { session });
  writeProjectJson(root, inputs.evidence, {
    outcome_id: "outcome-workflow",
    result: "proven",
    summary: "The compact status keeps this summary",
    sources: [
      {
        type: "command",
        command: "npm test",
        exit_code: 0,
        stdout: "raw-output-must-not-appear",
        stderr: ""
      }
    ]
  });
  runCli(root, ["task", "evidence", "add", taskId, "--input", inputs.evidence], { session });

  const full = runCli(root, ["status"], { session }).data;
  assert.match(JSON.stringify(full), /raw-output-must-not-appear/);
  const summary = runCli(root, ["status", "--summary"], { session }).data;
  assert.equal(summary.current.task.id, taskId);
  assert.equal(summary.current.phase, "verify");
  assert.equal(summary.current.outcomes[0].latest_evidence.summary, "The compact status keeps this summary");
  assert.equal("sources" in summary.current.outcomes[0].latest_evidence, false);
  assert.doesNotMatch(JSON.stringify(summary), /raw-output-must-not-appear|sha256|stdout|stderr/);
});

test("context load selects exact manifest files and omits whole files under an explicit budget", (t) => {
  const root = temporaryProject(t, "opennori-context-select-");
  const session = "context-select-session";
  initializeProject(root);
  const { taskId } = prepareApprovedTask(root, "context-select", session);

  const selected = runCli(
    root,
    ["task", "context", "load", taskId, "--mode", "implement", "--file", "source.txt"],
    { session }
  ).data;
  assert.equal(selected.entries.length, 1);
  assert.equal(selected.entries[0].file, "source.txt");
  assert.deepEqual(selected.omitted, []);

  const bounded = runCli(
    root,
    ["task", "context", "load", taskId, "--mode", "implement", "--max-bytes", "1"],
    { session }
  ).data;
  assert.deepEqual(bounded.entries, []);
  assert.equal(bounded.omitted.length, 1);
  assert.equal(bounded.omitted[0].file, "source.txt");
  assert.match(bounded.omitted[0].recovery, /--file source\.txt --json$/);

  assert.equal(
    runCli(
      root,
      ["task", "context", "load", taskId, "--mode", "implement", "--file", "not-registered.txt"],
      { ok: false, session }
    ).error.code,
    "context_file_not_registered"
  );
  assert.equal(
    runCli(
      root,
      [
        "task",
        "context",
        "load",
        taskId,
        "--mode",
        "implement",
        "--file",
        "source.txt",
        "--max-bytes",
        "1"
      ],
      { ok: false, session }
    ).error.code,
    "context_budget_too_small"
  );
});

test("Chinese tasks render Chinese reports and one archive-owned journal entry", (t) => {
  const root = temporaryProject(t, "opennori-chinese-report-");
  const session = "chinese-report-session";
  initializeProject(root, "Probe");
  const inputs = taskInputPaths(root, "outcome-chinese-report");
  runGit(root, ["add", "source.txt"]);
  runGit(root, ["commit", "-m", "Add Chinese report source"]);
  writeProjectJson(root, inputs.contract, {
    goal: "生成完整中文验收报告",
    outcomes: [
      {
        id: "outcome-chinese-report",
        statement: "用户看到中文报告和唯一日志记录",
        verification: "检查归档报告和开发者日志",
        required: true
      }
    ],
    assumptions: []
  });
  const created = runCli(
    root,
    ["task", "create", "--title", "中文报告任务", "--slug", "chinese-report"],
    { session }
  );
  const taskId = created.data.task.id;
  runCli(root, ["task", "contract", "write", taskId, "--input", inputs.contract], { session });
  runCli(
    root,
    ["task", "contract", "approve", taskId, "--approver", "Probe", "--confirmation", "chinese-report-approval"],
    { session }
  );
  for (const mode of ["implement", "check"]) {
    runCli(root, ["task", "context", "write", taskId, "--mode", mode, "--input", inputs.context], { session });
  }
  runCli(root, ["task", "delivery", "plan", taskId, "--mode", "commit"], { session });
  runCli(root, ["task", "start", taskId], { session });
  runCli(root, ["task", "review", taskId], { session });
  writeProjectJson(root, inputs.evidence, {
    outcome_id: "outcome-chinese-report",
    result: "proven",
    summary: "中文报告检查通过",
    sources: [{ type: "command", command: "npm test", exit_code: 0, stdout: "通过", stderr: "" }]
  });
  runCli(root, ["task", "evidence", "add", taskId, "--input", inputs.evidence], { session });
  recordTaskDeliveryCommit(root, taskId, session);
  runCli(root, ["task", "finish", taskId], { session });
  const archiveArgs = [
    "task",
    "archive",
    taskId,
    "--summary",
    "中文报告与日志已完成",
    "--knowledge",
    "none",
    "--knowledge-summary",
    "没有新增可复用项目知识"
  ];
  const archived = runCli(root, archiveArgs, { session }).data;
  runCli(root, archiveArgs, { session });

  const report = fs.readFileSync(archived.report, "utf8");
  assert.match(report, /任务: .*chinese-report/);
  assert.match(report, /生命周期状态: 已完成/);
  assert.match(report, /## 目标/);
  assert.match(report, /## Outcome 证据/);
  assert.match(report, /状态: 已证明/);
  assert.doesNotMatch(report, /Lifecycle status|Required Outcomes complete|Current gap|Sources:/);

  const journal = fs.readFileSync(archived.journal, "utf8");
  assert.equal(journal.split(`<!-- opennori-task:${taskId} -->`).length - 1, 1);
  assert.match(journal, new RegExp(`- 任务: ${taskId}`));
  assert.match(journal, /- 状态: 已完成/);
  assert.doesNotMatch(journal, new RegExp(`- Task: ${taskId}`));
});
