import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { ROOT, tempRoot, packageVersion, setupRunner, runBootstrapCommand, runDoctorCommand, runInstallCommand, runPluginSyncCommand, runSetupCommand, runSetup, runUninstallCommand, runUpgradeCommand } from "./support/command-fixtures.js";

test("doctor routes fresh projects to init preview instead of repeated recovery actions", { tags: ["cli", "lifecycle", "acceptance"] }, async () => {
  const root = tempRoot();
  const doctor = await runDoctorCommand(["--root", root, "--json"]);

  assert.equal(doctor.ok, true);
  assert.equal(doctor.data.status, "needs-action");
  assert.equal(doctor.data.agent_next.state, "health_needs_recovery");
  assert.equal(doctor.data.agent_next.recommended_skill, "nori-project-health");
  assert.equal(doctor.data.agent_next.safe_next_command, `opennori init --root ${root} --json`);
  assert.match(doctor.data.agent_next.instruction, /Run the init preview/);
});

test("bootstrap command module previews before confirmed setup", { tags: ["cli", "lifecycle"] }, async () => {
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
  assert.equal(fs.existsSync(path.join(root, ".opennori", "profile", "profile.json")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "profile", "README.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
});

test("setup command previews one complete capability bundle without writing", { tags: ["cli", "lifecycle"] }, async () => {
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

test("setup command confirm applies external commands through official CLIs and initializes project state", { tags: ["cli", "lifecycle", "acceptance"] }, async () => {
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

test("setup command does not rerun already installed bundle parts", { tags: ["cli", "lifecycle"] }, async () => {
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

test("setup command upgrades stale installed Codex Plugin versions", { tags: ["cli", "profile", "lifecycle"] }, async () => {
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

test("plugin sync previews and confirms Codex Plugin cache refresh without project state writes", { tags: ["cli", "profile", "lifecycle"] }, async () => {
  const root = tempRoot();
  const { calls, runner } = setupRunner({
    marketplace: true,
    plugin: true,
    pluginVersion: "0.1.8",
    globalVersion: packageVersion()
  });
  const preview = await runPluginSyncCommand(["--json"], { runner });

  assert.equal(preview.ok, true);
  assert.equal(preview.data.status, "needs_confirm");
  assert.equal(preview.data.plugin_sync_plan.schema_version, "opennori/plugin-sync-plan-v1");
  assert.equal(preview.data.plugin_sync_plan.summary.will_write, 0);
  assert.equal(preview.data.plugin_sync_plan.actions.some((action) => action.id === "codex_plugin" && action.action === "will-run"), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);
  assert.equal(calls.some((call) => call.join(" ") === "codex plugin add opennori@opennori"), false);

  const confirmed = await runPluginSyncCommand(["--confirm", "--json"], { runner });

  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.data.status, "synced");
  assert.equal(calls.some((call) => call.join(" ") === "codex plugin add opennori@opennori"), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);
});

test("plugin sync local mode can register the current package marketplace", { tags: ["cli", "profile", "lifecycle"] }, async () => {
  const { calls, runner } = setupRunner({
    marketplace: false,
    plugin: true,
    pluginVersion: packageVersion(),
    globalVersion: packageVersion()
  });
  const preview = await runPluginSyncCommand(["--local", "--json"], { runner });
  const marketplaceAction = preview.data.plugin_sync_plan.actions.find((action) => action.id === "codex_marketplace");

  assert.equal(preview.ok, true);
  assert.equal(marketplaceAction.action, "will-run");
  assert.equal(marketplaceAction.command[0], "codex");
  assert.equal(marketplaceAction.command[1], "plugin");
  assert.equal(marketplaceAction.command[2], "marketplace");
  assert.equal(marketplaceAction.command[3], "add");
  assert.equal(marketplaceAction.command[4], ROOT);

  const confirmed = await runPluginSyncCommand(["--local", "--confirm", "--json"], { runner });

  assert.equal(confirmed.ok, true);
  assert.equal(calls.some((call) => call.join(" ") === `codex plugin marketplace add ${ROOT}`), true);
  assert.equal(calls.some((call) => call.join(" ") === "codex plugin add opennori@opennori"), true);
});

test("interactive setup reports underlying setup failure instead of throwing on missing data", { tags: ["cli", "lifecycle", "package", "reporting"] }, async () => {
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

test("install command module preserves preview and confirm safety", { tags: ["cli", "lifecycle"] }, async () => {
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
  assert.equal(fs.existsSync(path.join(root, ".opennori", "profile", "profile.json")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "profile", "README.md")), true);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "manifest.json"), "utf8"));
  assert.equal(manifest.managed_files.some((entry) => entry.path === ".opennori/profile/profile.json" && entry.exists), true);
  assert.equal(manifest.managed_files.some((entry) => entry.path === ".opennori/profile/README.md" && entry.exists), true);

  const unconfirmed = await runInstallCommand(["--root", root, "--force", "--json"]);
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error.type, "confirm_required");
  assert.match(unconfirmed.error.fix, /--dry-run --force --json/);

  const profilePath = path.join(root, ".opennori", "profile", "profile.json");
  fs.writeFileSync(profilePath, JSON.stringify({
    schema_version: "opennori/project-profile-v1",
    items: [
      {
        id: "constraint-keep-user-profile",
        type: "constraint",
        name: "keep user Project Profile",
        strength: "must",
        purpose: "Project Profile is user/agent-maintained source data.",
        scope: "project",
        install_policy: "ask_before_install"
      }
    ]
  }, null, 2));
  const forced = await runInstallCommand(["--root", root, "--force", "--confirm", "--json"]);
  assert.equal(forced.ok, true);
  const preservedProfile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  assert.equal(preservedProfile.items[0].id, "constraint-keep-user-profile");
  const refreshedProfileReadme = fs.readFileSync(path.join(root, ".opennori", "profile", "README.md"), "utf8");
  assert.match(refreshedProfileReadme, /keep user Project Profile/);
});

test("uninstall command module preserves state unless include-state is confirmed", { tags: ["cli", "lifecycle"] }, async () => {
  const root = tempRoot();
  await runInstallCommand(["--root", root, "--json"]);

  const dryRun = await runUninstallCommand(["--root", root, "--dry-run", "--json"]);
  assert.equal(dryRun.ok, true);
  assert.equal(dryRun.data.uninstall_plan.summary.will_write, 0);
  assert.equal(dryRun.data.uninstall_plan.actions.find((action) => action.path === ".opennori/current").action, "preserve");
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);

  const unconfirmed = await runUninstallCommand(["--root", root, "--json"]);
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error.type, "confirm_required");

  const removed = await runUninstallCommand(["--root", root, "--confirm", "--json"]);
  assert.equal(removed.ok, true);
  assert.equal(removed.data.include_state, false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "current")), true);

  const stateRemovedRoot = tempRoot();
  await runInstallCommand(["--root", stateRemovedRoot, "--json"]);
  const stateRemoved = await runUninstallCommand(["--root", stateRemovedRoot, "--include-state", "--confirm", "--json"]);
  assert.equal(stateRemoved.data.include_state, true);
  assert.equal(fs.existsSync(path.join(stateRemovedRoot, ".opennori")), false);
});

test("upgrade command module preserves preview and install-required safety", { tags: ["cli", "lifecycle"] }, async () => {
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
