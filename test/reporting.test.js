import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { ROOT, CLI, run, tempRoot, writeBriefFile, draftArgsFromGoal, draftAndApprove, recordArchitectureRequirement, readGoalPayloadFromPaths } from "./support/cli.js";

test("evidence can drive the workflow to complete and render a human report", { tags: ["reporting"] }, () => {
  const root = tempRoot();
  const init = draftAndApprove([
    "--brief", writeBriefFile(root, "Ship report rendering", {
      goalId: "report-rendering",
      criteria: [
        {
          id: "AC-1",
          user_story: "As a user, I can review a completed OpenNori report.",
          measurement: "Run opennori report and inspect the decision summary.",
          threshold: "The report shows completion, current gap, intervention state, and evidence basis."
        },
        {
          id: "AC-2",
          user_story: "As a user, I can continue from a completed goal without generated candidate tasks.",
          measurement: "Run resume, next, and context export after completion.",
          threshold: "The outputs route the agent to prepare the next human-facing brief without candidate_goals."
        }
      ]
    }),
    "--root", root,
    "--json"
  ]);
  run(["install", "--root", root, "--json"]);
  const payload = readGoalPayloadFromPaths(init.data.acceptance_path, init.data.evidence_path);

  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--acceptance", init.data.acceptance_path,
      "--evidence", init.data.evidence_path,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has user-understandable evidence.`,
      "--result", "passing",
      "--source-command", "opennori status --root . --json",
      "--source-path", ".opennori/reports/opennori-self.report.md",
      "--reviewability", "Run status and inspect the report artifact.",
      "--limitations", "This is a test fixture for report rendering.",
      "--json"
    ]);
  }

  const evaluated = run([
    "evaluate",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--json"
  ]);
  assert.equal(evaluated.data.workflow_status, "complete");

  recordArchitectureRequirement(
    root,
    payload.contract.goal_id,
    "required",
    "This report rendering fixture verifies a confirmed architecture section."
  );
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", payload.contract.goal,
    "--goal-id", payload.contract.goal_id,
    "--confirm",
    "--json"
  ]);

  const report = run([
    "report",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--root", root,
    "--json"
  ]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.equal(report.data.workflow_status, "complete");
  assert.equal(report.data.current_gap, null);
  assert.equal(report.data.completion.complete, true);
  assert.equal(report.data.completion.confidence, "confident");
  assert.equal(report.data.completion.review_risks.length, 0);
  assert.equal(report.data.intervention.required, false);
  assert.equal(report.data.evidence_health.status, "clear");
  assert.ok(report.data.architecture);
  assert.equal(report.data.architecture.decision, "valid");
  assert.equal(report.data.agent_next.state, "ready_for_next_loop");
  assert.equal(report.data.agent_next.candidate_goals, undefined);
  assert.match(text, /## Decision Summary/);
  assert.ok(text.indexOf("## Decision Summary") < text.indexOf("## Acceptance Status"));
  assert.match(text, /Completion: Complete: all required acceptance criteria have passing or waived evidence\./);
  assert.match(text, /Current gap: None\. All required acceptance criteria/);
  assert.match(text, /User intervention: No user intervention is currently required\./);
  assert.match(text, /Recommended next action: This OpenNori goal is complete/);
  assert.doesNotMatch(text, /## Candidate Next Goals/);
  assert.doesNotMatch(text, /Draft command: opennori draft --from-next-candidate/);
  assert.match(text, /prepare the next human-facing NoriBrief/);
  assert.match(text, /Current status: complete/);
  assert.match(text, /AC-2/);
  assert.match(text, /None\. All required acceptance criteria/);
  assert.doesNotMatch(text, /Implementation plan/);

  const resume = run([
    "resume",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--json"
  ]);
  assert.equal(resume.data.next_recommendation.status, "ready-for-next-loop");
  assert.equal(resume.data.agent_next.state, "ready_for_next_loop");
  assert.equal(resume.data.agent_next.recommended_skill, "nori-acceptance");
  assert.equal(resume.data.agent_next.candidate_goals, undefined);
  assert.equal(resume.data.next_recommendation.candidate_goals, undefined);
  assert.match(resume.data.agent_next.instruction, /prepare the next human-facing NoriBrief/);
  assert.match(resume.data.next_recommendation.actions.join("\n"), /opennori draft --brief/);
  assert.equal(resume.data.evidence_health.status, "clear");
  assert.equal(resume.next_actions.some((action) => /candidate_goals/.test(action)), false);

  const next = run([
    "next",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--root", root,
    "--json"
  ]);
  assert.equal(next.data.next_recommendation.status, "ready-for-next-loop");
  assert.equal(next.data.next_recommendation.candidate_goals, undefined);

  const exported = run([
    "context", "export",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--root", root,
    "--json"
  ]);
  assert.equal(exported.data.next_recommendation.status, "ready-for-next-loop");
  assert.equal(exported.data.agent_next.state, "ready_for_next_loop");
  assert.equal(exported.data.agent_next.candidate_goals, undefined);
  assert.equal(exported.data.next_recommendation.candidate_goals, undefined);
});

test("report keeps long acceptance evidence readable outside the status table", { tags: ["reporting"] }, () => {
  const root = tempRoot();
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs", "report-proof.md"), "reviewable proof");
  const longSummary = [
    "项目工作台的项目列表、详情、状态、失败恢复、来源说明和复查入口已经通过代码审阅与命令验证。",
    "这条证据故意包含很长的中文说明，用来模拟真实产品报告里 agent 会写出的长证据摘要。",
    "报告渲染器必须保留这些信息，但不能再把它们压进 Markdown 表格行里。"
  ].join(" ");
  const approved = draftAndApprove([
    "--brief", writeBriefFile(root, "Readable long report", {
      language: "zh-CN",
      criteria: [
        {
          id: "AC-LONG-1",
          layer: "acceptance",
          user_story: "作为用户，我从项目工作台的项目列表进入某个项目后，能查看项目名称、路径、初始化状态、最近更新时间、当前选中状态和不可用项目的恢复提示，并能判断这个项目是否可以继续交给 agent 推进。",
          measurement: "打开项目工作台，选择一个已初始化项目、一个未初始化目录和一个不可访问目录，查看列表行、详情区和恢复提示。",
          threshold: "已初始化项目可以被选择并显示当前选中状态；未初始化和不可访问目录不会被当作可用项目；恢复提示、路径和最近更新时间清楚可见；报告中这条长 AC 的证据可读而不是表格长行。"
        }
      ]
    }),
    "--root", root,
    "--json"
  ]);

  run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-LONG-1",
    "--kind", "test-and-code-review",
    "--summary", longSummary,
    "--result", "passing",
    "--confidence", "verified",
    "--source-command", "pnpm --filter @agent-workbench/desktop test -- project-catalog.test.ts renderer-contract.test.ts",
    "--source-path", "docs/report-proof.md",
    "--source-url", "https://example.com/reviewable-long-report",
    "--reviewability", "重新运行列出的命令，打开 docs/report-proof.md，并审阅报告里的 AC-LONG-1 详情块；用户应能看到证据摘要、来源、可复查方式和限制说明都在普通列表里，而不是被塞进一个超长表格单元格。",
    "--limitations", "这个测试验证 OpenNori 报告的 Markdown 可读性和证据保留；它不证明外部 Agent Workbench 产品本身已经完成，也不替代真实 UI 截图或人工验收。",
    "--json"
  ]);

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(text, /## Acceptance Status/);
  assert.match(text, /## Acceptance Details/);
  assert.match(text, /### AC-LONG-1/);
  assert.match(text, /- Sources:/);
  assert.match(text, /pnpm --filter @agent-workbench\/desktop test/);
  assert.match(text, /docs\/report-proof\.md/);
  assert.match(text, /https:\/\/example\.com\/reviewable-long-report/);
  assert.match(text, /- Reviewability:/);
  assert.match(text, /- Limitations:/);
  assert.doesNotMatch(text, /\| ID \| Layer \| User acceptance criterion \| Status \| Confidence \| Evidence summary \| Basis \| Sources \| Reviewability \| Limitations \|/);
  assert.match(text, /\| ID \| Layer \| Status \| Confidence \| Evidence \| Basis \|/);
  const longLines = text
    .split("\n")
    .map((line, index) => ({ line, index: index + 1, length: line.length }))
    .filter((entry) => entry.length > 240);
  assert.deepEqual(longLines, []);
  assert.equal(approved.data.workflow_status, "active");
  assert.equal(report.data.workflow_status, "complete");
});

test("context export exposes goal AC profile evidence and report paths for review tools", { tags: ["reporting"] }, () => {
  const root = tempRoot();
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship a reviewable workflow"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture verifies context export with a confirmed architecture baseline."
  );
  run([
    "profile", "add",
    "--root", root,
    "--type", "constraint",
    "--name", "profile-stays-out-of-acs",
    "--strength", "prefer",
    "--purpose", "Keep implementation preferences outside user ACs.",
    "--json"
  ]);
  run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "test-summary",
    "--summary", "The user-visible operation is satisfied.",
    "--result", "passing",
    "--json"
  ]);
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship a reviewable workflow",
    "--goal-id", "ship-a-reviewable-workflow",
    "--confirm",
    "--json"
  ]);
  run(["report", "--root", root, "--json"]);

  const exported = run(["context", "export", "--root", root, "--json"]);
  assert.equal(exported.data.schema_version, "opennori/context-export-v1");
  assert.equal(exported.data.goal_id, "ship-a-reviewable-workflow");
  assert.equal(exported.data.criteria.some((criterion) => criterion.id === "AC-1" && criterion.latest_evidence.summary === "The user-visible operation is satisfied."), true);
  assert.equal(exported.data.capability_profile.items.some((item) => item.name === "profile-stays-out-of-acs"), true);
  assert.equal(exported.data.architecture.decision, "valid");
  assert.equal(exported.data.architecture.baseline.profile, "typescript-agent-state-cli");
  assert.equal(exported.data.agent_next.schema_version, "opennori/agent-next-v1");
  assert.equal(exported.data.agent_next.goal_id, "ship-a-reviewable-workflow");
  assert.equal(exported.data.paths.acceptance, ".opennori/current/ship-a-reviewable-workflow/README.md");
  assert.equal(exported.data.paths.report_exists, true);
  assert.equal(exported.data.manifest.capabilities.includes("context-export"), true);

  const output = path.join(root, ".opennori", "reports", "context.json");
  const written = run(["context", "export", "--root", root, "--output", output, "--json"]);
  assert.equal(written.data.output_path, output);
  assert.equal(fs.existsSync(output), true);
  assert.equal(JSON.parse(fs.readFileSync(output, "utf8")).schema_version, "opennori/context-export-v1");
});

test("changes groups acceptance artifacts separately from implementation files", { tags: ["reporting"] }, () => {
  const root = tempRoot();
  spawnSync("git", ["init"], { cwd: root, encoding: "utf8" });
  fs.mkdirSync(path.join(root, ".opennori", "current", "demo"), { recursive: true });
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, ".opennori", "current", "demo", "README.md"), "acceptance\n");
  fs.writeFileSync(path.join(root, "src", "index.js"), "console.log('demo')\n");

  const payload = run(["changes", "--root", root, "--json"]);
  assert.equal(payload.data.changed_files.available, true);
  assert.equal(payload.data.changed_files.acceptance.some((item) => item.path === ".opennori/current/demo/README.md"), true);
  assert.equal(payload.data.changed_files.implementation.some((item) => item.path === "src/index.js"), true);
});

test("list separates drafts from the single current goal", { tags: ["reporting"] }, () => {
  const root = tempRoot();
  const firstBrief = path.join(root, "first.json");
  const secondBrief = path.join(root, "second.json");
  const makeBrief = (goalId, goal) => ({
    goal_id: goalId,
    goal,
    criteria: [
      {
        id: "AC-P-1",
        user_story: `作为用户，我能查看 ${goalId} 的验收状态。`,
        measurement: "运行 opennori list 或 opennori resume。",
        threshold: "输出包含目标状态和当前缺口。"
      }
    ]
  });
  fs.writeFileSync(firstBrief, JSON.stringify(makeBrief("first-goal", "First goal")));
  fs.writeFileSync(secondBrief, JSON.stringify(makeBrief("second-goal", "Second goal")));

  draftAndApprove(["--brief", firstBrief, "--root", root, "--json"]);
  run(["draft", "--brief", secondBrief, "--root", root, "--json"]);

  const list = run(["list", "--root", root, "--json"]);
  assert.deepEqual(list.data.current_goals.map((goal) => goal.goal_id), ["first-goal"]);
  assert.deepEqual(list.data.draft_goals.map((goal) => goal.goal_id), ["second-goal"]);

  const resume = run(["resume", "--root", root, "--json"]);
  assert.equal(resume.data.goal_id, "first-goal");
  assert.equal(resume.data.current_gap.id, "AC-P-1");

  const draftResume = spawnSync(process.execPath, [CLI, "resume", "--root", root, "--goal", "second-goal", "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(draftResume.status, 1);
  const draftResumePayload = JSON.parse(draftResume.stdout);
  assert.equal(draftResumePayload.ok, false);
  assert.equal(draftResumePayload.error.type, "no_current_goal");
  assert.match(draftResumePayload.error.message, /No current OpenNori goal found/);
});

test("archive moves complete goals out of current and preserves report", { tags: ["reporting"] }, () => {
  const root = tempRoot();
  const init = draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);
  const payload = readGoalPayloadFromPaths(init.data.acceptance_path, init.data.evidence_path);

  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--acceptance", init.data.acceptance_path,
      "--evidence", init.data.evidence_path,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has user-understandable evidence.`,
      "--result", "passing",
      "--json"
    ]);
  }

  const archived = run(["archive", "--root", root, "--goal", "opennori-self", "--json"]);
  assert.equal(archived.data.archived_as, "completed");
  assert.equal(fs.existsSync(init.data.acceptance_path), false);
  assert.equal(fs.existsSync(init.data.evidence_path), false);
  assert.equal(fs.existsSync(archived.data.acceptance_path), true);
  assert.equal(fs.existsSync(archived.data.evidence_path), true);
  assert.equal(fs.existsSync(archived.data.report_path), true);

  const list = run(["list", "--root", root, "--json"]);
  assert.equal(list.data.current_goals.length, 0);
});

test("archive can preserve blocked goals outside current work", { tags: ["reporting"] }, () => {
  const root = tempRoot();
  const init = draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);

  run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-O-5",
    "--kind", "human-confirmation",
    "--summary", "User must choose whether to pause or continue.",
    "--result", "blocked",
    "--json"
  ]);

  const archived = run(["archive", "--root", root, "--goal", "opennori-self", "--json"]);
  assert.equal(archived.data.archived_as, "blocked");
  assert.equal(fs.existsSync(init.data.acceptance_path), false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "blocked", "opennori-self", "README.md")), true);

  const report = fs.readFileSync(archived.data.report_path, "utf8");
  assert.ok(report.indexOf("## Decision Summary") < report.indexOf("## Acceptance Status"));
  assert.match(report, /Completion: Not complete: AC-O-5 is blocked/);
  assert.match(report, /User intervention: AC-O-5 - User must choose whether to pause or continue/);
  assert.match(report, /Current status: blocked/);
  assert.match(report, /User must choose whether to pause or continue/);
});
