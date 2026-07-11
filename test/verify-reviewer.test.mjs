import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { repositoryRoot } from "./support/fixture.mjs";

const read = (relativePath) => fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");

test("Verify defaults to one fresh Codex reviewer without creating another authority", () => {
  const skill = read("skills/nori-check/SKILL.md");
  const workflow = read("templates/workflow.md");
  const reference = read("docs/product-reference.md");
  const plugin = JSON.parse(read(".codex-plugin/plugin.json"));

  assert.match(skill, /OpenNori Verify reviewer/);
  assert.match(skill, /exactly one fresh host-native subagent by\ndefault\./);
  assert.match(skill, /must not spawn another\nreviewer or implementation worker/);
  assert.match(skill, /do not edit project files or `\.opennori\/`, append Evidence/);
  assert.match(skill, /reproduce command observations\nthrough `task evidence run`/);
  assert.match(skill, /A stopped reviewer, a clean report, or a successful assignment\nnever proves an Outcome/);
  assert.match(skill, /When the platform is `claude`, verify sequentially/);
  assert.match(skill, /Do not call coordination commands/);

  assert.match(workflow, /delegated reviewer must\nnot spawn another reviewer, write Evidence/);
  assert.match(workflow, /Claude Code\nperforms the same check sequentially/);
  assert.match(reference, /Fresh host-native Verify reviewer \| default \| sequential fallback/);
  assert.match(plugin.interface.longDescription, /uses a fresh Codex reviewer by default/);
  assert.match(plugin.interface.longDescription, /refuses completion while a required result is still missing/);
});
