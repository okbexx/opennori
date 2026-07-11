import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const taskApi = await import("../dist/src/public/task.js");
const projectApi = await import("../dist/src/public/project.js");
const memoryApi = await import("../dist/src/public/memory.js");
const testingApi = await import("../dist/src/public/testing.js");

test("public subpaths expose stable domain boundaries", () => {
  for (const api of [taskApi, projectApi, memoryApi, testingApi]) {
    assert.equal(api.OPENNORI_API_VERSION, 1);
  }
  assert.equal(typeof taskApi.createTask, "function");
  assert.equal(typeof taskApi.runCommandEvidence, "function");
  assert.equal(taskApi.initProject, undefined);
  assert.equal(typeof projectApi.initProject, "function");
  assert.equal(projectApi.createTask, undefined);
  assert.equal(typeof memoryApi.codexSessionMemoryAdapter.search, "function");
  assert.equal(memoryApi.createTask, undefined);
  assert.equal(typeof testingApi.buildTaskRecord, "function");
  assert.equal(testingApi.createTask, undefined);
});

test("testing builders return schema-valid records and reject invalid overrides", () => {
  const task = testingApi.buildTaskRecord();
  const contract = testingApi.buildContract({ task_id: task.id });
  const evidence = testingApi.buildEvidenceRecord({ task_id: task.id, outcome_id: contract.outcomes[0].id });
  assert.equal(task.schema_version, "opennori/task-v2");
  assert.equal(contract.schema_version, "opennori/contract-v1");
  assert.equal(evidence.schema_version, "opennori/evidence-v1");
  assert.throws(
    () => testingApi.buildTaskRecord({ id: "not-a-task-id" }),
    (error) => error.code === "schema_invalid"
  );
  assert.throws(
    () => testingApi.buildContract({ status: "approved" }),
    (error) => error.code === "schema_invalid"
  );
});

test("recording host runners preserve calls and can be reset", () => {
  const args = ["status", "--short"];
  const recording = testingApi.createRecordingHostCommandRunner((call) => ({
    status: 0,
    stdout: `${call.command} ${call.args.join(" ")}`,
    stderr: ""
  }));
  const result = recording.runner("git", args, "/project");
  args.push("--branch");
  assert.equal(result.stdout, "git status --short");
  assert.deepEqual(recording.calls, [{ command: "git", args: ["status", "--short"], cwd: "/project" }]);
  recording.clear();
  assert.deepEqual(recording.calls, []);
});

test("temporary Git projects use the real Git CLI and clean up idempotently", () => {
  const project = testingApi.createTemporaryGitProject({ prefix: "opennori-public-api-" });
  assert.equal(project.runGit(["branch", "--show-current"]), "main");
  assert.equal(project.runGit(["config", "user.email"]), "opennori-test@example.invalid");
  const root = project.root;
  project.cleanup();
  project.cleanup();
  assert.equal(fs.existsSync(root), false);
});
