import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { tempRoot, writeActiveGoal, runEvaluateCommand, runResumeCommand, runChangesCommand, runContextExportCommand, runListCommand, runArchiveCommand, runReportCommand, buildArchitectureBaseline, renderAgentGuideMarkdown, writeArchitectureBaseline, writeArchitectureRequirement, addEvidence, buildEvidenceLedger, loadPair, goalPaths, writeGoalDossier } from "./support/command-fixtures.js";

test("list command module reports current goal gaps without CLI dispatch", { tags: ["cli", "reporting", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  writeActiveGoal(root);

  const list = await runListCommand(["--root", root, "--json"]);
  assert.equal(list.ok, true);
  assert.equal(list.data.active_goals.length, 1);
  assert.equal(list.data.active_goals[0].goal_id, "module-goal");
  assert.equal(list.data.active_goals[0].current_gap.id, "AC-1");
});

test("ready completed goals route Skills to prepare the next brief instead of CLI candidates", { tags: ["cli", "profile", "reporting", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Ship a reviewable user outcome",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can review the shipped outcome from the normal report entry.",
        measurement: "Open the report entry and review the outcome status.",
        threshold: "The report shows the expected result and lets me decide whether the outcome is acceptable."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  const reportPath = path.join(root, ".opennori", "reports", "module-goal.report.md");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, "# Module goal report\n\nComplete with reviewable evidence.\n");
  addEvidence(contract, ledger, "AC-1", {
    kind: "test-summary",
    summary: "AC-1 passes with a reviewable report source.",
    result: "passing",
    sources: [
      { type: "command", command: "opennori report --root . --json", label: "review command" },
      { type: "artifact", path: ".opennori/reports/module-goal.report.md", label: "review report" }
    ],
    reviewability: "Run the command and inspect the report artifact.",
    limitations: "This module test proves candidate drafting behavior, not an end-to-end user project."
  });
  const paths = goalPaths(root, "module-goal", "current");
  writeGoalDossier(paths.goalDir, contract, ledger);
  writeArchitectureRequirement(root, {
    goalId: contract.goal_id,
    status: "required",
    reason: "This command-module fixture verifies ready-for-next-loop routing with an active baseline."
  });
  writeArchitectureBaseline(root, buildArchitectureBaseline(root, {
    goal: contract.goal,
    goalId: contract.goal_id,
    accepted: true
  }));
  fs.writeFileSync(path.join(root, ".opennori", "agent-guide.md"), renderAgentGuideMarkdown());

  const resume = await runResumeCommand(["--root", root, "--json"], { loadPair: (args = {}) => loadPair({ root, ...args }) });
  assert.equal(resume.ok, true);
  assert.equal(resume.data.next_recommendation.status, "ready-for-next-loop");
  assert.equal(resume.data.agent_next.state, "ready_for_next_loop");
  assert.equal(resume.data.agent_next.candidate_goals, undefined);
  assert.equal(resume.data.next_recommendation.candidate_goals, undefined);
  assert.match(resume.data.agent_next.instruction, /prepare the next human-facing NoriBrief/);
  assert.match(resume.data.next_recommendation.actions.join("\n"), /opennori draft --brief/);
});

test("context export command module can write a review artifact", { tags: ["cli", "evidence", "reporting", "quick"] }, async () => {
  const root = tempRoot();
  writeActiveGoal(root);
  const outputPath = path.join(root, "context.json");

  const exported = await runContextExportCommand(["--root", root, "--output", outputPath, "--json"], { loadPair: (args = {}) => loadPair({ root, ...args }) });
  assert.equal(exported.ok, true);
  assert.equal(exported.data.goal_id, "module-goal");
  assert.equal(exported.data.output_path, outputPath);
  assert.equal(exported.artifacts[0].kind, "opennori_context_export");
  assert.equal(JSON.parse(fs.readFileSync(outputPath, "utf8")).goal_id, "module-goal");
});

test("archive command module moves complete goals and preserves a report", { tags: ["cli", "reporting", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Archive module goal",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can archive a complete goal.",
        measurement: "Run archive.",
        threshold: "I can see the archived artifacts."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", { kind: "test-summary", summary: "AC-1 passes.", result: "passing" });
  writeGoalDossier(paths.goalDir, contract, ledger);

  const archived = await runArchiveCommand(["--root", root, "--json"], {
    loadPair: () => ({ contract, ledger, goalDir: paths.goalDir, contractPath: paths.contractPath, ledgerPath: paths.ledgerPath, acceptancePath, evidencePath, root })
  });
  assert.equal(archived.ok, true);
  assert.equal(archived.data.archived_as, "completed");
  assert.equal(fs.existsSync(acceptancePath), false);
  assert.equal(fs.existsSync(evidencePath), false);
  assert.equal(fs.existsSync(archived.data.acceptance_path), true);
  assert.equal(fs.existsSync(archived.data.evidence_path), true);
  assert.equal(fs.existsSync(archived.data.report_path), true);
});

test("archive command module rejects current goals", { tags: ["cli", "reporting", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Do not archive current goal",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can keep current work in active state.",
        measurement: "Open status.",
        threshold: "I can see the remaining gap."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  writeGoalDossier(paths.goalDir, contract, ledger);

  const archived = await runArchiveCommand(["--root", root, "--json"], {
    loadPair: () => ({ contract, ledger, goalDir: paths.goalDir, contractPath: paths.contractPath, ledgerPath: paths.ledgerPath, acceptancePath, evidencePath, root })
  });
  assert.equal(archived.ok, false);
  assert.equal(archived.error.type, "not_archivable");
  assert.equal(fs.existsSync(acceptancePath), true);
  assert.equal(fs.existsSync(evidencePath), true);
});

test("evaluate command module recomputes and writes workflow state", { tags: ["cli", "reporting", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    goal_id: "module-goal",
    goal: "Ship module evaluation",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can evaluate a completed acceptance criterion."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", { kind: "test-summary", summary: "AC-1 passes.", result: "passing" });
  writeGoalDossier(paths.goalDir, contract, ledger);

  const evaluated = await runEvaluateCommand(["--json"], {
    loadPair: () => ({ contract, ledger, goalDir: paths.goalDir, contractPath: paths.contractPath, ledgerPath: paths.ledgerPath, acceptancePath, evidencePath, root })
  });
  assert.equal(evaluated.ok, true);
  assert.equal(evaluated.data.goal_id, "module-goal");
  assert.equal(evaluated.data.workflow_status, "complete");
  assert.equal(evaluated.data.current_gap, null);
  assert.equal(JSON.parse(fs.readFileSync(evidencePath, "utf8")).status, "complete");
  assert.match(fs.readFileSync(acceptancePath, "utf8"), /\| AC-1 .* passing \|/);
});

test("changes command module groups acceptance and implementation files", { tags: ["cli", "reporting", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  spawnSync("git", ["init"], { cwd: root, encoding: "utf8" });
  writeActiveGoal(root);
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "index.js"), "console.log('demo')\n");

  const changes = await runChangesCommand(["--root", root, "--json"]);
  assert.equal(changes.ok, true);
  assert.equal(changes.data.changed_files.available, true);
  assert.equal(changes.data.active_goals.length, 1);
  assert.equal(changes.data.changed_files.acceptance.some((item) => item.path === ".opennori/current/module-goal/README.md"), true);
  assert.equal(changes.data.changed_files.implementation.some((item) => item.path === "src/index.js"), true);
});

test("report command module renders a report artifact", { tags: ["cli", "evidence", "reporting", "quick"] }, async () => {
  const root = tempRoot();
  const outputPath = path.join(root, "report.md");
  const contract = {
    goal_id: "module-goal",
    goal: "Ship module reporting",
    criteria: [],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "complete", criteria: {} };

  const report = await runReportCommand(["--output", outputPath, "--json"], {
    loadPair: () => ({ contract, ledger, root })
  });
  assert.equal(report.ok, true);
  assert.equal(report.data.goal_id, "module-goal");
  assert.equal(report.data.report_path, outputPath);
  assert.equal(report.data.completion.complete, true);
  assert.equal(report.data.completion.objective_complete, true);
  assert.equal(report.data.completion.confidence, "review-risk");
  assert.equal(report.data.completion.review_risks.includes("architecture_requirement"), true);
  assert.equal(report.data.acceptance_review.status, "clear");
  assert.equal(report.data.evidence_health.status, "clear");
  assert.equal(report.data.architecture.decision, "missing");
  assert.equal(report.data.next_recommendation.status, "completion-review-required");
  assert.equal(report.data.agent_next.state, "completion_needs_review");
  assert.equal(report.data.agent_next.recommended_skill, "nori-reporting");
  assert.equal(report.artifacts[0].kind, "acceptance_report");
  assert.match(fs.readFileSync(outputPath, "utf8"), /## Decision Summary/);
});
