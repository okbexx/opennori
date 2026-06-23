import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { tempRoot, writeActiveGoalWithId, activeGoalRuntimeFor, setupRunner, renderHuman, runActivityStartCommand, runStatusCommand, runCheckCommand, runDashboardCommand, runDoctorCommand, runInstallCommand, runPluginSyncCommand, runReportCommand, runUninstallCommand, runUpgradeCommand, printHumanResult } from "./support/command-fixtures.js";

test("human output summarizes lifecycle commands instead of printing full JSON", { tags: ["cli", "reporting", "quick"] }, async () => {
  const root = tempRoot();
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
