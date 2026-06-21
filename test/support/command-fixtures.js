import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { printHumanResult } from "../../src/cli/human-output.ts";
import { loadPair, savePair } from "../../src/cli/runtime.ts";
import { buildEvidenceLedger, pathsForGoal, readGoalPayload, writeGoalDossier, writeJson } from "../../src/core.ts";

export { loadPair, savePair };
export { runApproveCommand, runBrainstormCommand, runCriterionAddCommand, runCriterionUpdateCommand, runDiscoverCommand, runDraftCommand, runEvaluateCommand, runInitCommand, runNextCommand, runResumeCommand, runStatusCommand } from "../../src/cli/commands/acceptance.ts";
export { runArchitectureApplyCommand, runArchitectureBaselineCommand, runArchitectureBuildVsBuyCommand, runArchitectureChallengeCommand, runArchitectureProfileCommand, runArchitectureProfilesCommand, runArchitectureRequirementCommand } from "../../src/cli/commands/architecture.ts";
export { runActivityFinishCommand, runActivityHeartbeatCommand, runActivityShowCommand, runActivityStartCommand } from "../../src/cli/commands/activity.ts";
export { runBootstrapCommand } from "../../src/cli/commands/bootstrap.ts";
export { runCheckCommand } from "../../src/cli/commands/check.ts";
export { runChangesCommand } from "../../src/cli/commands/changes.ts";
export { resolveCliCommand, runCliCommand } from "../../src/cli/command-tree.ts";
export { runContextExportCommand } from "../../src/cli/commands/context.ts";
export { runDashboardCommand } from "../../src/cli/commands/dashboard.ts";
export { runDoctorCommand } from "../../src/cli/commands/doctor.ts";
export { runEvidenceAddCommand, runEvidencePruneCommand } from "../../src/cli/commands/evidence.ts";
export { runInstallCommand } from "../../src/cli/commands/install.ts";
export { runListCommand } from "../../src/cli/commands/list.ts";
export { runPluginSyncCommand } from "../../src/cli/commands/plugin.ts";
export { runProfileAddCommand, runProfileCheckCommand, runProfileEvidenceCommand, runProfileShowCommand } from "../../src/cli/commands/profile.ts";
export { runArchiveCommand, runReportCommand } from "../../src/cli/commands/reporting.ts";
export { runSetupCommand } from "../../src/cli/commands/setup.ts";
export { runSetup } from "../../src/cli/setup.ts";
export { runUninstallCommand } from "../../src/cli/commands/uninstall.ts";
export { runUpgradeCommand } from "../../src/cli/commands/upgrade.ts";
export { buildArchitectureBaseline, renderAgentGuideMarkdown, writeArchitectureBaseline, writeArchitectureRequirement } from "../../src/architecture.ts";
export { addEvidence, appendEvent, buildEvidenceLedger, readEvents, refreshSnapshot, snapshotPath, writeGoalDossier, writeJson } from "../../src/core.ts";
export { printHumanResult } from "../../src/cli/human-output.ts";
export { startDashboardServer } from "../../src/kernel/server.ts";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");

export function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "nori-command-test-"));
}

export function skillBrief(goal, options = {}) {
  const language = options.language || (/[\u3400-\u9fff]/.test(goal) ? "zh-CN" : "en");
  const zh = language === "zh-CN";
  return {
    goal_id: options.goalId,
    goal,
    presentation: { language },
    acceptance_basis: {
      status: "draft",
      summary: "Skill-prepared acceptance brief for command test."
    },
    criteria: options.criteria || (zh
      ? [
          {
            id: "AC-1",
            layer: "operator",
            user_story: "作为用户，我能从正常入口打开结果并看到当前状态。",
            measurement: "打开用户入口并查看结果状态。",
            threshold: "界面或报告显示目标结果、当前状态和是否可接受。"
          }
        ]
      : [
          {
            id: "AC-1",
            layer: "operator",
            user_story: "As a user, I can open the result from the normal entrypoint and see the current state.",
            measurement: "Open the user-facing entrypoint and review the result state.",
            threshold: "The page or report shows the target result, current state, and whether it is acceptable."
          }
        ])
  };
}

export function writeBriefFile(root, goal, options = {}) {
  const dir = path.join(root, ".opennori-test-briefs");
  fs.mkdirSync(dir, { recursive: true });
  const brief = skillBrief(goal, options);
  const briefPath = path.join(dir, `${brief.goal_id || "brief"}.json`);
  writeJson(briefPath, brief);
  return briefPath;
}

export function writeGoal(root, location = "current") {
  const contract = {
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Ship module command coverage",
    acceptance_basis: { status: location === "drafts" ? "draft" : "approved", summary: "Fixture contract." },
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can inspect current goal gaps.",
        measurement: "Run list command module.",
        threshold: "Output includes the current gap."
      }
    ]
  };
  const ledger = buildEvidenceLedger(contract);
  const paths = pathsForGoal(root, contract.goal_id, location);
  writeGoalDossier(paths.goalDir, contract, ledger);
}

export function goalPaths(root, goalId = "module-goal", location = "current") {
  return pathsForGoal(root, goalId, location);
}

export function readGoalPayloadFromPaths(acceptancePath, evidencePath) {
  return readGoalPayload({
    goalDir: path.dirname(acceptancePath),
    contractPath: path.join(path.dirname(acceptancePath), "contract.json"),
    ledgerPath: evidencePath
  });
}

export function writeActiveGoal(root) {
  writeGoal(root, "current");
}

export function writeActiveGoalWithId(root, goalId, status = "active", location = "current") {
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: goalId,
    goal: `Ship ${goalId}`,
    acceptance_basis: { status: "approved", summary: "Approved for test." },
    criteria: [
      {
        id: "AC-1",
        user_story: `As a user, I can inspect ${goalId}.`,
        measurement: "Run OpenNori status.",
        threshold: "Output identifies the current gap."
      }
    ]
  };
  const ledger = buildEvidenceLedger(contract);
  ledger.status = status;
  const paths = pathsForGoal(root, goalId, location);
  writeGoalDossier(paths.goalDir, contract, ledger);
}

export function activeGoalRuntimeFor(root) {
  return {
    loadPair: (args = {}) => loadPair({ root, ...args }),
    savePair,
    refreshManifest() {}
  };
}

export function packageVersion() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
}

export function setupRunner({ marketplace = false, plugin = false, pluginVersion = packageVersion(), globalVersion = null, failCommand = "" } = {}) {
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

export function renderHuman(payload, commandPath) {
  let output = "";
  const stdout = {
    isTTY: true,
    write(chunk) {
      output += String(chunk);
      return true;
    }
  };
  const handled = printHumanResult(payload, { commandPath, stdout });
  assert.equal(handled, true);
  return output;
}
