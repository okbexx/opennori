import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import {
  parseCodexMarketplaceRoot,
  parseInstalledCodexPluginVersion,
  sameResolvedPath
} from "../src/lifecycle/adapters/codex-plugin.ts";
import { parseGlobalNpmPackageVersion } from "../src/lifecycle/adapters/npm-global.ts";
import { inspectSkillCapability } from "../src/lifecycle/adapters/skill-capability.ts";

test("codex plugin adapter parses marketplace roots and plugin versions", { tags: ["lifecycle", "unit"] }, () => {
  const marketplaceList = [
    "MARKETPLACE             ROOT",
    "openai-bundled          /tmp/openai",
    "opennori                /Users/jarl/code/jarlone/opennori"
  ].join("\n");
  const pluginList = [
    "PLUGIN STATUS VERSION PATH",
    "opennori@opennori installed, enabled 0.1.10 /Users/jarl/code/jarlone/opennori"
  ].join("\n");

  assert.equal(parseCodexMarketplaceRoot(marketplaceList), "/Users/jarl/code/jarlone/opennori");
  assert.equal(parseInstalledCodexPluginVersion(pluginList), "0.1.10");
  assert.equal(parseInstalledCodexPluginVersion("PLUGIN STATUS VERSION PATH\n"), null);
  assert.equal(sameResolvedPath("/tmp/../tmp/opennori", "/tmp/opennori"), true);
});

test("codex plugin adapter keeps stdout format drift inside the adapter", { tags: ["lifecycle", "unit"] }, () => {
  assert.equal(
    parseInstalledCodexPluginVersion("opennori@opennori installed enabled 0.1.10 /tmp/opennori"),
    "0.1.10"
  );
  assert.equal(
    parseInstalledCodexPluginVersion("opennori@opennori    enabled, installed    0.1.10+codex.20260623   /tmp/opennori"),
    "0.1.10+codex.20260623"
  );
  assert.equal(
    parseInstalledCodexPluginVersion("opennori@opennori disabled 0.1.11 /tmp/opennori"),
    "0.1.11"
  );
  assert.equal(
    parseInstalledCodexPluginVersion("other@opennori installed, enabled 0.1.10 /tmp/opennori"),
    null
  );
});

test("npm global adapter parses package manager JSON without owning package semantics", { tags: ["lifecycle", "unit"] }, () => {
  assert.equal(
    parseGlobalNpmPackageVersion(JSON.stringify({ dependencies: { opennori: { version: "0.1.10" } } }), "opennori"),
    "0.1.10"
  );
  assert.equal(parseGlobalNpmPackageVersion("{not json", "opennori"), null);
  assert.equal(parseGlobalNpmPackageVersion(JSON.stringify({ dependencies: {} }), "opennori"), null);
});

test("skill capability adapter reports package, plugin cache, and user Skill sources", { tags: ["lifecycle", "unit", "profile"] }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nori-skill-source-"));
  const packageSkillsDir = path.join(root, "package-skills");
  const pluginCacheDir = path.join(root, "codex-cache");
  const homeDir = path.join(root, "home");

  const packageSkill = path.join(packageSkillsDir, "package-review", "SKILL.md");
  fs.mkdirSync(path.dirname(packageSkill), { recursive: true });
  fs.writeFileSync(packageSkill, "# package skill\n");
  const cachedSkill = path.join(pluginCacheDir, "opennori", "opennori", "0.1.10", "skills", "cached-review", "SKILL.md");
  fs.mkdirSync(path.dirname(cachedSkill), { recursive: true });
  fs.writeFileSync(cachedSkill, "# cached skill\n");
  const userSkill = path.join(homeDir, ".agents", "skills", "user-review", "SKILL.md");
  fs.mkdirSync(path.dirname(userSkill), { recursive: true });
  fs.writeFileSync(userSkill, "# user skill\n");

  const options = { homeDir, packageSkillsDir, pluginCacheDir };
  const packageResult = inspectSkillCapability("package-review", options);
  assert.equal(packageResult.found, true);
  assert.equal(packageResult.source_kind, "package-skill");
  assert.equal(packageResult.path, packageSkill);

  const cacheResult = inspectSkillCapability("cached-review", options);
  assert.equal(cacheResult.found, true);
  assert.equal(cacheResult.source_kind, "codex-plugin-cache");
  assert.equal(cacheResult.path, cachedSkill);

  const userResult = inspectSkillCapability("user-review", options);
  assert.equal(userResult.found, true);
  assert.equal(userResult.source_kind, "user-skill");
  assert.equal(userResult.path, userSkill);

  const missingResult = inspectSkillCapability("missing-review", options);
  assert.equal(missingResult.found, false);
  assert.equal(missingResult.path, null);
  assert.equal(missingResult.sources.some((source) => source.kind === "codex-plugin-cache" && source.exists === false), true);
});
