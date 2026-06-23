import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { ROOT, CLI, PACKAGE_VERSION, run, tempRoot, draftArgsFromGoal, draftAndApprove, recordArchitectureRequirement, runInteractiveSetup } from "./support/cli.js";

test("published package uses built dist bin while local source bin remains available", { tags: ["lifecycle", "package"] }, () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.equal(packageJson.bin.opennori, "bin/opennori.js");
  assert.equal(packageJson.files.includes(".agents/plugins/"), true);
  assert.equal(packageJson.files.includes(".codex-plugin/"), false);
  assert.equal(packageJson.files.includes("skills/"), false);
  assert.equal(packageJson.files.includes("plugins/opennori/"), true);
  assert.equal(packageJson.files.includes("dashboard/"), true);
  assert.equal(packageJson.files.includes("bin/opennori.js"), true);
  assert.equal(packageJson.files.includes("bin/"), false);
  assert.equal(fs.existsSync(path.join(ROOT, "bin", "opennori.js")), true);
  assert.equal(fs.existsSync(path.join(ROOT, "bin", "opennori.ts")), true);
  assert.equal(fs.readFileSync(path.join(ROOT, "bin", "opennori.js"), "utf8").includes("process.features?.typescript"), true);
  assert.equal(fs.readFileSync(path.join(ROOT, "bin", "opennori.ts"), "utf8").includes("../src/cli.ts"), true);
});

test("built dist bin can report package-root Plugin Skill assets", { tags: ["lifecycle", "package"] }, () => {
  assert.equal(fs.existsSync(path.join(ROOT, "dist", "bin", "opennori.js")), true);

  const root = tempRoot();
  const payload = run(["install", "--root", root, "--json"], {
    cli: path.join(ROOT, "dist", "bin", "opennori.js")
  });
  assert.equal(payload.data.manifest.plugin.schema_version, "opennori/plugin-v1");
  assert.equal(payload.data.manifest.plugin.name, "opennori");
  assert.equal(payload.data.manifest.plugin.packaged, true);
  assert.equal(payload.data.manifest.plugin.marketplace_packaged, true);
  assert.equal(payload.data.manifest.plugin.marketplace_path, ".agents/plugins/marketplace.json");
  assert.equal(payload.data.manifest.plugin.marketplace_name, "opennori");
  assert.equal(payload.data.manifest.plugin.marketplace_plugin_path, "./plugins/opennori");
  assert.equal(payload.data.manifest.plugin.manifest_path, "plugins/opennori/.codex-plugin/plugin.json");
  assert.equal(payload.data.manifest.plugin.skills_path, "plugins/opennori/skills");
  assert.equal(payload.data.manifest.plugin.skill_count, 11);
  assert.equal(payload.data.manifest.plugin.skills.some((skill) => skill.name === "nori"), true);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
});

test("built dist bin runs when invoked through a package-manager symlink", { tags: ["lifecycle", "package"] }, () => {
  assert.equal(fs.existsSync(path.join(ROOT, "dist", "bin", "opennori.js")), true);

  const root = tempRoot();
  const binDir = path.join(root, "node_modules", ".bin");
  fs.mkdirSync(binDir, { recursive: true });
  const linkedBin = path.join(binDir, "opennori");
  fs.symlinkSync(path.join(ROOT, "dist", "bin", "opennori.js"), linkedBin);

  const result = spawnSync(process.execPath, [linkedBin, "--help"], {
    cwd: root,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /OpenNori/);
  assert.match(result.stdout, /Usage: opennori/);
  assert.doesNotMatch(result.stdout.trimStart(), /^\{/);

  const jsonResult = spawnSync(process.execPath, [linkedBin, "--help", "--json"], {
    cwd: root,
    encoding: "utf8"
  });
  assert.equal(jsonResult.status, 0, jsonResult.stderr || jsonResult.stdout);
  const payload = JSON.parse(jsonResult.stdout);
  assert.equal(payload.ok, true);
  assert.match(payload.data.usage, /opennori/);
});

test("opennori quickstart previews setup without requiring install flags", { tags: ["lifecycle"] }, () => {
  const root = tempRoot();
  const preview = run([], { cwd: root });

  assert.equal(preview.ok, true);
  assert.equal(preview.data.status, "needs_confirm");
  assert.equal(preview.data.setup_plan.schema_version, "opennori/setup-plan-v1");
  assert.equal(preview.data.setup_plan.dry_run, true);
  assert.equal("requested_skill" in preview.data.setup_plan, false);
  assert.equal(preview.data.setup_plan.summary.would_write > 0, true);
  assert.equal(preview.data.setup_plan.summary.will_write, 0);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);

  const confirmed = run(["init", "--root", root, "--confirm", "--json"]);
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.data.status, "installed");
  assert.equal(confirmed.data.install_plan.dry_run, false);
  assert.equal(confirmed.data.install_plan.summary.will_write > 0, true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), false);

  const ready = run([], { cwd: root });
  assert.equal(ready.data.status, "needs_confirm");
  assert.equal(ready.data.setup_plan.actions.some((action) => action.id === "project_state" && action.command_display === "opennori init"), true);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
});

test("opennori quickstart accepts top-level json for agents", { tags: ["lifecycle"] }, () => {
  const root = tempRoot();
  const preview = run(["--json"], { cwd: root });

  assert.equal(preview.ok, true);
  assert.equal(preview.data.status, "needs_confirm");
  assert.equal(preview.data.setup_plan.schema_version, "opennori/setup-plan-v1");
  assert.equal(preview.data.setup_plan.summary.will_write, 0);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);
});

test("opennori quickstart is interactive for human terminals", { tags: ["lifecycle"] }, () => {
  const declinedRoot = tempRoot();
  const declined = runInteractiveSetup(declinedRoot, "n");

  assert.equal(declined.status, 0);
  assert.match(declined.stdout, /OpenNori setup preview/);
  assert.match(declined.stdout, /Bundle: Codex Plugin, packaged Skills, global opennori CLI, project \.opennori state, doctor/);
  assert.match(declined.stdout, /Install OpenNori capability bundle\? \[y\/N\]/);
  assert.match(declined.stdout, /No changes made/);
  assert.equal(fs.existsSync(path.join(declinedRoot, ".opennori")), false);
});

test("install creates project assets and skips existing user content by default", { tags: ["lifecycle"] }, () => {
  const root = tempRoot();
  const protocolPath = path.join(root, ".opennori", "protocol.md");
  fs.mkdirSync(path.dirname(protocolPath), { recursive: true });
  fs.writeFileSync(protocolPath, "custom protocol\n");

  const dryRun = run(["install", "--root", root, "--dry-run", "--json"]);
  assert.equal(dryRun.data.dry_run, true);
  assert.equal(dryRun.data.actions.find((action) => action.path === ".opennori/manifest.json").action, "create");
  assert.equal(dryRun.data.install_plan.schema_version, "opennori/install-plan-v1");
  assert.equal(dryRun.data.install_plan.summary.would_write > 0, true);
  assert.equal(dryRun.data.install_plan.summary.will_write, 0);
  assert.equal(dryRun.data.install_plan.actions.find((action) => action.path === ".opennori/protocol.md").kind, "protocol");
  assert.equal(dryRun.data.install_plan.actions.find((action) => action.path === ".opennori/protocol.md").will_write, false);
  assert.equal(dryRun.data.install_plan.actions.find((action) => action.path === ".opennori/protocol.md").would_write, false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), false);

  const payload = run(["install", "--root", root, "--json"]);
  assert.equal(payload.data.actions.find((action) => action.path === ".opennori/protocol.md").action, "skip");
  assert.equal(payload.data.actions.find((action) => action.path === ".opennori/manifest.json").action, "create");
  assert.equal(payload.data.install_plan.summary.will_write > 0, true);
  assert.equal(payload.data.actions.find((action) => action.path === ".opennori/manifest.json").kind, "manifest");
  assert.equal(payload.data.actions.find((action) => action.path === ".opennori/manifest.json").managed, true);
  assert.equal(payload.data.actions.find((action) => action.path === ".opennori/manifest.json").will_write, true);
  assert.equal(fs.readFileSync(protocolPath, "utf8"), "custom protocol\n");
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "current")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "drafts")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "brainstorms")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "profiles")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "challenges")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "decisions")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "agent-guide.md")), true);
  const agentGuide = fs.readFileSync(path.join(root, ".opennori", "agent-guide.md"), "utf8");
  assert.match(agentGuide, /Empty state directories are normal immediately after `opennori init`/);
  assert.match(agentGuide, /If `.opennori\/current\/<goal>\/README\.md` is missing, do not implement yet/);
  assert.match(agentGuide, /take over an AC discussion that already happened in chat/);
  assert.match(agentGuide, /Read `.opennori\/architecture\/baseline\.md` and `.opennori\/architecture\/baseline\.json` only when they exist/);
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), false);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), false);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);
  assert.equal(fs.existsSync(path.join(root, "process")), false);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "manifest.json"), "utf8"));
  assert.equal(manifest.schema_version, "opennori/manifest-v1");
  assert.equal(manifest.opennori_version, PACKAGE_VERSION);
  assert.equal(manifest.plugin.schema_version, "opennori/plugin-v1");
  assert.equal(manifest.plugin.name, "opennori");
  assert.equal(manifest.plugin.packaged, true);
  assert.equal(manifest.plugin.marketplace_packaged, true);
  assert.equal(manifest.plugin.marketplace_name, "opennori");
  assert.equal(manifest.plugin.marketplace_plugin_path, "./plugins/opennori");
  assert.equal(manifest.plugin.manifest_path, "plugins/opennori/.codex-plugin/plugin.json");
  assert.equal(manifest.plugin.skills_path, "plugins/opennori/skills");
  assert.equal(manifest.plugin.skill_count, 11);
  assert.equal(manifest.plugin.skills.some((skill) => skill.name === "nori-project-health"), true);
  assert.equal(manifest.managed_files.some((entry) => entry.path === ".opennori/protocol.md" && entry.exists), true);
  assert.equal(manifest.managed_files.some((entry) => entry.path.startsWith(".agents/skills")), false);
  assert.equal(manifest.managed_files.some((entry) => entry.path === ".opennori/architecture" && entry.exists), true);
  assert.equal(manifest.capabilities.includes("doctor"), true);
  assert.equal(manifest.capabilities.includes("codex-plugin"), true);
  assert.equal(manifest.capabilities.includes("opennori-skills"), true);
  assert.equal(manifest.capabilities.includes("architecture-baseline"), true);
  assert.equal(manifest.capabilities.includes("build-vs-buy"), true);
  assert.equal(manifest.architecture.decision, "missing");
  assert.equal(manifest.architecture.agent_surface.guide.installed, true);

  const forced = run(["install", "--root", root, "--force", "--dry-run", "--json"]);
  const protocolAction = forced.data.install_plan.actions.find((action) => action.path === ".opennori/protocol.md");
  assert.equal(protocolAction.action, "overwrite");
  assert.equal(protocolAction.destructive, true);
  assert.equal(forced.data.install_plan.summary.destructive > 0, true);
  assert.equal(forced.data.install_plan.summary.will_write, 0);

  const unconfirmed = spawnSync(process.execPath, [CLI, "install", "--root", root, "--force", "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(unconfirmed.status, 1);
  const unconfirmedPayload = JSON.parse(unconfirmed.stdout);
  assert.equal(unconfirmedPayload.error.type, "confirm_required");
  assert.match(unconfirmedPayload.error.fix, /--dry-run --force/);

  const confirmed = run(["install", "--root", root, "--force", "--confirm", "--json"]);
  assert.equal(confirmed.data.confirmed, true);
  assert.equal(confirmed.data.install_plan.summary.destructive > 0, true);
  assert.equal(confirmed.data.install_plan.summary.will_write > 0, true);
});

test("install can explicitly merge optional project agent routes without installing Skills", { tags: ["lifecycle"] }, () => {
  const root = tempRoot();
  fs.writeFileSync(path.join(root, "AGENTS.md"), "# Existing Project Guide\n\nKeep this project-specific guidance.\n");
  run(["install", "--root", root, "--json"]);

  const dryRun = run([
    "install",
    "--root", root,
    "--merge-agent-route",
    "--dry-run",
    "--json"
  ]);
  assert.equal(dryRun.data.install_plan.merge_agent_route, true);
  assert.equal(dryRun.data.install_plan.summary.will_write, 0);
  assert.equal(dryRun.data.actions.find((action) => action.path === "AGENTS.md").action, "merge");
  assert.equal(dryRun.data.actions.some((action) => action.path.startsWith(".agents/skills")), false);

  const unconfirmed = spawnSync(process.execPath, [
    CLI,
    "install",
    "--root", root,
    "--merge-agent-route",
    "--json"
  ], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(unconfirmed.status, 1);
  assert.equal(JSON.parse(unconfirmed.stdout).error.type, "confirm_required");

  const installed = run([
    "install",
    "--root", root,
    "--merge-agent-route",
    "--confirm",
    "--json"
  ]);
  assert.equal(installed.data.confirmed, true);
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agents, /Keep this project-specific guidance/);
  assert.match(agents, /\.opennori\/architecture\/baseline\.md/);
  assert.match(agents, /opennori:agent-route:start/);
  assert.equal(fs.existsSync(path.join(root, ".agents", "skills", "nori", "SKILL.md")), false);
  const doctor = run(["doctor", "--root", root, "--json"]);
  assert.equal(doctor.data.status, "ready");
  assert.equal(doctor.data.plugin.packaged, true);
  assert.equal(doctor.data.architecture.agent_surface.agents.references_baseline, true);
});

test("doctor reports ready, needs-action, and broken project health", { tags: ["lifecycle"] }, () => {
  const readyRoot = tempRoot();
  run(["install", "--root", readyRoot, "--json"]);
  const ready = run(["doctor", "--root", readyRoot, "--json"]);
  assert.equal(ready.data.status, "ready");
  assert.equal(ready.data.checks.every((check) => check.ok), true);
  assert.equal(ready.data.plugin.packaged, true);
  assert.equal(ready.data.plugin.marketplace_packaged, true);
  assert.equal(ready.data.plugin.skill_count, 11);
  assert.equal(ready.data.checks.find((check) => check.name === "plugin_manifest").ok, true);
  assert.equal(ready.data.checks.find((check) => check.name === "plugin_marketplace").ok, true);
  assert.equal(ready.data.checks.find((check) => check.name === "plugin_skills").ok, true);
  assert.equal(ready.data.architecture.decision, "missing");
  assert.equal(ready.data.checks.find((check) => check.name === "architecture_baseline").ok, true);

  const nonTrivial = draftAndApprove(draftArgsFromGoal(readyRoot, "Ship a non-trivial architecture-aware goal"));
  const unknownRequirement = run(["doctor", "--root", readyRoot, "--json"]);
  assert.equal(unknownRequirement.data.checks.find((check) => check.name === "architecture_baseline").ok, true);
  assert.equal(unknownRequirement.data.architecture.requirement.status, "unknown");
  recordArchitectureRequirement(
    readyRoot,
    nonTrivial.data.goal_id,
    "required",
    "This fixture marks the goal as non-trivial after agent review."
  );
  const needsBaseline = run(["doctor", "--root", readyRoot, "--json"]);
  assert.equal(needsBaseline.data.status, "needs-action");
  assert.equal(needsBaseline.data.checks.find((check) => check.name === "architecture_baseline").ok, false);
  assert.match(needsBaseline.data.checks.find((check) => check.name === "architecture_baseline").recovery, /opennori architecture baseline/);

  run([
    "architecture", "baseline",
    "--root", readyRoot,
    "--goal", "Ship a non-trivial architecture-aware goal",
    "--goal-id", "ship-a-non-trivial-architecture-aware-goal",
    "--confirm",
    "--json"
  ]);
  const readyAgain = run(["doctor", "--root", readyRoot, "--json"]);
  assert.equal(readyAgain.data.status, "ready");
  assert.equal(readyAgain.data.architecture.decision, "valid");

  const missingManifestRoot = tempRoot();
  run(["install", "--root", missingManifestRoot, "--json"]);
  fs.unlinkSync(path.join(missingManifestRoot, ".opennori", "manifest.json"));
  const needsAction = run(["doctor", "--root", missingManifestRoot, "--json"]);
  assert.equal(needsAction.data.status, "needs-action");
  assert.equal(needsAction.data.checks.find((check) => check.name === "manifest_file").ok, false);
  assert.match(needsAction.data.checks.find((check) => check.name === "manifest_file").recovery, /opennori init/);
  assert.equal(needsAction.data.recovery_actions.some((action) => action.check === "manifest_file" && /opennori init/.test(action.action)), true);

  const staleManifestRoot = tempRoot();
  run(["install", "--root", staleManifestRoot, "--json"]);
  const manifestPath = path.join(staleManifestRoot, ".opennori", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.opennori_version = "0.0.0";
  manifest.capabilities = ["acceptance-contract"];
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const stale = run(["doctor", "--root", staleManifestRoot, "--json"]);
  assert.equal(stale.data.status, "needs-action");
  assert.equal(stale.data.checks.find((check) => check.name === "manifest_schema").ok, true);
  assert.equal(stale.data.checks.find((check) => check.name === "manifest_cli_version").ok, false);
  assert.equal(stale.data.checks.find((check) => check.name === "manifest_capabilities").ok, false);
  assert.equal(stale.data.recovery_actions.some((action) => action.check === "manifest_cli_version" && /Refresh the manifest/.test(action.action)), true);
  assert.equal(stale.data.recovery_actions.some((action) => action.check === "manifest_capabilities" && /Refresh the manifest/.test(action.action)), true);

  const invalidManifestRoot = tempRoot();
  run(["install", "--root", invalidManifestRoot, "--json"]);
  const invalidManifestPath = path.join(invalidManifestRoot, ".opennori", "manifest.json");
  const invalidManifest = JSON.parse(fs.readFileSync(invalidManifestPath, "utf8"));
  delete invalidManifest.managed_files;
  fs.writeFileSync(invalidManifestPath, `${JSON.stringify(invalidManifest, null, 2)}\n`);
  const invalidManifestDoctor = run(["doctor", "--root", invalidManifestRoot, "--json"]);
  assert.equal(invalidManifestDoctor.data.status, "broken");
  assert.equal(invalidManifestDoctor.data.checks.find((check) => check.name === "manifest_schema").ok, false);
  assert.equal(invalidManifestDoctor.data.recovery_actions.some((action) => action.check === "manifest_schema"), true);

  const brokenRoot = tempRoot();
  run(["install", "--root", brokenRoot, "--json"]);
  fs.writeFileSync(path.join(brokenRoot, ".opennori", "current", "broken.evidence.json"), "{ bad json");
  const broken = run(["doctor", "--root", brokenRoot, "--json"]);
  assert.equal(broken.data.status, "broken");
  assert.equal(broken.data.checks.find((check) => check.name === "current_goal_recoverable").ok, false);
  assert.equal(broken.data.active_goal_issues.length, 2);
  assert.match(broken.data.checks.find((check) => check.name === "current_goal_recoverable").recovery, /Inspect active_goal_issues/);
  assert.equal(broken.data.recovery_actions.some((action) => action.check === "current_goal_recoverable" && /opennori\/current/.test(action.action)), true);
  assert.equal(broken.data.recovery_actions.some((action) => action.check === "active_goal_issue" && action.goal_id === "broken" && /broken\.evidence\.json/.test(action.action)), true);
  assert.equal(broken.data.active_goal_issues.some((issue) => /legacy flat goal state/.test(issue.message)), true);

  const schemaBrokenRoot = tempRoot();
  const schemaBroken = draftAndApprove(draftArgsFromGoal(schemaBrokenRoot, "Ship schema validation diagnostics"));
  const evidencePath = schemaBroken.data.evidence_path;
  const evidencePayload = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  delete evidencePayload.criteria;
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidencePayload, null, 2)}\n`);
  const schemaBrokenDoctor = run(["doctor", "--root", schemaBrokenRoot, "--json"]);
  assert.equal(schemaBrokenDoctor.data.status, "broken");
  assert.equal(schemaBrokenDoctor.data.active_goal_issues.some((issue) => issue.path?.startsWith("schema/ledger")), true);
});

test("uninstall previews removals and preserves OpenNori state by default", { tags: ["lifecycle"] }, () => {
  const root = tempRoot();
  const init = draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);
  run(["install", "--root", root, "--json"]);
  run(["report", "--root", root, "--json"]);

  const dryRun = run(["uninstall", "--root", root, "--dry-run", "--json"]);
  assert.equal(dryRun.data.uninstall_plan.schema_version, "opennori/uninstall-plan-v1");
  assert.equal(dryRun.data.uninstall_plan.summary.will_write, 0);
  assert.equal(dryRun.data.uninstall_plan.actions.filter((action) => action.kind === "skill").length, 0);
  assert.equal(dryRun.data.uninstall_plan.actions.find((action) => action.path === ".opennori/current").action, "preserve");
  assert.equal(dryRun.data.uninstall_plan.actions.find((action) => action.path === ".opennori/architecture").action, "preserve");
  assert.equal(dryRun.data.uninstall_plan.actions.find((action) => action.path === ".opennori/manifest.json").action, "delete");
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);

  const unconfirmed = spawnSync(process.execPath, [CLI, "uninstall", "--root", root, "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(unconfirmed.status, 1);
  assert.equal(JSON.parse(unconfirmed.stdout).error.type, "confirm_required");

  const removed = run(["uninstall", "--root", root, "--confirm", "--json"]);
  assert.equal(removed.data.confirmed, true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), false);
  assert.equal(fs.existsSync(init.data.acceptance_path), true);
  assert.equal(fs.existsSync(init.data.evidence_path), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture")), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "reports", "opennori-self.report.md")), true);
});

test("uninstall include-state requires confirmation before removing OpenNori state", { tags: ["lifecycle"] }, () => {
  const root = tempRoot();
  run(["draft", "--brief", "examples/opennori-self.json", "--root", root, "--json"]);
  run(["install", "--root", root, "--json"]);

  const dryRun = run(["uninstall", "--root", root, "--include-state", "--dry-run", "--json"]);
  const stateAction = dryRun.data.uninstall_plan.actions.find((action) => action.path === ".opennori");
  assert.equal(stateAction.action, "delete-tree");
  assert.equal(stateAction.recursive, true);
  assert.equal(stateAction.destructive, true);
  assert.equal(dryRun.data.uninstall_plan.summary.will_write, 0);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), true);

  const unconfirmed = spawnSync(process.execPath, [CLI, "uninstall", "--root", root, "--include-state", "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(unconfirmed.status, 1);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), true);

  const removed = run(["uninstall", "--root", root, "--include-state", "--confirm", "--json"]);
  assert.equal(removed.data.include_state, true);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);
});

test("upgrade previews and confirms manifest protocol and generated guidance refresh", { tags: ["lifecycle"] }, () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  fs.writeFileSync(path.join(root, ".opennori", "protocol.md"), "old protocol\n");
  const manifestPath = path.join(root, ".opennori", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.opennori_version = "0.0.0";
  manifest.capabilities = ["acceptance-contract"];
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const dryRun = run(["upgrade", "--root", root, "--dry-run", "--json"]);
  assert.equal(dryRun.data.upgrade_plan.schema_version, "opennori/upgrade-plan-v1");
  assert.equal(dryRun.data.upgrade_plan.summary.would_write > 0, true);
  assert.equal(dryRun.data.upgrade_plan.summary.will_write, 0);
  assert.equal(dryRun.data.upgrade_plan.actions.find((action) => action.path === ".opennori/manifest.json").action, "update");
  assert.equal(dryRun.data.upgrade_plan.actions.find((action) => action.path === ".opennori/protocol.md").action, "overwrite");
  assert.equal(dryRun.data.upgrade_plan.actions.some((action) => action.path.startsWith(".agents/skills")), false);
  assert.equal(fs.readFileSync(path.join(root, ".opennori", "protocol.md"), "utf8"), "old protocol\n");

  const unconfirmed = spawnSync(process.execPath, [CLI, "upgrade", "--root", root, "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(unconfirmed.status, 1);
  assert.equal(JSON.parse(unconfirmed.stdout).error.type, "confirm_required");

  const upgraded = run(["upgrade", "--root", root, "--confirm", "--json"]);
  assert.equal(upgraded.data.confirmed, true);
  assert.match(fs.readFileSync(path.join(root, ".opennori", "protocol.md"), "utf8"), /OpenNori Protocol/);
  const refreshedManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(refreshedManifest.opennori_version, PACKAGE_VERSION);
  assert.equal(refreshedManifest.plugin.packaged, true);
  assert.equal(refreshedManifest.capabilities.includes("upgrade"), true);
  assert.equal(refreshedManifest.capabilities.includes("context-export"), true);
  assert.equal(upgraded.next_actions.some((action) => /opennori check/.test(action)), true);
});
