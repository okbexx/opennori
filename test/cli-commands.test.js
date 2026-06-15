import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { runApproveCommand, runBrainstormCommand, runCriterionAddCommand, runCriterionUpdateCommand, runDiscoverCommand, runDraftCommand, runEvaluateCommand, runInitCommand, runNextCommand, runResumeCommand, runStatusCommand } from "../src/cli/commands/acceptance.ts";
import { runArchitectureApplyCommand, runArchitectureBaselineCommand, runArchitectureBuildVsBuyCommand, runArchitectureChallengeCommand, runArchitectureProfileCommand, runArchitectureProfilesCommand } from "../src/cli/commands/architecture.ts";
import { runCheckCommand } from "../src/cli/commands/check.ts";
import { runChangesCommand } from "../src/cli/commands/changes.ts";
import { runContextExportCommand } from "../src/cli/commands/context.ts";
import { runDoctorCommand } from "../src/cli/commands/doctor.ts";
import { runEvidenceAddCommand, runEvidencePruneCommand } from "../src/cli/commands/evidence.ts";
import { runBootstrapCommand } from "../src/cli/commands/bootstrap.ts";
import { runInstallCommand } from "../src/cli/commands/install.ts";
import { runListCommand } from "../src/cli/commands/list.ts";
import { runProfileAddCommand, runProfileEvidenceCommand, runProfileShowCommand } from "../src/cli/commands/profile.ts";
import { runArchiveCommand, runReportCommand } from "../src/cli/commands/reporting.ts";
import { runSetupCommand } from "../src/cli/commands/setup.ts";
import { runSetup } from "../src/cli/setup.ts";
import { runUninstallCommand } from "../src/cli/commands/uninstall.ts";
import { runUpgradeCommand } from "../src/cli/commands/upgrade.ts";
import { buildArchitectureBaseline, renderAgentGuideMarkdown, writeArchitectureBaseline } from "../src/architecture.ts";
import { loadPair } from "../src/cli/runtime.ts";
import { addEvidence, buildEvidenceLedger, writeJson } from "../src/core.ts";

const ROOT = path.resolve(import.meta.dirname, "..");

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "nori-command-test-"));
}

function writeActiveGoal(root) {
  const contract = {
    schema_version: "opennori/contract-v1",
    goal_id: "module-goal",
    goal: "Ship module command coverage",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can inspect active goal gaps.",
        measurement: "Run list command module.",
        threshold: "Output includes the current gap."
      }
    ]
  };
  const ledger = buildEvidenceLedger(contract);
  const paths = path.join(root, ".opennori", "active");
  fs.mkdirSync(paths, { recursive: true });
  fs.writeFileSync(path.join(paths, "module-goal.acceptance.md"), "# Module goal\n");
  writeJson(path.join(paths, "module-goal.evidence.json"), { contract, ledger });
}

function packageVersion() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
}

function setupRunner({ marketplace = false, plugin = false, pluginVersion = packageVersion(), globalVersion = null, failCommand = "" } = {}) {
  const calls = [];
  const runner = (command, args) => {
    calls.push([command, ...args]);
    const display = [command, ...args].join(" ");
    if (failCommand && display.includes(failCommand)) {
      return { status: 1, stdout: "", stderr: `failed ${display}` };
    }
    if (display === "codex plugin marketplace list") {
      return {
        status: 0,
        stdout: marketplace ? "MARKETPLACE ROOT\nopennori /tmp/opennori\n" : "MARKETPLACE ROOT\n",
        stderr: ""
      };
    }
    if (display === "codex plugin list") {
      return {
        status: 0,
        stdout: plugin ? `PLUGIN STATUS VERSION PATH\nopennori@opennori installed, enabled ${pluginVersion} /tmp/opennori\n` : "PLUGIN STATUS VERSION PATH\n",
        stderr: ""
      };
    }
    if (display === "npm ls -g opennori --depth=0 --json") {
      return {
        status: globalVersion ? 0 : 1,
        stdout: JSON.stringify(globalVersion ? { dependencies: { opennori: { version: globalVersion } } } : {}),
        stderr: ""
      };
    }
    return { status: 0, stdout: `ok ${display}`, stderr: "" };
  };
  return { calls, runner };
}

test("citty command modules preserve agent-readable JSON payloads", async () => {
  const profiles = await runArchitectureProfilesCommand(["--root", ROOT, "--json"]);
  assert.equal(profiles.ok, true);
  assert.equal(profiles.data.side_effect, "none");
  assert.equal(profiles.data.profiles.some((profile) => profile.id === "typescript-agent-state-cli"), true);

  const doctor = await runDoctorCommand(["--root", ROOT, "--json"]);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.data.name, "opennori");
  assert.equal(doctor.data.side_effect, "none");
  assert.equal(doctor.data.agent_next.schema_version, "opennori/agent-next-v1");
});

test("doctor routes fresh projects to init preview instead of repeated recovery actions", async () => {
  const root = tempRoot();
  const doctor = await runDoctorCommand(["--root", root, "--json"]);

  assert.equal(doctor.ok, true);
  assert.equal(doctor.data.status, "needs-action");
  assert.equal(doctor.data.agent_next.state, "health_needs_recovery");
  assert.equal(doctor.data.agent_next.recommended_skill, "nori-project-health");
  assert.equal(doctor.data.agent_next.safe_next_command, `opennori init --root ${root} --json`);
  assert.match(doctor.data.agent_next.instruction, /Run the init preview/);
});

test("bootstrap command module previews before confirmed setup", async () => {
  const root = tempRoot();
  const preview = await runBootstrapCommand(["--root", root, "--json"]);
  assert.equal(preview.ok, true);
  assert.equal(preview.data.status, "needs_confirm");
  assert.equal(preview.data.confirmed, false);
  assert.equal(preview.data.agent_next.state, "setup_preview_needs_confirmation");
  assert.equal(preview.data.agent_next.recommended_skill, "nori-project-health");
  assert.equal(preview.data.install_plan.dry_run, true);
  assert.equal(preview.data.install_plan.summary.will_write, 0);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);

  const confirmed = await runBootstrapCommand(["--root", root, "--confirm", "--json"]);
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.data.status, "installed");
  assert.equal(confirmed.data.confirmed, true);
  assert.equal(confirmed.data.agent_next.state, "initialized_no_active_contract");
  assert.equal(confirmed.data.agent_next.recommended_skill, "nori-acceptance");
  assert.equal(confirmed.data.install_plan.dry_run, false);
  assert.equal(confirmed.data.install_plan.summary.will_write > 0, true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
});

test("setup command previews one complete capability bundle without writing", async () => {
  const root = tempRoot();
  const { calls, runner } = setupRunner();
  const preview = await runSetupCommand(["--root", root, "--json"], { runner });

  assert.equal(preview.ok, true);
  assert.equal(preview.data.status, "needs_confirm");
  assert.equal(preview.data.setup_plan.schema_version, "opennori/setup-plan-v1");
  assert.equal(preview.data.setup_plan.dry_run, true);
  assert.equal(preview.data.setup_plan.summary.will_write, 0);
  assert.equal(preview.data.setup_plan.actions.some((action) => action.command_display === "codex plugin marketplace add okbexx/opennori --ref main"), true);
  assert.equal(preview.data.setup_plan.actions.some((action) => action.command_display === "codex plugin add opennori@opennori"), true);
  assert.equal(preview.data.setup_plan.actions.some((action) => action.id === "packaged_skills" && action.action === "exists"), true);
  assert.equal(preview.data.setup_plan.actions.some((action) => /^npm install -g opennori@.* --min-release-age=0$/.test(action.command_display)), true);
  assert.equal(preview.data.setup_plan.actions.some((action) => action.command_display === "opennori init"), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);
  assert.equal(calls.some((call) => call.join(" ") === "codex plugin marketplace add okbexx/opennori --ref main"), false);
});

test("setup command confirm applies external commands through official CLIs and initializes project state", async () => {
  const root = tempRoot();
  const { calls, runner } = setupRunner();
  const confirmed = await runSetupCommand(["--root", root, "--confirm", "--json"], { runner });

  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.data.confirmed, true);
  assert.equal(calls.some((call) => call.join(" ") === "codex plugin marketplace add okbexx/opennori --ref main"), true);
  assert.equal(calls.some((call) => call.join(" ") === "codex plugin add opennori@opennori"), true);
  assert.equal(calls.some((call) => /^npm install -g opennori@.* --min-release-age=0$/.test(call.join(" "))), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
});

test("setup command does not rerun already installed bundle parts", async () => {
  const root = tempRoot();
  const { calls, runner } = setupRunner({
    marketplace: true,
    plugin: true,
    globalVersion: packageVersion()
  });
  const confirmed = await runSetupCommand(["--root", root, "--confirm", "--json"], { runner });

  assert.equal(confirmed.ok, true);
  assert.equal(calls.some((call) => call.join(" ") === "codex plugin marketplace add okbexx/opennori --ref main"), false);
  assert.equal(calls.some((call) => call.join(" ") === "codex plugin add opennori@opennori"), false);
  assert.equal(calls.some((call) => /^npm install -g opennori@/.test(call.join(" "))), false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);
});

test("setup command upgrades stale installed Codex Plugin versions", async () => {
  const root = tempRoot();
  const { calls, runner } = setupRunner({
    marketplace: true,
    plugin: true,
    pluginVersion: "0.1.8",
    globalVersion: packageVersion()
  });
  const preview = await runSetupCommand(["--root", root, "--json"], { runner });
  const pluginAction = preview.data.setup_plan.actions.find((action) => action.id === "codex_plugin");

  assert.equal(pluginAction.action, "will-run");
  assert.match(pluginAction.reason, /Upgrade the OpenNori Codex Plugin from 0\.1\.8/);

  const confirmed = await runSetupCommand(["--root", root, "--confirm", "--json"], { runner });

  assert.equal(confirmed.ok, true);
  assert.equal(calls.some((call) => call.join(" ") === "codex plugin add opennori@opennori"), true);
});

test("interactive setup reports underlying setup failure instead of throwing on missing data", async () => {
  const root = tempRoot();
  const { runner } = setupRunner({
    failCommand: "npm install -g opennori"
  });
  let output = "";
  const stdout = {
    isTTY: true,
    write(chunk) {
      output += String(chunk);
      return true;
    }
  };
  const stdin = {
    isTTY: true,
    setEncoding() {},
    once(_event, callback) {
      callback("y\n");
    },
    pause() {}
  };

  await runSetup(["setup", "--root", root], { stdin, stdout, runner });

  assert.match(output, /OpenNori setup failed/);
  assert.match(output, /OpenNori setup failed while running npm install -g opennori@/);
  assert.match(output, /failed npm install -g opennori@/);
});

test("install command module preserves preview and confirm safety", async () => {
  const root = tempRoot();
  const dryRun = await runInstallCommand(["--root", root, "--dry-run", "--json"]);
  assert.equal(dryRun.ok, true);
  assert.equal(dryRun.data.dry_run, true);
  assert.equal(dryRun.data.install_plan.dry_run, true);
  assert.equal(dryRun.data.install_plan.summary.will_write, 0);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), false);

  const installed = await runInstallCommand(["--root", root, "--json"]);
  assert.equal(installed.ok, true);
  assert.equal(installed.data.confirmed, false);
  assert.equal(installed.data.install_plan.summary.will_write > 0, true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);

  const unconfirmed = await runInstallCommand(["--root", root, "--force", "--json"]);
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error.type, "confirm_required");
  assert.match(unconfirmed.error.fix, /--dry-run --force --json/);
});

test("uninstall command module preserves state unless include-state is confirmed", async () => {
  const root = tempRoot();
  await runInstallCommand(["--root", root, "--json"]);

  const dryRun = await runUninstallCommand(["--root", root, "--dry-run", "--json"]);
  assert.equal(dryRun.ok, true);
  assert.equal(dryRun.data.uninstall_plan.summary.will_write, 0);
  assert.equal(dryRun.data.uninstall_plan.actions.find((action) => action.path === ".opennori/active").action, "preserve");
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);

  const unconfirmed = await runUninstallCommand(["--root", root, "--json"]);
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error.type, "confirm_required");

  const removed = await runUninstallCommand(["--root", root, "--confirm", "--json"]);
  assert.equal(removed.ok, true);
  assert.equal(removed.data.include_state, false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "active")), true);

  const stateRemovedRoot = tempRoot();
  await runInstallCommand(["--root", stateRemovedRoot, "--json"]);
  const stateRemoved = await runUninstallCommand(["--root", stateRemovedRoot, "--include-state", "--confirm", "--json"]);
  assert.equal(stateRemoved.data.include_state, true);
  assert.equal(fs.existsSync(path.join(stateRemovedRoot, ".opennori")), false);
});

test("upgrade command module preserves preview and install-required safety", async () => {
  const root = tempRoot();
  await runInstallCommand(["--root", root, "--json"]);
  fs.writeFileSync(path.join(root, ".opennori", "protocol.md"), "old protocol\n");

  const dryRun = await runUpgradeCommand(["--root", root, "--dry-run", "--json"]);
  assert.equal(dryRun.ok, true);
  assert.equal(dryRun.data.upgrade_plan.schema_version, "opennori/upgrade-plan-v1");
  assert.equal(dryRun.data.upgrade_plan.summary.will_write, 0);
  assert.equal(dryRun.data.upgrade_plan.actions.find((action) => action.path === ".opennori/protocol.md").action, "overwrite");
  assert.equal(fs.readFileSync(path.join(root, ".opennori", "protocol.md"), "utf8"), "old protocol\n");

  const unconfirmed = await runUpgradeCommand(["--root", root, "--json"]);
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error.type, "confirm_required");

  const upgraded = await runUpgradeCommand(["--root", root, "--confirm", "--json"]);
  assert.equal(upgraded.ok, true);
  assert.equal(upgraded.data.confirmed, true);
  assert.match(fs.readFileSync(path.join(root, ".opennori", "protocol.md"), "utf8"), /OpenNori Protocol/);
  assert.equal(upgraded.next_actions.some((action) => /opennori check/.test(action)), true);

  const missing = await runUpgradeCommand(["--root", tempRoot(), "--confirm", "--json"]);
  assert.equal(missing.ok, false);
  assert.equal(missing.error.type, "install_required");
});

test("list command module reports active goal gaps without CLI dispatch", async () => {
  const root = tempRoot();
  writeActiveGoal(root);

  const list = await runListCommand(["--root", root, "--json"]);
  assert.equal(list.ok, true);
  assert.equal(list.data.active_goals.length, 1);
  assert.equal(list.data.active_goals[0].goal_id, "module-goal");
  assert.equal(list.data.active_goals[0].current_gap.id, "ACCEPTANCE-BASIS");
});

test("brainstorm command module creates selectable directions without a contract", async () => {
  const root = tempRoot();
  const brainstorm = await runBrainstormCommand([
    "--root", root,
    "--idea", "我想让 OpenNori 支持头脑风暴",
    "--json"
  ]);

  assert.equal(brainstorm.ok, true);
  assert.equal(brainstorm.data.status, "draft-source");
  assert.equal(brainstorm.data.is_acceptance_contract, false);
  assert.equal(brainstorm.data.candidates.length, 3);
  assert.equal(fs.existsSync(brainstorm.data.brainstorm_path), true);
  assert.equal(fs.existsSync(brainstorm.data.markdown_path), true);
  assert.equal(brainstorm.artifacts.some((artifact) => artifact.kind === "brainstorm_source"), true);
  assert.match(fs.readFileSync(brainstorm.data.markdown_path, "utf8"), /not a Nori Contract/);
});

test("discover command module finds acceptance gaps without creating an active goal", async () => {
  const root = tempRoot();
  const discovery = await runDiscoverCommand([
    "--root", root,
    "--goal", "做一个设置页，用户可以修改个人资料，保存后刷新仍然生效，失败时有提示。",
    "--json"
  ]);

  assert.equal(discovery.ok, true);
  assert.equal(discovery.data.status, "needs-user-answers");
  assert.equal(discovery.data.is_acceptance_contract, false);
  assert.equal(fs.existsSync(discovery.data.discovery_path), true);
  assert.equal(fs.existsSync(discovery.data.markdown_path), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "active")), false);
  const gapIds = discovery.data.gaps.map((gap) => gap.id);
  assert.equal(gapIds.includes("missing-user-entry"), true);
  assert.equal(gapIds.includes("missing-field-scope"), true);
  assert.equal(gapIds.includes("missing-validation-rule"), true);
  assert.equal(gapIds.includes("missing-success-signal"), true);
  assert.equal(gapIds.includes("missing-failure-case"), true);
  assert.equal(gapIds.includes("missing-out-of-scope-boundary"), true);
  assert.equal(gapIds.includes("missing-review-method"), true);
  assert.equal(gapIds.includes("missing-persistence-scope"), false);
  assert.equal(discovery.artifacts.some((artifact) => artifact.kind === "acceptance_discovery"), true);
  assert.match(fs.readFileSync(discovery.data.markdown_path, "utf8"), /not a Nori Contract/);
});

test("draft command module creates concrete contracts from discovery answers", async () => {
  const root = tempRoot();
  const discovery = await runDiscoverCommand([
    "--root", root,
    "--goal", "Ship a settings page where users edit profile details",
    "--id", "module-settings-profile",
    "--json"
  ]);
  const answersPath = path.join(root, "answers.json");
  writeJson(answersPath, {
    "missing-user-entry": "用户从顶部导航打开 Account Settings，再进入 Profile 标签页查看结果。",
    "missing-field-scope": "本轮可编辑昵称、头像和简介；邮箱、手机号和密码不在范围内。",
    "missing-validation-rule": "昵称必填且 2-30 个字符；简介最多 160 个字符；头像只允许 PNG/JPEG 且不超过 2MB。",
    "missing-success-signal": "保存成功后显示成功提示，并在 Profile 标签页立即看到更新后的昵称、头像和简介。",
    "missing-persistence-scope": "刷新页面、关闭后重新打开项目时，昵称、头像和简介仍然保持保存后的值。",
    "missing-failure-case": "网络失败时显示网络错误提示，保留表单中的用户输入，不覆盖旧资料。",
    "missing-out-of-scope-boundary": "本轮不支持修改邮箱、手机号、密码、通知偏好或隐私设置。",
    "missing-review-method": "评审者用浏览器打开设置页，执行成功保存、刷新持久化和网络失败场景，并保存截图或报告作为证据。"
  });

  const draft = await runDraftCommand([
    "--root", root,
    "--from-discovery", discovery.data.discovery_id,
    "--answers", answersPath,
    "--goal-id", "module-settings-contract",
    "--json"
  ]);

  assert.equal(draft.ok, true);
  assert.equal(draft.data.goal_id, "module-settings-contract");
  assert.equal(draft.data.acceptance_basis.status, "draft");
  assert.match(draft.data.acceptance_basis.summary, /Discovery answers/);
  assert.equal(draft.data.criteria.length, 6);
  assert.equal(draft.data.criteria.some((criterion) => /Account Settings/.test(criterion.user_story)), true);
  assert.equal(draft.data.criteria.some((criterion) => /2-30 个字符/.test(`${criterion.user_story} ${criterion.measurement}`)), true);
  assert.equal(draft.data.current_gap.id, "ACCEPTANCE-BASIS");
});

test("draft command module creates active Nori Contracts from goals and brainstorm candidates", async () => {
  const root = tempRoot();
  const draft = await runDraftCommand([
    "--root", root,
    "--goal", "Ship an OpenNori-backed task",
    "--goal-id", "module-goal",
    "--json"
  ]);
  assert.equal(draft.ok, true);
  assert.equal(draft.data.goal_id, "module-goal");
  assert.equal(draft.data.acceptance_basis.status, "draft");
  assert.match(draft.data.acceptance_basis.summary, /generic acceptance discovery/);
  assert.equal(draft.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(fs.existsSync(draft.data.acceptance_path), true);
  assert.equal(fs.existsSync(draft.data.evidence_path), true);
  assert.equal(draft.artifacts.some((artifact) => artifact.kind === "draft_acceptance_contract"), true);

  const brainstorm = await runBrainstormCommand([
    "--root", root,
    "--idea", "我想让 OpenNori 支持头脑风暴",
    "--id", "module-brainstorm",
    "--json"
  ]);
  const fromBrainstorm = await runDraftCommand([
    "--root", root,
    "--from-brainstorm", brainstorm.data.brainstorm_id,
    "--candidate", "A",
    "--json"
  ]);
  assert.equal(fromBrainstorm.ok, true);
  assert.equal(fromBrainstorm.data.acceptance_basis.status, "draft");
  assert.equal(fromBrainstorm.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(fromBrainstorm.data.criteria.every((criterion) => criterion.user_story.startsWith("作为用户")), true);
});

test("draft command module creates draft contracts from completed goal candidates", async () => {
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
  const activeDir = path.join(root, ".opennori", "active");
  fs.mkdirSync(activeDir, { recursive: true });
  writeJson(path.join(activeDir, "module-goal.evidence.json"), { contract, ledger });
  fs.writeFileSync(path.join(activeDir, "module-goal.acceptance.md"), "# Module goal\n");
  writeArchitectureBaseline(root, buildArchitectureBaseline(root, {
    goal: contract.goal,
    goalId: contract.goal_id,
    accepted: true
  }));
  fs.writeFileSync(path.join(root, ".opennori", "agent-guide.md"), renderAgentGuideMarkdown());

  const drafted = await runDraftCommand([
    "--root", root,
    "--source-goal", "module-goal",
    "--from-next-candidate", "real-user-validation",
    "--goal-id", "candidate-module-goal",
    "--json"
  ]);

  assert.equal(drafted.ok, true);
  assert.equal(drafted.data.goal_id, "candidate-module-goal");
  assert.equal(drafted.data.acceptance_basis.status, "draft");
  assert.equal(drafted.data.acceptance_basis.source_goal_id, "module-goal");
  assert.equal(drafted.data.acceptance_basis.candidate_id, "real-user-validation");
  assert.match(drafted.data.acceptance_basis.summary, /completed goal candidate/);
  assert.match(drafted.data.acceptance_basis.rule, /not approved acceptance criteria/);
  assert.equal(drafted.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(drafted.data.criteria.every((criterion) => /^As a user/.test(criterion.user_story)), true);

  const notReady = await runDraftCommand([
    "--root", root,
    "--source-goal", "candidate-module-goal",
    "--from-next-candidate", "real-user-validation",
    "--json"
  ]);
  assert.equal(notReady.ok, false);
  assert.equal(notReady.error.type, "next_candidate_unavailable");

  const missing = await runDraftCommand([
    "--root", root,
    "--source-goal", "module-goal",
    "--from-next-candidate", "missing-candidate",
    "--json"
  ]);
  assert.equal(missing.ok, false);
  assert.equal(missing.error.type, "next_candidate_not_found");
});

test("init command module initializes project state with preview safety", async () => {
  const root = tempRoot();
  const preview = await runInitCommand(["--root", root, "--json"]);
  assert.equal(preview.ok, true);
  assert.equal(preview.data.status, "needs_confirm");
  assert.equal(preview.data.agent_next.state, "setup_preview_needs_confirmation");
  assert.equal(preview.data.agent_next.needs_user, true);
  assert.equal(preview.data.install_plan.summary.will_write, 0);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);

  const initialized = await runInitCommand(["--root", root, "--confirm", "--json"]);
  assert.equal(initialized.ok, true);
  assert.equal(initialized.data.status, "installed");
  assert.equal(initialized.data.agent_next.state, "initialized_no_active_contract");
  assert.equal(initialized.data.agent_next.recommended_skill, "nori-acceptance");
  assert.match(initialized.data.agent_next.instruction, /already stated natural-language goal/);
  assert.match(initialized.data.agent_next.user_visible_next, /stated goal/);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);

  const doctor = await runDoctorCommand(["--root", root, "--json"]);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.data.status, "ready");
  assert.equal(doctor.data.active_goals.length, 0);
  assert.equal(doctor.data.agent_next.state, "initialized_no_active_contract");
  assert.match(doctor.data.agent_next.instruction, /already stated goal/);
});

test("draft command module creates active Nori Contracts from brief files", async () => {
  const root = tempRoot();
  const briefPath = path.join(root, "brief.json");
  writeJson(briefPath, {
    goal_id: "module-brief-goal",
    goal: "Ship a brief-backed OpenNori task",
    criteria: [
      {
        id: "AC-BRIEF",
        user_story: "作为用户，我能查看 brief 生成的验收目标。",
        measurement: "用户运行 status 并查看当前缺口。",
        threshold: "输出显示 AC-BRIEF 或验收审批缺口。"
      }
    ]
  });

  const drafted = await runDraftCommand(["--brief", briefPath, "--root", root, "--json"]);
  assert.equal(drafted.ok, true);
  assert.equal(drafted.data.goal_id, "module-brief-goal");
  assert.equal(drafted.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(fs.existsSync(drafted.data.acceptance_path), true);
  assert.equal(fs.existsSync(drafted.data.evidence_path), true);
  assert.equal(drafted.artifacts.some((artifact) => artifact.kind === "draft_acceptance_contract"), true);
});

test("check command module reports acceptance architecture and evidence health", async () => {
  const root = tempRoot();
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Check module health",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can check the goal health.",
        measurement: "Open status.",
        threshold: "I can see health warnings."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);

  const checked = await runCheckCommand(["--json"], {
    loadPair: () => ({ contract, ledger, root })
  });
  assert.equal(checked.ok, true);
  assert.equal(checked.data.goal_id, "module-goal");
  assert.equal(checked.data.acceptance_review.status, "clear");
  assert.equal(checked.data.architecture_check.status, "needs-action");
  assert.equal(checked.data.architecture_check.decision, "missing");
  assert.equal(checked.data.evidence_health.status, "clear");
  assert.equal(checked.warnings.some((warning) => warning.type === "architecture"), true);
  assert.equal(checked.next_actions.some((action) => /architecture_check/.test(action)), true);
});

test("architecture build-vs-buy command module records reviewable decisions", async () => {
  const root = tempRoot();

  const decision = await runArchitectureBuildVsBuyCommand([
    "--root", root,
    "--id", "module-parser-choice",
    "--area", "cli",
    "--need", "Parse OpenNori subcommands",
    "--recommendation", "self-build",
    "--summary", "Use citty command modules and keep repeated-source parsing as narrow command-local glue.",
    "--current-project", "Current project uses src/cli/command-tree.ts and src/cli/commands/** citty modules.",
    "--standard-library", "Node exposes argv tokens but not a full nested command definition model.",
    "--official-sdk", "No official SDK applies.",
    "--json"
  ]);

  assert.equal(decision.ok, true);
  assert.equal(decision.data.decision.schema_version, "opennori/build-vs-buy-v1");
  assert.equal(decision.data.decision.id, "module-parser-choice");
  assert.equal(decision.data.decision.recommendation, "self-build");
  assert.equal(decision.data.decision.current_project, "Current project uses src/cli/command-tree.ts and src/cli/commands/** citty modules.");
  assert.equal(decision.data.decision.standard_library, "Node exposes argv tokens but not a full nested command definition model.");
  assert.equal(decision.data.decision.official_sdk, "No official SDK applies.");
  assert.equal(decision.data.decision_path, path.join(root, ".opennori", "architecture", "decisions", "module-parser-choice.json"));
  assert.equal(fs.existsSync(decision.data.decision_path), true);
  assert.equal(fs.existsSync(decision.data.markdown_path), true);
  assert.equal(decision.artifacts.some((artifact) => artifact.kind === "build_vs_buy_decision"), true);
  assert.equal(decision.warnings.some((warning) => warning.type === "build_vs_buy"), true);
  assert.match(fs.readFileSync(decision.data.markdown_path, "utf8"), /Build-vs-Buy Decision/);
});

test("architecture challenge command module records baseline challenges", async () => {
  const root = tempRoot();
  writeArchitectureBaseline(root, buildArchitectureBaseline(root, {
    goal: "Keep architecture reviewable",
    goalId: "module-goal",
    accepted: true
  }));

  const challenge = await runArchitectureChallengeCommand([
    "--root", root,
    "--id", "module-challenge",
    "--summary", "Current project already uses another CLI parser.",
    "--evidence", "package.json contains a parser dependency.",
    "--recommendation", "Ask the user whether to revise the baseline.",
    "--no-user",
    "--json"
  ]);

  assert.equal(challenge.ok, true);
  assert.equal(challenge.data.challenge.schema_version, "opennori/architecture-challenge-v1");
  assert.equal(challenge.data.challenge.id, "module-challenge");
  assert.equal(challenge.data.challenge.needs_user, false);
  assert.equal(challenge.data.challenge.baseline.goal_id, "module-goal");
  assert.equal(challenge.data.architecture.decision, "challenged");
  assert.equal(challenge.data.challenge_path, path.join(root, ".opennori", "architecture", "challenges", "module-challenge.json"));
  assert.equal(fs.existsSync(challenge.data.challenge_path), true);
  assert.equal(fs.existsSync(challenge.data.markdown_path), true);
  assert.equal(challenge.artifacts.some((artifact) => artifact.kind === "architecture_challenge"), true);
  assert.match(fs.readFileSync(challenge.data.markdown_path, "utf8"), /Do not silently replace/);
});

test("architecture apply command module records baseline alignment without Product AC evidence", async () => {
  const root = tempRoot();
  writeArchitectureBaseline(root, buildArchitectureBaseline(root, {
    goal: "Keep architecture aligned",
    goalId: "module-goal",
    accepted: true
  }));

  const applied = await runArchitectureApplyCommand([
    "--root", root,
    "--id", "module-ac-1-apply",
    "--goal", "module-goal",
    "--criterion", "AC-1",
    "--summary", "AC-1 will use the confirmed command-module boundary.",
    "--fit", "The change stays inside the command layer and does not replace the baseline stack.",
    "--implementation-focus", "Implement only the current AC-1 behavior.",
    "--evidence", "Reviewed baseline.json and the current command module.",
    "--json"
  ]);

  assert.equal(applied.ok, true);
  assert.equal(applied.data.apply_record.schema_version, "opennori/architecture-apply-v1");
  assert.equal(applied.data.apply_record.goal_id, "module-goal");
  assert.equal(applied.data.apply_record.criterion_id, "AC-1");
  assert.equal(applied.data.apply_record.status, "aligned");
  assert.equal(applied.data.apply_record.baseline.profile, "typescript-agent-state-cli");
  assert.equal(applied.data.apply_path, path.join(root, ".opennori", "architecture", "evidence", "module-ac-1-apply.json"));
  assert.equal(fs.existsSync(applied.data.apply_path), true);
  assert.equal(fs.existsSync(applied.data.markdown_path), true);
  assert.equal(applied.data.architecture.apply_records.length, 1);
  assert.equal(applied.data.architecture.apply_records[0].criterion_id, "AC-1");
  assert.equal(applied.data.agent_next.state, "evidence_ready_for_recording");
  assert.equal(applied.data.agent_next.recommended_skill, "nori-evidence");
  assert.equal(applied.data.agent_next.current_gap_id, "AC-1");
  assert.match(applied.data.agent_next.instruction, /--architecture-apply/);
  assert.equal(applied.artifacts.some((artifact) => artifact.kind === "architecture_apply"), true);
  assert.equal(applied.next_actions.some((action) => /Product AC evidence/.test(action)), true);
  assert.match(fs.readFileSync(applied.data.markdown_path, "utf8"), /not Product AC evidence/);
});

test("architecture apply routes conflicts to architecture challenge", async () => {
  const root = tempRoot();
  writeArchitectureBaseline(root, buildArchitectureBaseline(root, {
    goal: "Keep architecture aligned",
    goalId: "module-goal",
    accepted: true
  }));

  const applied = await runArchitectureApplyCommand([
    "--root", root,
    "--goal", "module-goal",
    "--criterion", "AC-1",
    "--status", "needs-challenge",
    "--summary", "AC-1 conflicts with the confirmed command-module boundary.",
    "--fit", "The intended work would replace the confirmed stack.",
    "--implementation-focus", "Stop before implementation.",
    "--json"
  ]);

  assert.equal(applied.ok, true);
  assert.equal(applied.data.apply_record.status, "needs-challenge");
  assert.equal(applied.data.agent_next.state, "architecture_needs_review");
  assert.equal(applied.data.agent_next.recommended_skill, "nori-architecture-challenge");
  assert.equal(applied.data.agent_next.needs_user, true);
  assert.equal(applied.next_actions.some((action) => /Architecture Challenge/.test(action)), true);
});

test("architecture profile command module installs and validates project profiles", async () => {
  const root = tempRoot();
  const sourcePath = path.join(root, "team-architecture.json");
  writeJson(sourcePath, {
    id: "module-team-cli",
    title: "Module Team CLI",
    summary: "Use the team command module shape.",
    principles: ["team-command-module"],
    checks: [
      {
        id: "TEAM-1",
        audience: "maintainer",
        statement: "Commands live in modules.",
        review: "Inspect src/cli/commands."
      }
    ],
    build_vs_buy_policy: {
      order: ["current-project-dependency", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    }
  });

  const added = await runArchitectureProfileCommand(["--root", root, "--from", sourcePath, "--json"]);
  assert.equal(added.ok, true);
  assert.equal(added.data.profile.id, "module-team-cli");
  assert.equal(added.data.profile_path, path.join(root, ".opennori", "architecture", "profiles", "module-team-cli.json"));
  assert.equal(fs.existsSync(added.data.profile_path), true);
  assert.equal(added.data.profiles[0].id, "module-team-cli");
  assert.equal(added.artifacts.some((artifact) => artifact.kind === "architecture_profile"), true);

  const invalidPath = path.join(root, "invalid-architecture.json");
  writeJson(invalidPath, { id: "invalid-profile" });
  const invalid = await runArchitectureProfileCommand(["--root", root, "--from", invalidPath, "--json"]);
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error.type, "invalid_architecture_profile");
  assert.equal(invalid.issues.some((issue) => issue.path === "summary"), true);
});

test("architecture baseline command module previews before confirmed write", async () => {
  const root = tempRoot();
  const baselinePath = path.join(root, ".opennori", "architecture", "baseline.json");
  const activeDir = path.join(root, ".opennori", "active");
  const activeAcceptancePath = path.join(activeDir, "module-goal.acceptance.md");
  const activeEvidencePath = path.join(activeDir, "module-goal.evidence.json");
  const contract = {
    schema_version: "opennori/contract-v1",
    goal_id: "module-goal",
    goal: "Ship a reviewable CLI architecture",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can verify the current architecture-guided gap."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  fs.mkdirSync(activeDir, { recursive: true });
  fs.writeFileSync(activeAcceptancePath, "# Module goal\n");
  writeJson(activeEvidencePath, { contract, ledger });

  const preview = await runArchitectureBaselineCommand([
    "--root", root,
    "--goal", "Ship a reviewable CLI architecture",
    "--goal-id", "module-goal",
    "--json"
  ]);
  assert.equal(preview.ok, true);
  assert.equal(preview.data.confirmed, false);
  assert.equal(preview.data.side_effect, "none");
  assert.equal(preview.data.baseline.status, "draft");
  assert.equal(preview.data.baseline.goal_id, "module-goal");
  assert.equal(preview.data.architecture.preview.baseline_path, ".opennori/architecture/baseline.json");
  assert.equal(fs.existsSync(baselinePath), false);

  const confirmed = await runArchitectureBaselineCommand([
    "--root", root,
    "--goal", "Ship a reviewable CLI architecture",
    "--goal-id", "module-goal",
    "--confirm",
    "--json"
  ]);
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.data.confirmed, true);
  assert.equal(confirmed.data.side_effect, "write");
  assert.equal(confirmed.data.baseline.status, "active");
  assert.equal(confirmed.data.architecture.decision, "valid");
  assert.equal(confirmed.data.current_gap.id, "AC-1");
  assert.equal(confirmed.data.next_recommendation.status, "work-on-current-gap");
  assert.equal(confirmed.data.agent_next.state, "work_on_current_gap");
  assert.equal(confirmed.data.agent_next.recommended_skill, "nori-architecture-apply");
  assert.match(confirmed.data.agent_next.instruction, /Architecture Baseline/);
  assert.equal(fs.existsSync(baselinePath), true);
  assert.equal(confirmed.artifacts.some((artifact) => artifact.kind === "architecture_baseline"), true);
  assert.equal(confirmed.next_actions.some((action) => /AC-1/.test(action)), true);
});

test("context export command module can write a review artifact", async () => {
  const root = tempRoot();
  writeActiveGoal(root);
  const outputPath = path.join(root, "context.json");

  const exported = await runContextExportCommand(["--root", root, "--output", outputPath, "--json"], { loadPair });
  assert.equal(exported.ok, true);
  assert.equal(exported.data.goal_id, "module-goal");
  assert.equal(exported.data.output_path, outputPath);
  assert.equal(exported.artifacts[0].kind, "opennori_context_export");
  assert.equal(JSON.parse(fs.readFileSync(outputPath, "utf8")).goal_id, "module-goal");
});

test("profile show command module reads the active goal via injected loader", async () => {
  const contract = {
    goal_id: "module-goal",
    criteria: [],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "active", criteria: {}, capability_profile: { items: [], evidence: [] } };

  const profile = await runProfileShowCommand(["--json"], {
    loadPair: () => ({ contract, ledger })
  });
  assert.equal(profile.ok, true);
  assert.equal(profile.data.goal_id, "module-goal");
  assert.equal(profile.data.workflow_status, "active");
  assert.equal(profile.data.profile.items.length, 0);
});

test("profile add and evidence modules update compliance and workflow state", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Use a required Skill",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can see the required behavior.",
        measurement: "Open the completed flow.",
        threshold: "I can see the expected result."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", { kind: "test-summary", summary: "AC-1 passes.", result: "passing" });
  fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
  fs.writeFileSync(acceptancePath, "# Module goal\n");
  writeJson(evidencePath, { contract, ledger });
  const data = {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root }),
    savePair: (nextAcceptancePath, nextEvidencePath, nextContract, nextLedger) => writeJson(nextEvidencePath, { contract: nextContract, ledger: nextLedger }),
    refreshManifest: () => {}
  };

  const added = await runProfileAddCommand([
    "--type", "skill",
    "--name", "design-taste-frontend",
    "--strength", "must",
    "--purpose", "Generate a design read before implementation.",
    "--install-policy", "existing_only",
    "--json"
  ], data);
  assert.equal(added.ok, true);
  assert.equal(added.data.workflow_status, "blocked");
  assert.equal(added.data.current_gap.id, "PROFILE-skill-design-taste-frontend");

  const evidenced = await runProfileEvidenceCommand([
    "--item", "skill-design-taste-frontend",
    "--result", "satisfied",
    "--summary", "Agent used design-taste-frontend.",
    "--path", "/Users/jarl/.agents/skills/design-taste-frontend/SKILL.md",
    "--json"
  ], data);
  assert.equal(evidenced.ok, true);
  assert.equal(evidenced.data.workflow_status, "complete");
  assert.equal(evidenced.data.current_gap, null);
  assert.equal(JSON.parse(fs.readFileSync(evidencePath, "utf8")).ledger.capability_profile.items.length, 1);
});

test("next command module routes approved gaps through architecture review when baseline is missing", async () => {
  const root = tempRoot();
  const contract = {
    goal_id: "module-goal",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can see the current acceptance gap."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "active", criteria: { "AC-1": { status: "unknown", evidence: [] } } };

  const next = await runNextCommand(["--json"], {
    loadPair: () => ({ contract, ledger, root })
  });
  assert.equal(next.ok, true);
  assert.equal(next.data.goal_id, "module-goal");
  assert.equal(next.data.current_gap.id, "AC-1");
  assert.equal(next.data.complete, false);
  assert.equal(next.data.next_recommendation.status, "architecture-review-required");
  assert.equal(next.data.agent_next.state, "architecture_needs_review");
  assert.equal(next.data.agent_next.recommended_skill, "nori-architecture-brainstorm");
  assert.equal(next.data.agent_next.current_gap_id, "AC-1");
  assert.equal(next.next_actions.some((action) => /Architecture Baseline/.test(action)), true);
});

test("resume command module includes completion, health, architecture, and next actions", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
  const contract = {
    goal_id: "module-goal",
    criteria: [],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "complete", criteria: {}, capability_profile: { items: [], evidence: [] } };

  const resume = await runResumeCommand(["--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(resume.ok, true);
  assert.equal(resume.data.goal_id, "module-goal");
  assert.equal(resume.data.completion.complete, true);
  assert.equal(resume.data.completion.objective_complete, true);
  assert.equal(resume.data.completion.confidence, "review-risk");
  assert.equal(resume.data.completion.review_risks.includes("architecture_review"), true);
  assert.equal(resume.data.acceptance_review.status, "clear");
  assert.equal(resume.data.evidence_health.status, "clear");
  assert.equal(resume.data.architecture.decision, "missing");
  assert.equal(resume.data.next_recommendation.status, "completion-review-required");
  assert.equal(resume.data.agent_next.state, "completion_needs_review");
  assert.equal(resume.data.agent_next.recommended_skill, "nori-reporting");
  assert.equal(resume.data.acceptance_path, acceptancePath);
  assert.equal(resume.next_actions.some((action) => /architecture_check/.test(action)), true);
});

test("resume command module suggests next-loop candidates for confidently complete goals", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
  const contract = {
    goal_id: "module-goal",
    goal: "Ship a settings page with profile editing, validation, persistence, failed-save recovery, reviewable screenshots, and release-ready report copy",
    criteria: [],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "complete", criteria: {}, capability_profile: { items: [], evidence: [] } };
  writeArchitectureBaseline(root, buildArchitectureBaseline(root, {
    goal: contract.goal,
    goalId: contract.goal_id,
    accepted: true
  }));
  fs.writeFileSync(path.join(root, ".opennori", "agent-guide.md"), renderAgentGuideMarkdown());

  const resume = await runResumeCommand(["--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });

  assert.equal(resume.ok, true);
  assert.equal(resume.data.completion.confidence, "confident");
  assert.equal(resume.data.next_recommendation.status, "ready-for-next-loop");
  assert.equal(resume.data.agent_next.state, "ready_for_next_loop");
  assert.equal(resume.data.agent_next.recommended_skill, "nori-acceptance");
  assert.equal(resume.data.agent_next.candidate_goals.length, 4);
  assert.equal(resume.data.agent_next.candidate_goals[0].id, "real-user-validation");
  assert.match(resume.data.agent_next.candidate_goals[0].draft_command, /opennori draft --from-next-candidate "real-user-validation"/);
  assert.equal(resume.data.next_recommendation.candidate_goals.length, 4);
  assert.equal(resume.data.next_recommendation.candidate_goals[0].id, "real-user-validation");
  assert.equal(resume.data.next_recommendation.candidate_goals[0].goal.length < 140, true);
  assert.match(resume.data.next_recommendation.candidate_goals[0].draft_command, /opennori draft --from-next-candidate "real-user-validation"/);
  assert.equal(resume.data.next_recommendation.candidate_goals[0].draft_args.includes("--source-goal"), true);
  assert.match(resume.data.next_recommendation.candidate_goals[0].draft_rule, /draft Nori Contract only/);
  assert.equal(resume.data.next_recommendation.candidate_goals.some((candidate) => candidate.id === "opennori-adoption-dogfood"), false);
  assert.equal(resume.next_actions.some((action) => /candidate_goals/.test(action)), true);
});

test("status command module includes criteria and completion state", async () => {
  const root = tempRoot();
  const contract = {
    goal_id: "module-goal",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can review the current delivery status."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "active", criteria: { "AC-1": { status: "unknown", evidence: [] } }, capability_profile: { items: [], evidence: [] } };

  const status = await runStatusCommand(["--json"], {
    loadPair: () => ({ contract, ledger, root })
  });
  assert.equal(status.ok, true);
  assert.equal(status.data.goal_id, "module-goal");
  assert.equal(status.data.workflow_status, "active");
  assert.equal(status.data.completion.complete, false);
  assert.equal(status.data.completion.objective_complete, false);
  assert.equal(status.data.acceptance_review.status, "clear");
  assert.equal(status.data.evidence_health.status, "clear");
  assert.equal(status.data.architecture.decision, "missing");
  assert.equal(status.data.next_recommendation.status, "architecture-review-required");
  assert.equal(status.data.agent_next.state, "architecture_needs_review");
  assert.equal(status.data.agent_next.recommended_skill, "nori-architecture-brainstorm");
  assert.equal(status.data.agent_next.current_gap_id, "AC-1");
  assert.equal(status.data.criteria.length, 1);
  assert.equal(status.data.criteria[0].id, "AC-1");
  assert.equal(status.next_actions.some((action) => /Architecture Baseline/.test(action)), true);
});

test("report command module renders a report artifact", async () => {
  const root = tempRoot();
  const outputPath = path.join(root, "report.md");
  const contract = {
    goal_id: "module-goal",
    goal: "Ship module reporting",
    criteria: [],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "complete", criteria: {}, capability_profile: { items: [], evidence: [] } };

  const report = await runReportCommand(["--output", outputPath, "--json"], {
    loadPair: () => ({ contract, ledger, root })
  });
  assert.equal(report.ok, true);
  assert.equal(report.data.goal_id, "module-goal");
  assert.equal(report.data.report_path, outputPath);
  assert.equal(report.data.completion.complete, true);
  assert.equal(report.data.completion.objective_complete, true);
  assert.equal(report.data.completion.confidence, "review-risk");
  assert.equal(report.data.completion.review_risks.includes("architecture_review"), true);
  assert.equal(report.data.acceptance_review.status, "clear");
  assert.equal(report.data.evidence_health.status, "clear");
  assert.equal(report.data.architecture.decision, "missing");
  assert.equal(report.data.next_recommendation.status, "completion-review-required");
  assert.equal(report.artifacts[0].kind, "acceptance_report");
  assert.match(fs.readFileSync(outputPath, "utf8"), /## Decision Summary/);
});

test("archive command module moves complete goals and preserves a report", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
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
  fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
  fs.writeFileSync(acceptancePath, "# Module goal\n");
  writeJson(evidencePath, { contract, ledger });

  const archived = await runArchiveCommand(["--root", root, "--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(archived.ok, true);
  assert.equal(archived.data.archived_as, "completed");
  assert.equal(fs.existsSync(acceptancePath), false);
  assert.equal(fs.existsSync(evidencePath), false);
  assert.equal(fs.existsSync(archived.data.acceptance_path), true);
  assert.equal(fs.existsSync(archived.data.evidence_path), true);
  assert.equal(fs.existsSync(archived.data.report_path), true);
});

test("archive command module rejects active goals", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Do not archive active goal",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can keep active work in active state.",
        measurement: "Open status.",
        threshold: "I can see the remaining gap."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
  fs.writeFileSync(acceptancePath, "# Module goal\n");
  writeJson(evidencePath, { contract, ledger });

  const archived = await runArchiveCommand(["--root", root, "--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(archived.ok, false);
  assert.equal(archived.error.type, "not_archivable");
  assert.equal(fs.existsSync(acceptancePath), true);
  assert.equal(fs.existsSync(evidencePath), true);
});

test("evaluate command module recomputes and writes workflow state", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
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
  fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
  fs.writeFileSync(acceptancePath, "# Module goal\n");
  writeJson(evidencePath, { contract, ledger });

  const evaluated = await runEvaluateCommand(["--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(evaluated.ok, true);
  assert.equal(evaluated.data.goal_id, "module-goal");
  assert.equal(evaluated.data.workflow_status, "complete");
  assert.equal(evaluated.data.current_gap, null);
  assert.equal(JSON.parse(fs.readFileSync(evidencePath, "utf8")).ledger.status, "complete");
  assert.match(fs.readFileSync(acceptancePath, "utf8"), /\| AC-1 .* passing \|/);
});

test("changes command module groups acceptance and implementation files", async () => {
  const root = tempRoot();
  spawnSync("git", ["init"], { cwd: root, encoding: "utf8" });
  writeActiveGoal(root);
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "index.js"), "console.log('demo')\n");

  const changes = await runChangesCommand(["--root", root, "--json"]);
  assert.equal(changes.ok, true);
  assert.equal(changes.data.changed_files.available, true);
  assert.equal(changes.data.active_goals.length, 1);
  assert.equal(changes.data.changed_files.acceptance.some((item) => item.path === ".opennori/active/module-goal.acceptance.md"), true);
  assert.equal(changes.data.changed_files.implementation.some((item) => item.path === "src/index.js"), true);
});

test("approve command module marks acceptance basis approved and recomputes status", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
  const contract = {
    schema_version: "opennori/contract-v1",
    goal_id: "module-goal",
    goal: "Approve module acceptance",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can approve acceptance criteria."
      }
    ],
    acceptance_basis: { status: "draft" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", { kind: "test-summary", summary: "AC-1 passes.", result: "passing" });
  fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
  fs.writeFileSync(acceptancePath, "# Module goal\n");
  writeJson(evidencePath, { contract, ledger });

  const approved = await runApproveCommand(["--summary", "User approved module criteria.", "--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(approved.ok, true);
  assert.equal(approved.data.acceptance_basis.status, "approved");
  assert.equal(approved.data.acceptance_basis.summary, "User approved module criteria.");
  assert.equal(approved.data.workflow_status, "complete");
  assert.equal(approved.data.current_gap, null);
  assert.equal(approved.data.architecture.decision, "missing");
  assert.equal(approved.data.next_recommendation.status, "completion-review-required");
  assert.equal(approved.data.agent_next.state, "completion_needs_review");
  assert.equal(approved.data.agent_next.recommended_skill, "nori-reporting");
  assert.equal(approved.next_actions.some((action) => /architecture_check/.test(action)), true);
  assert.match(fs.readFileSync(acceptancePath, "utf8"), /Status: approved/);
});

test("approve command module routes approved non-trivial gaps to architecture review before implementation", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
  const contract = {
    schema_version: "opennori/contract-v1",
    goal_id: "module-goal",
    goal: "Ship a settings page where users edit profile details",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can edit profile details from Account Settings."
      }
    ],
    acceptance_basis: { status: "draft" }
  };
  const ledger = buildEvidenceLedger(contract);
  fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
  fs.writeFileSync(acceptancePath, "# Module goal\n");
  writeJson(evidencePath, { contract, ledger });

  const approved = await runApproveCommand(["--summary", "User approved module criteria.", "--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });

  assert.equal(approved.ok, true);
  assert.equal(approved.data.current_gap.id, "AC-1");
  assert.equal(approved.data.architecture.decision, "missing");
  assert.equal(approved.data.next_recommendation.status, "architecture-review-required");
  assert.equal(approved.data.agent_next.state, "architecture_needs_review");
  assert.equal(approved.data.agent_next.recommended_skill, "nori-architecture-brainstorm");
  assert.equal(approved.data.agent_next.current_gap_id, "AC-1");
  assert.equal(approved.next_actions.some((action) => /Architecture Baseline/.test(action)), true);
});

test("criterion update command module clears stale evidence after a user revision", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Revise module acceptance",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can inspect the old criterion.",
        measurement: "Open the old screen.",
        threshold: "I can see the old behavior."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", { kind: "test-summary", summary: "Old evidence passes.", result: "passing" });
  fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
  fs.writeFileSync(acceptancePath, "# Module goal\n");
  writeJson(evidencePath, { contract, ledger });

  const updated = await runCriterionUpdateCommand([
    "--criterion", "AC-1",
    "--user-story", "As a user, I can inspect the revised criterion.",
    "--measurement", "Open the revised screen.",
    "--threshold", "I can see the revised behavior.",
    "--summary", "User revised AC-1.",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(updated.ok, true);
  assert.equal(updated.data.acceptance_basis.status, "approved");
  assert.equal(updated.data.criterion.user_story, "As a user, I can inspect the revised criterion.");
  assert.equal(updated.data.current_gap.id, "AC-1");
  const written = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  assert.equal(written.ledger.criteria["AC-1"].status, "unknown");
  assert.equal(written.ledger.criteria["AC-1"].evidence.length, 0);
});

test("criterion add command module extends the contract and ledger together", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Add module acceptance",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can inspect the existing criterion.",
        measurement: "Open the existing report.",
        threshold: "The existing criterion is visible."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", { kind: "test-summary", summary: "Existing evidence passes.", result: "passing" });
  fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
  fs.writeFileSync(acceptancePath, "# Module goal\n");
  writeJson(evidencePath, { contract, ledger });

  const added = await runCriterionAddCommand([
    "--id", "AC-Z-18",
    "--user-story", "As a user, I can review the new product boundary.",
    "--measurement", "Read the OpenNori README and report.",
    "--threshold", "The new boundary is visible and pending evidence.",
    "--summary", "User added AC-Z-18.",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });

  assert.equal(added.ok, true);
  assert.equal(added.data.criterion.id, "AC-Z-18");
  assert.equal(added.data.criterion.layer, "productization");
  assert.equal(added.data.current_gap.id, "AC-Z-18");

  const written = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  assert.equal(written.contract.criteria.some((criterion) => criterion.id === "AC-Z-18"), true);
  assert.equal(written.ledger.criteria["AC-Z-18"].status, "unknown");
  assert.match(fs.readFileSync(acceptancePath, "utf8"), /AC-Z-18/);
});

test("evidence add command module records flexible reviewable sources", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Record reviewable evidence",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can review evidence for the completed behavior.",
        measurement: "Open the evidence report.",
        threshold: "I can see reviewable evidence."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
  fs.writeFileSync(acceptancePath, "# Module goal\n");
  const architectureApplyPath = path.join(root, ".opennori", "architecture", "evidence", "module-ac-1-apply.json");
  fs.mkdirSync(path.dirname(architectureApplyPath), { recursive: true });
  writeJson(architectureApplyPath, {
    schema_version: "opennori/architecture-apply-v1",
    id: "module-ac-1-apply",
    goal_id: "module-goal",
    criterion_id: "AC-1",
    status: "aligned",
    baseline: { profile: "typescript-agent-state-cli", accepted_at: "2026-06-15T00:00:00.000Z" },
    summary: "AC-1 follows the module architecture baseline.",
    fit: "The evidence command stays inside the confirmed boundary.",
    implementation_focus: "Record evidence for AC-1.",
    created_at: "2026-06-15T00:00:00.000Z",
    next: "Use this apply record as architecture context when recording Product AC evidence."
  });
  writeJson(evidencePath, { contract, ledger });

  const added = await runEvidenceAddCommand([
    "--criterion", "AC-1",
    "--kind", "agent-observation",
    "--basis", "tool-observation",
    "--summary", "The user-visible workflow can be reviewed.",
    "--architecture-apply", "module-ac-1-apply",
    "--source", "{\"type\":\"command\",\"label\":\"npm run check\",\"command\":\"npm run check\",\"outcome\":\"passed\"}",
    "--source", "screenshots/reviewable-flow.png",
    "--source-command", "npm run check",
    "--source-path", "src/cli.ts",
    "--source-url", "https://example.com/review",
    "--reviewability", "User can rerun the command or open the artifact.",
    "--limitations", "Browser-specific visual review was not performed.",
    "--confidence", "verified",
    "--result", "passing",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(added.ok, true);
  assert.equal(added.data.criterion_status, "passing");
  assert.equal(added.data.workflow_status, "complete");
  assert.equal(added.data.current_gap, null);
  assert.equal(added.data.next_recommendation.status, "completion-review-required");
  assert.equal(added.data.agent_next.state, "completion_needs_review");
  assert.equal(added.data.agent_next.recommended_skill, "nori-reporting");
  assert.equal(added.data.latest_evidence.sources.length, 5);
  const architectureSource = added.data.latest_evidence.sources.find((source) => source.type === "architecture-apply");
  assert.equal(architectureSource.role, "context");
  assert.equal(architectureSource.path, ".opennori/architecture/evidence/module-ac-1-apply.json");
  assert.equal(added.data.latest_evidence.sources.some((source) => source.command === "npm run check"), true);
  assert.equal(added.data.latest_evidence.sources.some((source) => source.label === "screenshots/reviewable-flow.png"), true);
  assert.equal(added.data.latest_evidence.sources.some((source) => source.type === "url"), true);
  assert.equal(JSON.parse(fs.readFileSync(evidencePath, "utf8")).ledger.criteria["AC-1"].status, "passing");
});

test("evidence prune command module removes obsolete criterion evidence", async () => {
  const root = tempRoot();
  const acceptancePath = path.join(root, ".opennori", "active", "module-goal.acceptance.md");
  const evidencePath = path.join(root, ".opennori", "active", "module-goal.evidence.json");
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Refresh obsolete evidence",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can see only current evidence in the report.",
        measurement: "Open the report.",
        threshold: "Obsolete proof no longer appears."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", {
    kind: "review-result",
    basis: "tool-observation",
    summary: "Old proof was valid before the product changed.",
    result: "passing",
    sources: [{ type: "command", label: "old check", command: "npm test" }],
    reviewability: "Rerun the old check.",
    limitations: "It no longer proves the current behavior."
  });
  fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
  fs.writeFileSync(acceptancePath, "# Module goal\n");
  writeJson(evidencePath, { contract, ledger });

  const pruned = await runEvidencePruneCommand([
    "--criterion", "AC-1",
    "--reason", "Product behavior changed and this proof is obsolete.",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });

  assert.equal(pruned.ok, true);
  assert.equal(pruned.data.evidence_prune.removed_records, 1);
  assert.equal(pruned.data.criterion_status, "unknown");
  assert.equal(pruned.data.latest_evidence, null);
  assert.equal(pruned.data.current_gap.id, "AC-1");
  const written = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  assert.equal(written.ledger.criteria["AC-1"].evidence.length, 0);
  assert.equal(written.ledger.criteria["AC-1"].status, "unknown");
});
