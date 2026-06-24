import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { tempRoot, writeActiveGoalWithId, activeGoalRuntimeFor, setupRunner, renderHuman, runActivityStartCommand, runArchitectureBaselineCommand, runArchitectureProfilesCommand, runArchitectureRequirementCommand, runArchitectureShowCommand, runStatusCommand, runCheckCommand, runDashboardCommand, runDoctorCommand, runInstallCommand, runPluginSyncCommand, runProfileAddCommand, runProfileCheckCommand, runProfileShowCommand, runReportCommand, runSetupCommand, runInitCommand, runBootstrapCommand, runUninstallCommand, runUpgradeCommand, printHumanResult } from "./support/command-fixtures.js";

test("human output summarizes lifecycle commands instead of printing full JSON", { tags: ["cli", "reporting", "quick"] }, async () => {
  const root = tempRoot();
  const { runner } = setupRunner();
  const setup = await runSetupCommand(["--root", root, "--json"], { runner });
  const setupText = renderHuman(setup, ["setup"]);
  assert.match(setupText, /OpenNori setup preview/);
  assert.match(setupText, /Bundle: Codex Plugin, packaged Skills, global opennori CLI, project \.opennori state, doctor/);
  assert.match(setupText, /Next: Review this setup preview/);
  assert.equal((setupText.match(/^Next:/gm) || []).length, 1);
  assert.doesNotMatch(setupText, /Show this setup preview to the user/);
  assert.doesNotMatch(setupText.trimStart(), /^\{/);
  assert.doesNotMatch(setupText, /"setup_plan"/);

  const init = await runInitCommand(["--root", root, "--json"]);
  const initText = renderHuman(init, ["init"]);
  assert.match(initText, /OpenNori project init preview/);
  assert.match(initText, /Current Nori Contract: none/);
  assert.match(initText, /Empty \.opennori\/current is normal/);
  assert.match(initText, /Next: Review this project init preview/);
  assert.equal((initText.match(/^Next:/gm) || []).length, 1);
  assert.doesNotMatch(initText, /Show this preview to the user/);
  assert.doesNotMatch(initText, /"install_plan"/);

  const bootstrap = await runBootstrapCommand(["--root", root, "--json"]);
  const bootstrapText = renderHuman(bootstrap, ["bootstrap"]);
  assert.match(bootstrapText, /OpenNori project setup preview/);
  assert.doesNotMatch(bootstrapText, /"doctor"/);

  await runInstallCommand(["--root", root, "--json"]);
  fs.writeFileSync(path.join(root, ".opennori", "protocol.md"), "old protocol\n");

  const upgrade = await runUpgradeCommand(["--root", root, "--confirm", "--json"]);
  const upgradeText = renderHuman(upgrade, ["upgrade"]);
  assert.match(upgradeText, /OpenNori upgrade complete/);
  assert.match(upgradeText, /Actions:/);
  assert.match(upgradeText, /Destructive:/);
  assert.doesNotMatch(upgradeText.trimStart(), /^\{/);
  assert.doesNotMatch(upgradeText, /"upgrade_plan"/);

  const uninstall = await runUninstallCommand(["--root", root, "--dry-run", "--json"]);
  const uninstallText = renderHuman(uninstall, ["uninstall"]);
  assert.match(uninstallText, /OpenNori uninstall preview/);
  assert.match(uninstallText, /Writes: 0 now/);

  const plugin = await runPluginSyncCommand(["--json"], { runner: setupRunner({ marketplace: true, plugin: true }).runner });
  const pluginText = renderHuman(plugin, ["plugin", "sync"]);
  assert.match(pluginText, /OpenNori plugin sync preview/);
  assert.doesNotMatch(pluginText, /"plugin_sync_plan"/);
});

test("human output summarizes doctor check status report and dashboard", { tags: ["cli", "dashboard", "lifecycle", "reporting", "acceptance"] }, async () => {
  const root = tempRoot();
  await runInstallCommand(["--root", root, "--json"]);
  writeActiveGoalWithId(root, "human-output-goal");

  const doctor = await runDoctorCommand(["--root", root, "--json"]);
  assert.match(renderHuman(doctor, ["doctor"]), /OpenNori doctor/);

  const status = await runStatusCommand(["--root", root, "--json"], activeGoalRuntimeFor(root));
  const statusText = renderHuman(status, ["status"]);
  assert.match(statusText, /OpenNori status/);
  assert.match(statusText, /Goal: human-output-goal/);
  assert.doesNotMatch(statusText, /"agent_next"/);

  const check = await runCheckCommand(["--root", root, "--json"], activeGoalRuntimeFor(root));
  const checkText = renderHuman(check, ["check"]);
  assert.match(checkText, /OpenNori check/);
  assert.match(checkText, /Evidence health:/);

  const report = await runReportCommand(["--root", root, "--json"], activeGoalRuntimeFor(root));
  const reportText = renderHuman(report, ["report"]);
  assert.match(reportText, /OpenNori report generated/);
  assert.match(reportText, /Report:/);

  const dashboard = await runDashboardCommand(["--root", root, "--port", "0", "--once", "--json"]);
  const dashboardText = renderHuman(dashboard, ["dashboard"]);
  assert.match(dashboardText, /OpenNori dashboard running/);
  assert.match(dashboardText, /URL:/);
  assert.match(dashboardText, /not opened automatically/);

  const activity = await runActivityStartCommand([
    "--root", root,
    "--agent", "Codex",
    "--skill", "nori-evidence",
    "--state", "verifying",
    "--summary", "Checking current gap.",
    "--json"
  ]);
  const activityText = renderHuman(activity, ["activity", "start"]);
  assert.match(activityText, /OpenNori activity start/);
  assert.match(activityText, /Agent: Codex/);
  assert.match(activityText, /Current gap: AC-1/);
  assert.match(activityText, /Snapshot: \.opennori\/snapshots\/current\.json/);
  assert.doesNotMatch(activityText, /"snapshot_summary"/);
});

test("human output summarizes Project Profile commands", { tags: ["cli", "profile", "reporting", "quick"] }, async () => {
  const root = tempRoot();
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ dependencies: { react: "19.0.0" } }, null, 2));
  writeActiveGoalWithId(root, "human-profile-goal");
  const added = await runProfileAddCommand([
    "--root", root,
    "--type", "stack",
    "--name", "react",
    "--strength", "must",
    "--purpose", "Use the project UI stack instead of adding another one.",
    "--json"
  ]);
  const addText = renderHuman(added, ["profile", "add"]);
  assert.match(addText, /OpenNori profile add/);
  assert.match(addText, /Items: 1/);
  assert.match(addText, /react/);
  assert.doesNotMatch(addText.trimStart(), /^\{/);
  assert.doesNotMatch(addText, /"profile"/);

  const shown = await runProfileShowCommand(["--root", root, "--json"]);
  const showText = renderHuman(shown, ["profile", "show"]);
  assert.match(showText, /OpenNori profile show/);
  assert.match(showText, /Scope: project/);
  assert.match(showText, /Goal: human-profile-goal/);
  assert.match(showText, /Compliance:/);
  assert.doesNotMatch(showText, /"compliance"/);

  const checked = await runProfileCheckCommand(["--root", root, "--goal", "human-profile-goal", "--record", "--json"]);
  const checkText = renderHuman(checked, ["profile", "check"]);
  assert.match(checkText, /OpenNori profile check/);
  assert.match(checkText, /Checks: 1/);
  assert.match(checkText, /Recorded: yes/);
  assert.doesNotMatch(checkText, /"checks"/);
});

test("human output summarizes Architecture commands", { tags: ["cli", "architecture", "reporting", "quick"] }, async () => {
  const root = tempRoot();
  writeActiveGoalWithId(root, "human-architecture-goal");

  const profiles = await runArchitectureProfilesCommand(["--root", root, "--json"]);
  const profilesText = renderHuman(profiles, ["architecture", "profiles"]);
  assert.match(profilesText, /OpenNori architecture profiles/);
  assert.match(profilesText, /Profiles:/);
  assert.doesNotMatch(profilesText.trimStart(), /^\{/);
  assert.doesNotMatch(profilesText, /"profiles"/);

  const requirement = await runArchitectureRequirementCommand([
    "--root", root,
    "--goal-id", "human-architecture-goal",
    "--status", "required",
    "--reason", "This fixture touches runtime and state boundaries.",
    "--json"
  ]);
  const requirementText = renderHuman(requirement, ["architecture", "requirement"]);
  assert.match(requirementText, /OpenNori architecture requirement/);
  assert.match(requirementText, /Goal: human-architecture-goal/);
  assert.match(requirementText, /Requirement: required/);
  assert.doesNotMatch(requirementText, /"requirement"/);

  const preview = await runArchitectureBaselineCommand([
    "--root", root,
    "--goal", "Ship human architecture output",
    "--goal-id", "human-architecture-goal",
    "--json"
  ]);
  const previewText = renderHuman(preview, ["architecture", "baseline"]);
  assert.match(previewText, /OpenNori architecture baseline/);
  assert.match(previewText, /Confirmed: no/);
  assert.match(previewText, /Baseline: TypeScript Agent State CLI/);
  assert.doesNotMatch(previewText, /"baseline"/);

  const confirmed = await runArchitectureBaselineCommand([
    "--root", root,
    "--goal", "Ship human architecture output",
    "--goal-id", "human-architecture-goal",
    "--confirm",
    "--json"
  ]);
  const confirmedText = renderHuman(confirmed, ["architecture", "baseline"]);
  assert.match(confirmedText, /Confirmed: yes/);

  const shown = await runArchitectureShowCommand(["--root", root, "--goal", "human-architecture-goal", "--json"]);
  const showText = renderHuman(shown, ["architecture", "show"]);
  assert.match(showText, /OpenNori architecture show/);
  assert.match(showText, /Architecture decision: valid/);
  assert.doesNotMatch(showText, /"architecture"/);
});

test("human status output shows enhanced autogoal acceptance basis", { tags: ["cli", "reporting", "acceptance", "quick"] }, () => {
  const output = [];
  const printed = printHumanResult({
    ok: true,
    data: {
      goal_id: "enhanced-todolist",
      workflow_status: "draft",
      current_gap: {
        id: "ACCEPTANCE-BASIS",
        reason: "Acceptance criteria have not been approved by the user yet."
      },
      acceptance_basis: {
        source: "autogoal",
        mode: "enhanced",
        coverage_summary: [
          "task creation",
          "invalid input",
          "refresh persistence"
        ]
      },
      completion: {
        complete: false,
        answer: "Not complete: acceptance basis is draft."
      },
      intervention: {
        required: true,
        action: "Review the draft."
      }
    },
    artifacts: [],
    warnings: [],
    next_actions: []
  }, {
    commandPath: ["status"],
    stdout: { isTTY: true, write: (chunk) => output.push(chunk) }
  });

  assert.equal(printed, true);
  const text = output.join("");
  assert.match(text, /Acceptance basis: autogoal enhanced/);
  assert.match(text, /Discovery coverage: task creation, invalid input, refresh persistence/);
});
