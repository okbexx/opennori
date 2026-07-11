import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { completeTask, holdLock, initializeProject, runCli, taskLockTarget, temporaryProject } from "./support/fixture.mjs";

const { doctorProject } = await import("../dist/src/doctor.js");
const { planManifestRepair, planUpdate, repairProjectManifest, updateProject } = await import("../dist/src/lifecycle.js");
const { applyStateMigration, planStateMigration } = await import("../dist/src/migration.js");

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function downgradeTask(filePath) {
  const task = JSON.parse(fs.readFileSync(filePath, "utf8"));
  task.schema_version = "opennori/task-v1";
  delete task.delivery_required;
  writeJson(filePath, task);
}

function downgradeManifest(root) {
  const filePath = path.join(root, ".opennori/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(filePath, "utf8"));
  manifest.state_schema_version = 1;
  writeJson(filePath, manifest);
  return filePath;
}

test("update previews and migrates active and archived task state without rewriting product knowledge", (t) => {
  const root = temporaryProject(t, "opennori-migration-");
  const session = "migration-session";
  initializeProject(root);
  const active = runCli(root, ["task", "create", "--title", "Active legacy task", "--slug", "legacy-active"], { session }).data.task.id;
  const completed = completeTask(root, "legacy-completed", session).taskId;
  runCli(
    root,
    [
      "task",
      "archive",
      completed,
      "--summary",
      "Legacy task completed",
      "--knowledge",
      "none",
      "--knowledge-summary",
      "No stable knowledge"
    ],
    { session }
  );
  const activePath = path.join(root, ".opennori/tasks", active, "task.json");
  const archivedPath = fs
    .readdirSync(path.join(root, ".opennori/tasks/archive"), { recursive: true })
    .map((entry) => path.join(root, ".opennori/tasks/archive", String(entry)))
    .find((entry) => entry.endsWith(`${completed}/task.json`));
  assert.ok(archivedPath);
  downgradeTask(activePath);
  downgradeTask(archivedPath);
  const researchBackup = path.join(root, ".opennori/tasks", active, "research/task.json");
  fs.writeFileSync(researchBackup, '{"schema_version":"research-only"}\n');
  downgradeManifest(root);
  const specBefore = fs.readFileSync(path.join(root, ".opennori/spec/project.md"));
  const journalBefore = fs.readFileSync(path.join(root, ".opennori/workspace/probe/journal.md"));

  const preview = planUpdate(root);
  assert.equal(preview.state_migration.from_version, 1);
  assert.equal(preview.state_migration.to_version, 2);
  assert.deepEqual(preview.state_migration.task_files.sort(), [
    path.relative(root, activePath),
    path.relative(root, archivedPath)
  ].sort());
  const diagnosis = doctorProject(root);
  assert.equal(diagnosis.checks.find((check) => check.id === "project.state-schema").ok, false);
  assert.notEqual(diagnosis.status, "broken");

  const updated = updateProject(root, { confirm: true });
  assert.equal(updated.manifest.state_schema_version, 2);
  assert.equal(JSON.parse(fs.readFileSync(activePath, "utf8")).delivery_required, true);
  assert.equal(JSON.parse(fs.readFileSync(archivedPath, "utf8")).delivery_required, false);
  assert.equal(fs.readFileSync(path.join(root, ".opennori/spec/project.md")).equals(specBefore), true);
  assert.equal(fs.readFileSync(path.join(root, ".opennori/workspace/probe/journal.md")).equals(journalBefore), true);
  assert.equal(fs.readFileSync(researchBackup, "utf8"), '{"schema_version":"research-only"}\n');
  assert.equal(planUpdate(root).state_migration, null);
});

test("state migration restores every canonical byte after a mid-migration failure", (t) => {
  const root = temporaryProject(t, "opennori-migration-rollback-");
  const session = "migration-rollback-session";
  initializeProject(root);
  const ids = ["legacy-one", "legacy-two"].map(
    (slug) => runCli(root, ["task", "create", "--title", slug, "--slug", slug], { session }).data.task.id
  );
  const files = ids.map((id) => path.join(root, ".opennori/tasks", id, "task.json"));
  for (const file of files) downgradeTask(file);
  const manifestPath = downgradeManifest(root);
  const snapshots = new Map([manifestPath, ...files].map((file) => [file, fs.readFileSync(file)]));
  const plan = planStateMigration(root);

  assert.throws(
    () =>
      applyStateMigration(root, plan, {
        afterTaskWrite(_relativePath, index) {
          if (index === 0) throw new Error("injected migration failure");
        }
      }),
    /injected migration failure/
  );
  for (const [file, content] of snapshots) assert.equal(fs.readFileSync(file).equals(content), true, file);
  assert.equal(planStateMigration(root).task_files.length, 2);
});

test("state migration respects active task locks before changing canonical bytes", async (t) => {
  const root = temporaryProject(t, "opennori-migration-task-lock-");
  const session = "migration-task-lock-session";
  initializeProject(root);
  const taskId = runCli(root, ["task", "create", "--title", "Locked legacy task", "--slug", "locked-legacy"], {
    session
  }).data.task.id;
  const taskPath = path.join(root, ".opennori/tasks", taskId, "task.json");
  downgradeTask(taskPath);
  downgradeManifest(root);
  const taskBefore = fs.readFileSync(taskPath);
  const plan = planStateMigration(root);
  const holder = await holdLock(taskLockTarget(root, taskId), 500);

  assert.throws(
    () => applyStateMigration(root, plan),
    (error) => error.code === "state_busy"
  );
  assert.equal(fs.readFileSync(taskPath).equals(taskBefore), true);
  await holder.exited;
  assert.equal(applyStateMigration(root, plan).state_schema_version, 2);
});

test("manifest repair preserves the inferred legacy schema and refuses mixed task versions", (t) => {
  const legacyRoot = temporaryProject(t, "opennori-migration-repair-");
  const session = "migration-repair-session";
  initializeProject(legacyRoot);
  const legacyId = runCli(legacyRoot, ["task", "create", "--title", "Legacy repair", "--slug", "legacy-repair"], {
    session
  }).data.task.id;
  downgradeTask(path.join(legacyRoot, ".opennori/tasks", legacyId, "task.json"));
  fs.rmSync(path.join(legacyRoot, ".opennori/manifest.json"));

  const repaired = repairProjectManifest(legacyRoot, { confirm: true });
  assert.equal(repaired.manifest.state_schema_version, 1);
  assert.equal(
    runCli(legacyRoot, ["task", "create", "--title", "Blocked", "--slug", "blocked-before-migration"], {
      ok: false,
      session
    }).error.code,
    "state_migration_required"
  );
  assert.equal(updateProject(legacyRoot, { confirm: true }).manifest.state_schema_version, 2);

  const mixedRoot = temporaryProject(t, "opennori-migration-mixed-");
  initializeProject(mixedRoot);
  const ids = ["mixed-one", "mixed-two"].map(
    (slug) => runCli(mixedRoot, ["task", "create", "--title", slug, "--slug", slug], { session }).data.task.id
  );
  downgradeTask(path.join(mixedRoot, ".opennori/tasks", ids[0], "task.json"));
  fs.rmSync(path.join(mixedRoot, ".opennori/manifest.json"));
  const blocked = planManifestRepair(mixedRoot);
  assert.match(blocked.blockers.join(" "), /mixture of state schema 1 and 2/);
});

test("an older CLI refuses newer project state without labeling it corrupt", (t) => {
  const root = temporaryProject(t, "opennori-migration-newer-");
  initializeProject(root);
  const manifestPath = path.join(root, ".opennori/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.state_schema_version = 99;
  writeJson(manifestPath, manifest);

  const diagnosis = doctorProject(root);
  const stateCheck = diagnosis.checks.find((check) => check.id === "project.state-schema");
  assert.equal(stateCheck.ok, false);
  assert.match(stateCheck.message, /needs a newer OpenNori CLI/);
  assert.notEqual(diagnosis.status, "broken");
  assert.equal(
    runCli(root, ["task", "create", "--title", "Blocked", "--slug", "newer-state"], { ok: false }).error.code,
    "state_schema_newer"
  );
  assert.match(planUpdate(root).blockers.join(" "), /newer than this OpenNori CLI/);
});
