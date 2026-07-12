import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  initializeProject,
  materializePublished0130Project,
  prepareApprovedTask,
  published0130Package,
  runCli,
  temporaryProject
} from "./support/fixture.mjs";

const { doctorProject } = await import("../dist/src/doctor.js");
const { contentHash } = await import("../dist/src/io.js");
const {
  addProjectPlatform,
  applyLifecyclePlan,
  initProject,
  planInit,
  planManifestRepair,
  planPlatformAdd,
  planUninstall,
  planUpdate,
  repairProjectManifest,
  uninstallProject,
  updateProject
} = await import("../dist/src/lifecycle.js");
const { projectAssets, readProjectConfig, renderProjectConfig } = await import("../dist/src/project.js");

function captureFailure(operation) {
  try {
    operation();
  } catch (error) {
    return error;
  }
  throw new Error("Expected operation to fail");
}

function assets(root) {
  return projectAssets(readProjectConfig(root));
}

function snapshotTree(directory) {
  const snapshots = new Map();
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const filePath = path.join(current, entry.name);
      if (entry.isDirectory()) visit(filePath);
      else snapshots.set(path.relative(directory, filePath), {
        content: fs.readFileSync(filePath),
        mode: fs.statSync(filePath).mode & 0o777
      });
    }
  };
  visit(directory);
  return snapshots;
}

test("the pinned published 0.1.30 project migrates offline with preview, rollback, retry, and Doctor recovery", (t) => {
  const root = temporaryProject(t, "opennori-published-upgrade-");
  const fixture = materializePublished0130Project(root);
  assert.deepEqual(fixture.package, published0130Package);
  const legacyRoot = path.join(root, ".opennori");
  const legacySnapshot = snapshotTree(legacyRoot);
  const agentsBefore = fs.readFileSync(path.join(root, "AGENTS.md"));
  const hooksBefore = new Map(
    fixture.generated_hooks.map((relativePath) => {
      const filePath = path.join(root, relativePath);
      return [relativePath, { content: fs.readFileSync(filePath), mode: fs.statSync(filePath).mode & 0o777 }];
    })
  );

  const before = doctorProject(root);
  assert.equal(before.status, "needs_action");
  const migrationCheck = before.checks.find((check) => check.id === "project.foundation-migration");
  assert.equal(migrationCheck.ok, false);
  assert.match(migrationCheck.recovery, /opennori init --user <name> --dry-run/);
  assert.equal(before.checks.some((check) => check.id === "project.manifest"), false);

  const preview = planInit(root, "Probe", "0.2.0-test");
  assert.deepEqual(snapshotTree(legacyRoot), legacySnapshot);
  assert.equal(fs.readdirSync(root).some((name) => name.startsWith(".opennori.backup-")), false);
  for (const hook of fixture.generated_hooks) {
    const action = preview.actions.find((entry) => entry.path === hook);
    assert.equal(action.type, "remove");
    assert.equal(action.destructive, true);
    assert.equal(fs.existsSync(path.join(root, hook)), true);
  }

  const config = { schema_version: "opennori/project-v1", developer: "Probe", platforms: ["codex"] };
  const failTarget = path.join(root, ".opennori/workflow.md");
  const originalRename = fs.renameSync;
  let injected = false;
  fs.renameSync = (source, target) => {
    if (!injected && path.resolve(String(target)) === failTarget) {
      injected = true;
      throw new Error("injected published migration failure");
    }
    return originalRename(source, target);
  };
  try {
    assert.throws(
      () => applyLifecyclePlan(preview, projectAssets(config), { confirm: true, productVersion: "0.2.0-test" }),
      /injected published migration failure/
    );
  } finally {
    fs.renameSync = originalRename;
  }
  assert.equal(injected, true);
  assert.deepEqual(snapshotTree(legacyRoot), legacySnapshot);
  assert.deepEqual(fs.readFileSync(path.join(root, "AGENTS.md")), agentsBefore);
  for (const hook of fixture.generated_hooks) {
    const filePath = path.join(root, hook);
    assert.deepEqual(fs.readFileSync(filePath), hooksBefore.get(hook).content);
    assert.equal(fs.statSync(filePath).mode & 0o777, hooksBefore.get(hook).mode);
  }
  assert.equal(fs.readdirSync(root).some((name) => name.startsWith(".opennori.backup-")), false);

  const migrated = initProject(root, { developer: "Probe", confirm: true, productVersion: "0.2.0-test" });
  assert.equal(migrated.applied, true);
  const backupName = fs.readdirSync(root).find((name) => name.startsWith(".opennori.backup-"));
  assert.ok(backupName);
  assert.deepEqual(snapshotTree(path.join(root, backupName)), legacySnapshot);
  for (const relativePath of fixture.user_files) {
    const legacyRelativePath = relativePath.replace(/^\.opennori\//, "");
    assert.deepEqual(
      fs.readFileSync(path.join(root, backupName, legacyRelativePath)),
      legacySnapshot.get(legacyRelativePath).content
    );
  }
  for (const hook of fixture.generated_hooks) assert.equal(fs.existsSync(path.join(root, hook)), false);
  assert.match(fs.readFileSync(path.join(root, "AGENTS.md"), "utf8"), /^Project-owned agent guidance\.\n/);
  assert.equal(fs.statSync(path.join(root, "AGENTS.md")).mode & 0o777, 0o600);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, ".opennori/manifest.json"), "utf8")).product_version, "0.2.0-test");

  const recovered = doctorProject(root);
  assert.equal(recovered.checks.some((check) => check.id === "project.foundation-migration"), false);
  for (const id of ["project.config", "project.manifest", "layout.spec", "layout.tasks", "layout.workspace", "layout.runtime"]) {
    assert.equal(recovered.checks.find((check) => check.id === id)?.ok, true, id);
  }
  const repeated = initProject(root, { developer: "Probe", confirm: true, productVersion: "0.2.0-test" });
  assert.equal(repeated.plan.actions.every((entry) => entry.type === "skip"), true);
  assert.deepEqual(snapshotTree(path.join(root, backupName)), legacySnapshot);
});

test("published migration blocks instead of deleting a locally changed legacy hook", (t) => {
  const root = temporaryProject(t, "opennori-published-upgrade-conflict-");
  materializePublished0130Project(root);
  const hookPath = path.join(root, ".codex/hooks.json");
  fs.appendFileSync(hookPath, "\nuser hook change\n");
  const before = fs.readFileSync(hookPath);
  const plan = planInit(root, "Probe", "0.2.0-test");
  assert.match(plan.blockers.join(" "), /\.codex\/hooks\.json has local changes/);
  assert.equal(plan.actions.find((entry) => entry.path === ".codex/hooks.json").type, "preserve");
  assert.throws(
    () => initProject(root, { developer: "Probe", confirm: true, productVersion: "0.2.0-test" }),
    (error) => error.code === "lifecycle_blocked"
  );
  assert.deepEqual(fs.readFileSync(hookPath), before);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, ".opennori/manifest.json"), "utf8")).opennori_version, "0.1.30");
});

test("lifecycle happy paths are repeatable and preserve project-owned content", (t) => {
  const root = temporaryProject(t, "opennori-lifecycle-happy-");
  const agentsPath = path.join(root, "AGENTS.md");
  fs.writeFileSync(agentsPath, "user content\n", { mode: 0o600 });
  const first = initProject(root, { developer: "Probe", confirm: true, productVersion: "one" });
  assert.equal(first.applied, true);
  assert.equal(fs.statSync(agentsPath).mode & 0o777, 0o600);
  const manifestPath = path.join(root, ".opennori/manifest.json");
  const initialManifest = fs.readFileSync(manifestPath);

  initProject(root, { developer: "Probe", confirm: true, productVersion: "one" });
  assert.deepEqual(fs.readFileSync(manifestPath), initialManifest);

  fs.rmSync(path.join(root, ".opennori/workflow.md"));
  fs.writeFileSync(agentsPath, "user content\n");
  fs.chmodSync(agentsPath, 0o600);
  updateProject(root, { confirm: true, productVersion: "two" });
  assert.equal(fs.existsSync(path.join(root, ".opennori/workflow.md")), true);
  assert.equal(fs.statSync(agentsPath).mode & 0o777, 0o600);
  assert.equal(JSON.parse(fs.readFileSync(manifestPath, "utf8")).product_version, "two");

  const healthy = fs.readFileSync(manifestPath);
  repairProjectManifest(root, { confirm: true, productVersion: "two" });
  assert.deepEqual(fs.readFileSync(manifestPath), healthy);

  fs.writeFileSync(path.join(root, ".opennori/tasks/user-task.txt"), "keep task data\n");
  fs.writeFileSync(path.join(root, ".opennori/spec/user-spec.md"), "keep spec data\n");
  uninstallProject(root, { confirm: true });
  assert.equal(fs.existsSync(manifestPath), false);
  assert.equal(fs.readFileSync(agentsPath, "utf8"), "user content\n");
  assert.equal(fs.statSync(agentsPath).mode & 0o777, 0o600);
  assert.equal(fs.readFileSync(path.join(root, ".opennori/tasks/user-task.txt"), "utf8"), "keep task data\n");
  assert.equal(fs.readFileSync(path.join(root, ".opennori/spec/user-spec.md"), "utf8"), "keep spec data\n");

  const repairedOwnership = repairProjectManifest(root, { confirm: true, productVersion: "three" });
  assert.equal(repairedOwnership.applied, true);
  const reactivated = updateProject(root, { confirm: true, productVersion: "three" });
  assert.equal(reactivated.applied, true);
  assert.equal(fs.existsSync(manifestPath), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori/workflow.md")), true);
  const reactivatedAgents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(reactivatedAgents, /^user content\n/);
  assert.equal(reactivatedAgents.split("<!-- OPENNORI:START -->").length - 1, 1);
  assert.equal(fs.readFileSync(path.join(root, ".opennori/tasks/user-task.txt"), "utf8"), "keep task data\n");
});

test("a platform adapter is previewed and added without replacing existing adapters or project config", (t) => {
  const root = temporaryProject(t, "opennori-platform-add-");
  const agentsPath = path.join(root, "AGENTS.md");
  fs.writeFileSync(agentsPath, "project agent rules\n");
  initProject(root, { developer: "Probe", confirm: true, productVersion: "one" });
  fs.mkdirSync(path.join(root, "packages/app"), { recursive: true });
  const configPath = path.join(root, ".opennori/config.yaml");
  fs.writeFileSync(
    configPath,
    renderProjectConfig({
      ...readProjectConfig(root),
      packages: { app: { path: "packages/app" } },
      default_package: "app"
    })
  );
  const manifestPath = path.join(root, ".opennori/manifest.json");
  const configBefore = fs.readFileSync(configPath);
  const manifestBefore = fs.readFileSync(manifestPath);
  const agentsBefore = fs.readFileSync(agentsPath);

  const preview = planPlatformAdd(root, "claude", "two");
  assert.equal(preview.operation, "platform-add");
  assert.equal(preview.blockers.length, 0);
  assert.equal(preview.actions.some((entry) => entry.asset_id.startsWith("codex.")), false);
  assert.equal(preview.actions.find((entry) => entry.asset_id === "core.project-config").type, "update");
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), false);
  assert.deepEqual(fs.readFileSync(configPath), configBefore);
  assert.deepEqual(fs.readFileSync(manifestPath), manifestBefore);

  const added = addProjectPlatform(root, "claude", { confirm: true, productVersion: "two" });
  assert.equal(added.applied, true);
  assert.deepEqual(readProjectConfig(root), {
    schema_version: "opennori/project-v1",
    developer: "Probe",
    platforms: ["codex", "claude"],
    packages: { app: { path: "packages/app" } },
    default_package: "app"
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(manifestPath, "utf8")).platforms, ["codex", "claude"]);
  assert.deepEqual(fs.readFileSync(agentsPath), agentsBefore);
  assert.match(fs.readFileSync(path.join(root, "CLAUDE.md"), "utf8"), /OPENNORI:CLAUDE:START/);
  assert.equal(fs.existsSync(path.join(root, ".claude")), false);

  const repeated = addProjectPlatform(root, "claude", { confirm: true, productVersion: "two" });
  assert.equal(repeated.applied, false);
  assert.equal(repeated.plan.actions.every((entry) => entry.type === "skip"), true);
});

test("platform addition refuses target adapter conflicts without changing canonical state", (t) => {
  const root = temporaryProject(t, "opennori-platform-add-conflict-");
  initProject(root, { developer: "Probe", confirm: true });
  const conflictPath = path.join(root, "CLAUDE.md");
  fs.writeFileSync(conflictPath, "<!-- OPENNORI:CLAUDE:START -->\nbroken managed section\n");
  const configPath = path.join(root, ".opennori/config.yaml");
  const manifestPath = path.join(root, ".opennori/manifest.json");
  const configBefore = fs.readFileSync(configPath);
  const manifestBefore = fs.readFileSync(manifestPath);

  const preview = planPlatformAdd(root, "claude");
  assert.match(preview.blockers.join(" "), /managed section markers are incomplete/i);
  const error = captureFailure(() => addProjectPlatform(root, "claude", { confirm: true }));
  assert.equal(error.code, "platform_add_blocked");
  assert.deepEqual(fs.readFileSync(configPath), configBefore);
  assert.deepEqual(fs.readFileSync(manifestPath), manifestBefore);
  assert.equal(fs.readFileSync(conflictPath, "utf8"), "<!-- OPENNORI:CLAUDE:START -->\nbroken managed section\n");
});

test("platform addition refuses an unowned project config before writing adapter assets", (t) => {
  const root = temporaryProject(t, "opennori-platform-add-unowned-config-");
  initProject(root, { developer: "Probe", confirm: true });
  const configPath = path.join(root, ".opennori/config.yaml");
  const manifestPath = path.join(root, ".opennori/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.assets = manifest.assets.filter((entry) => entry.asset_id !== "core.project-config");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const configBefore = fs.readFileSync(configPath);
  const manifestBefore = fs.readFileSync(manifestPath);

  const preview = planPlatformAdd(root, "claude");
  assert.match(preview.blockers.join(" "), /config.yaml: Install ownership does not match/i);
  const error = captureFailure(() => addProjectPlatform(root, "claude", { confirm: true }));
  assert.equal(error.code, "platform_add_blocked");
  assert.deepEqual(fs.readFileSync(configPath), configBefore);
  assert.deepEqual(fs.readFileSync(manifestPath), manifestBefore);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), false);
  assert.equal(fs.existsSync(path.join(root, ".claude")), false);
});

test("platform addition rolls back config, adapter files, and created directories when manifest persistence fails", (t) => {
  const root = temporaryProject(t, "opennori-platform-add-rollback-");
  initProject(root, { developer: "Probe", confirm: true });
  const configPath = path.join(root, ".opennori/config.yaml");
  const manifestPath = path.join(root, ".opennori/manifest.json");
  const configBefore = fs.readFileSync(configPath);
  const manifestBefore = fs.readFileSync(manifestPath);
  const originalRename = fs.renameSync;
  let injected = false;
  fs.renameSync = (source, target) => {
    if (!injected && path.resolve(String(target)) === manifestPath) {
      injected = true;
      throw new Error("injected platform manifest failure");
    }
    return originalRename(source, target);
  };
  try {
    assert.throws(() => addProjectPlatform(root, "claude", { confirm: true }), /injected platform manifest failure/);
  } finally {
    fs.renameSync = originalRename;
  }
  assert.equal(injected, true);
  assert.deepEqual(fs.readFileSync(configPath), configBefore);
  assert.deepEqual(fs.readFileSync(manifestPath), manifestBefore);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), false);
  assert.equal(fs.existsSync(path.join(root, ".claude")), false);
});

test("platform addition rejects a tampered or stale reviewed plan", (t) => {
  const root = temporaryProject(t, "opennori-platform-add-stale-");
  initProject(root, { developer: "Probe", confirm: true });
  const currentConfig = readProjectConfig(root);
  const targetAssets = projectAssets({ ...currentConfig, platforms: ["codex", "claude"] });
  const tampered = structuredClone(planPlatformAdd(root, "claude"));
  tampered.actions.find((entry) => entry.asset_id === "core.project-config").result_hash = contentHash("tampered");
  assert.throws(
    () => applyLifecyclePlan(tampered, targetAssets, { confirm: true }),
    (error) => error.code === "plan_stale"
  );

  const stale = planPlatformAdd(root, "claude");
  fs.appendFileSync(path.join(root, ".opennori/config.yaml"), "\n# concurrent project edit\n");
  assert.throws(
    () => applyLifecyclePlan(stale, targetAssets, { confirm: true }),
    (error) => error.code === "plan_stale"
  );
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), false);
});

test("managed update removes legacy Claude project Skill copies", (t) => {
  const root = temporaryProject(t, "opennori-legacy-claude-skills-");
  initProject(root, { developer: "Probe", platforms: ["claude"], confirm: true, productVersion: "one" });
  const skillPath = path.join(root, ".claude/skills/nori/SKILL.md");
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  const skill = fs.readFileSync(path.join(process.cwd(), "skills/nori/SKILL.md"), "utf8");
  fs.writeFileSync(skillPath, skill);
  const manifestPath = path.join(root, ".opennori/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.assets.push({
    asset_id: "claude.skill.nori",
    platform: "claude",
    path: ".claude/skills/nori/SKILL.md",
    scope: "file",
    policy: "managed",
    last_written_hash: contentHash(skill)
  });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const preview = planUpdate(root, "two");
  assert.equal(preview.actions.find((entry) => entry.asset_id === "claude.skill.nori").type, "remove");
  updateProject(root, { confirm: true, productVersion: "two" });
  assert.equal(fs.existsSync(skillPath), false);
  assert.match(fs.readFileSync(path.join(root, "CLAUDE.md"), "utf8"), /OPENNORI:CLAUDE:START/);
});

test("manifest repair reconstructs ownership without replacing project data", (t) => {
  const root = temporaryProject(t, "opennori-manifest-repair-");
  initProject(root, { developer: "Probe", confirm: true, productVersion: "one" });
  const sentinel = path.join(root, ".opennori/tasks/sentinel.txt");
  fs.writeFileSync(sentinel, "preserve me\n");
  fs.writeFileSync(path.join(root, ".opennori/manifest.json"), "{ invalid json\n");

  const plan = planManifestRepair(root, "two");
  assert.equal(plan.operation, "repair");
  const repaired = repairProjectManifest(root, { confirm: true, productVersion: "two" });
  assert.equal(repaired.applied, true);
  assert.equal(fs.readFileSync(sentinel, "utf8"), "preserve me\n");
  assert.equal(repaired.manifest.product_version, "two");
  assert.equal(fs.readdirSync(path.join(root, ".opennori")).some((name) => name.startsWith("manifest.json.backup-")), true);
});

test("manifest repair refuses to abandon assets from a directly changed platform", (t) => {
  const root = temporaryProject(t, "opennori-platform-migration-");
  initProject(root, { developer: "Probe", confirm: true });
  const configPath = path.join(root, ".opennori/config.yaml");
  const originalManifest = fs.readFileSync(path.join(root, ".opennori/manifest.json"));
  const originalRoute = fs.readFileSync(path.join(root, "AGENTS.md"));
  fs.writeFileSync(configPath, renderProjectConfig({ ...readProjectConfig(root), platforms: ["claude"] }));

  const plan = planManifestRepair(root);
  assert.equal(plan.blockers.length, 1);
  assert.match(plan.blockers[0], /platforms changed/i);
  const error = captureFailure(() => repairProjectManifest(root, { confirm: true }));
  assert.equal(error.code, "lifecycle_blocked");
  assert.deepEqual(fs.readFileSync(path.join(root, ".opennori/manifest.json")), originalManifest);
  assert.deepEqual(fs.readFileSync(path.join(root, "AGENTS.md")), originalRoute);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), false);

  const diagnosis = doctorProject(root);
  const platformCheck = diagnosis.checks.find((check) => check.id === "project.manifest.platforms");
  assert.equal(platformCheck.ok, false);
  assert.doesNotMatch(platformCheck.recovery, /repair-manifest/);
});

test("lifecycle plans reject missing, extra, duplicate, and tampered actions", (t) => {
  const root = temporaryProject(t, "opennori-lifecycle-plan-");
  initProject(root, { developer: "Probe", confirm: true, productVersion: "one" });
  fs.rmSync(path.join(root, ".opennori/workflow.md"));

  const missing = planUpdate(root, "two");
  missing.actions.splice(
    missing.actions.findIndex((entry) => entry.asset_id === "core.workflow"),
    1
  );
  assert.equal(captureFailure(() => applyLifecyclePlan(missing, assets(root), { confirm: true, productVersion: "two" })).code, "plan_invalid");

  const extra = planUpdate(root, "two");
  extra.actions.splice(-1, 0, {
    id: "update:extra",
    type: "skip",
    asset_id: "extra",
    path: "extra.txt",
    reason: "forged",
    destructive: false
  });
  assert.equal(captureFailure(() => applyLifecyclePlan(extra, assets(root), { confirm: true, productVersion: "two" })).code, "plan_invalid");

  const duplicate = planUpdate(root, "two");
  duplicate.actions.splice(-1, 0, { ...duplicate.actions[0] });
  assert.equal(captureFailure(() => applyLifecyclePlan(duplicate, assets(root), { confirm: true, productVersion: "two" })).code, "plan_invalid");

  updateProject(root, { confirm: true, productVersion: "two" });
  const tampered = planUpdate(root, "two");
  const workflow = tampered.actions.find((entry) => entry.asset_id === "core.workflow");
  assert.equal(workflow.type, "skip");
  workflow.type = "remove";
  workflow.destructive = true;
  assert.equal(captureFailure(() => applyLifecyclePlan(tampered, assets(root), { confirm: true, productVersion: "two" })).code, "plan_stale");
  assert.equal(fs.existsSync(path.join(root, ".opennori/workflow.md")), true);
});

test("invalid runtime state cannot be forged into a destructive uninstall action", (t) => {
  const root = temporaryProject(t, "opennori-lifecycle-runtime-");
  initProject(root, { developer: "Probe", confirm: true });
  const sessionId = "a".repeat(64);
  const relative = `.opennori/.runtime/sessions/${sessionId}.json`;
  const filePath = path.join(root, relative);
  fs.writeFileSync(filePath, "not an OpenNori session\n");
  const plan = planUninstall(root);
  const session = plan.actions.find((entry) => entry.asset_id === `core.runtime-session.${sessionId}`);
  assert.equal(session.type, "skip");
  session.type = "remove";
  session.destructive = true;
  session.expected_hash = contentHash("not an OpenNori session\n");

  const error = captureFailure(() => applyLifecyclePlan(plan, assets(root), { confirm: true }));
  assert.ok(error.code === "plan_stale" || error.code === "plan_invalid");
  assert.equal(fs.readFileSync(filePath, "utf8"), "not an OpenNori session\n");
});

test("obsolete ownership release fails closed if content appears after preview", (t) => {
  const root = temporaryProject(t, "opennori-obsolete-race-");
  initProject(root, { developer: "Probe", confirm: true, productVersion: "one" });
  const manifestPath = path.join(root, ".opennori/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.assets.push({
    ...manifest.assets.find((entry) => entry.asset_id === "core.workflow"),
    asset_id: "core.obsolete",
    path: ".opennori/obsolete.md"
  });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const plan = planUpdate(root, "two");
  assert.equal(plan.actions.find((entry) => entry.asset_id === "core.obsolete").type, "remove");

  const appeared = path.join(root, ".opennori/obsolete.md");
  fs.writeFileSync(appeared, "new user content\n");
  assert.equal(captureFailure(() => applyLifecyclePlan(plan, assets(root), { confirm: true, productVersion: "two" })).code, "plan_stale");
  assert.equal(fs.readFileSync(appeared, "utf8"), "new user content\n");

  fs.rmSync(appeared);
  updateProject(root, { confirm: true, productVersion: "two" });
  const updated = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(updated.assets.some((entry) => entry.asset_id === "core.obsolete"), false);
});

test("partial lifecycle writes roll back files and the ownership manifest", (t) => {
  const root = temporaryProject(t, "opennori-lifecycle-rollback-");
  initProject(root, { developer: "Probe", confirm: true });
  const manifestPath = path.join(root, ".opennori/manifest.json");
  const manifestBefore = fs.readFileSync(manifestPath, "utf8");
  const managedFiles = JSON.parse(manifestBefore).assets.filter((entry) => entry.policy === "managed" && entry.scope === "file").slice(0, 2);
  assert.equal(managedFiles.length, 2);
  for (const asset of managedFiles) fs.rmSync(path.join(root, asset.path));

  const plan = planUpdate(root);
  const writes = plan.actions.filter((entry) => entry.type === "create" || entry.type === "update");
  const failTarget = path.resolve(root, writes[1].path);
  const originalRename = fs.renameSync;
  let injected = false;
  fs.renameSync = (source, target) => {
    if (!injected && path.resolve(String(target)) === failTarget) {
      injected = true;
      throw new Error("injected lifecycle write failure");
    }
    return originalRename(source, target);
  };
  try {
    assert.throws(() => applyLifecyclePlan(plan, assets(root), { confirm: true }));
  } finally {
    fs.renameSync = originalRename;
  }

  assert.equal(injected, true);
  for (const asset of managedFiles) assert.equal(fs.existsSync(path.join(root, asset.path)), false);
  assert.equal(fs.readFileSync(manifestPath, "utf8"), manifestBefore);
});

test("lifecycle rollback restores the mode of a removed managed file", (t) => {
  const root = temporaryProject(t, "opennori-lifecycle-mode-rollback-");
  initProject(root, { developer: "Probe", confirm: true });
  const workflowPath = path.join(root, ".opennori/workflow.md");
  const manifestPath = path.join(root, ".opennori/manifest.json");
  const workflowBefore = fs.readFileSync(workflowPath);
  fs.chmodSync(workflowPath, 0o600);

  const plan = planUninstall(root);
  const originalRm = fs.rmSync;
  let injected = false;
  fs.rmSync = (target, options) => {
    if (!injected && path.resolve(String(target)) === manifestPath) {
      injected = true;
      throw new Error("injected manifest removal failure");
    }
    return originalRm(target, options);
  };
  try {
    assert.throws(() => applyLifecyclePlan(plan, assets(root), { confirm: true }));
  } finally {
    fs.rmSync = originalRm;
  }

  assert.equal(injected, true);
  assert.deepEqual(fs.readFileSync(workflowPath), workflowBefore);
  assert.equal(fs.statSync(workflowPath).mode & 0o777, 0o600);
  assert.equal(fs.existsSync(manifestPath), true);
});

test("lifecycle rollback preserves a concurrent replacement at a created path", (t) => {
  const root = temporaryProject(t, "opennori-lifecycle-concurrent-rollback-");
  initProject(root, { developer: "Probe", confirm: true });
  const workflowPath = path.join(root, ".opennori/workflow.md");
  const archiveMarkerPath = path.join(root, ".opennori/tasks/archive/.gitkeep");
  fs.rmSync(workflowPath);
  fs.rmSync(archiveMarkerPath);

  const plan = planUpdate(root);
  const writes = plan.actions.filter((entry) => entry.type === "create" || entry.type === "update");
  assert.equal(writes.length >= 2, true);
  const firstTarget = path.resolve(root, writes[0].path);
  const secondTarget = path.resolve(root, writes[1].path);
  const originalRename = fs.renameSync;
  let injected = false;
  fs.renameSync = (source, target) => {
    if (!injected && path.resolve(String(target)) === secondTarget) {
      injected = true;
      fs.rmSync(firstTarget, { force: true });
      fs.mkdirSync(firstTarget);
      fs.writeFileSync(path.join(firstTarget, "user.txt"), "concurrent user content\n");
      throw new Error("injected write failure after concurrent replacement");
    }
    return originalRename(source, target);
  };
  try {
    const error = captureFailure(() => applyLifecyclePlan(plan, assets(root), { confirm: true }));
    assert.equal(error.code, "lifecycle_rollback_failed");
  } finally {
    fs.renameSync = originalRename;
  }

  assert.equal(injected, true);
  assert.equal(fs.readFileSync(path.join(firstTarget, "user.txt"), "utf8"), "concurrent user content\n");
});

test("doctor reports corrupt Task, Contract, Evidence, and ownership state", (t) => {
  const root = temporaryProject(t, "opennori-doctor-canonical-");
  initializeProject(root);

  const corruptTask = runCli(root, ["task", "create", "--title", "Corrupt task", "--slug", "corrupt-task"]);
  fs.writeFileSync(path.join(corruptTask.data.directory, "task.json"), "{ invalid json\n");

  const corruptContract = prepareApprovedTask(root, "corrupt-contract", "doctor-contract-session");
  fs.writeFileSync(path.join(root, ".opennori/tasks", corruptContract.taskId, "contract.json"), "{ invalid json\n");

  const corruptEvidence = prepareApprovedTask(root, "corrupt-evidence", "doctor-evidence-session");
  runCli(root, ["task", "start", corruptEvidence.taskId], { session: "doctor-evidence-session" });
  runCli(root, ["task", "review", corruptEvidence.taskId], { session: "doctor-evidence-session" });
  fs.writeFileSync(path.join(root, ".opennori/tasks", corruptEvidence.taskId, "evidence.jsonl"), "{ invalid json\n");

  const manifestPath = path.join(root, ".opennori/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.assets.push({ ...manifest.assets[0] });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const diagnosis = doctorProject(root);
  assert.equal(diagnosis.status, "broken");
  const invalidChecks = diagnosis.checks.filter((check) => check.id.startsWith("task.invalid."));
  for (const taskId of [corruptTask.data.task.id, corruptContract.taskId, corruptEvidence.taskId]) {
    const check = invalidChecks.find((entry) => entry.id.includes(taskId));
    assert.equal(check.ok, false);
    assert.ok(check.recovery);
  }
  const ownership = diagnosis.checks.find((check) => check.id === "manifest.ownership");
  assert.equal(ownership.ok, false);
  assert.match(ownership.recovery, /repair-manifest/);
});
