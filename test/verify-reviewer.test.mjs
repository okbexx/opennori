import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { repositoryRoot } from "./support/fixture.mjs";

const read = (relativePath) => fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");

test("Verify prefers one fresh Codex reviewer and falls back without creating another authority", () => {
  const skill = read("skills/nori-check/SKILL.md");
  const workflow = read("templates/workflow.md");
  const reference = read("docs/product-reference.md");
  const plugin = JSON.parse(read(".codex-plugin/plugin.json"));

  assert.match(skill, /OpenNori Verify reviewer/);
  assert.match(skill, /exactly one fresh host-native subagent by\ndefault\./);
  assert.match(skill, /must not spawn another\nreviewer or implementation worker/);
  assert.match(skill, /do not edit project files or `\.opennori\/`, append Evidence/);
  assert.match(skill, /reproduce command observations[\s\S]{0,40}`task evidence run`/);
  assert.match(skill, /A clean report\nor successful assignment never proves an Outcome/);
  assert.match(skill, /If native delegation is unavailable, continue with the primary agent's\nsequential verification/);
  assert.match(skill, /lacks reviewer\nindependence/);
  assert.match(skill, /When the platform is `claude`, verify sequentially/);
  assert.doesNotMatch(skill, /worker runtime|worker state/i);

  assert.match(workflow, /delegated reviewer must not spawn another reviewer, write Evidence/);
  assert.match(workflow, /If Codex cannot start the reviewer, the primary agent[\s\S]{0,40}continues sequentially/);
  assert.match(workflow, /Claude Code performs the check sequentially/);
  assert.match(reference, /If Codex cannot[\s\S]{0,120}continues sequentially/i);
  assert.match(plugin.interface.longDescription, /uses a fresh Codex reviewer by default/);
  assert.match(plugin.interface.longDescription, /falls back transparently when unavailable/);
  assert.match(plugin.interface.longDescription, /refuse completion while a required result is still missing/);
});
