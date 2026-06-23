import assert from "node:assert/strict";
import { test } from "vitest";
import {
  parseCodexMarketplaceRoot,
  parseInstalledCodexPluginVersion,
  sameResolvedPath
} from "../src/lifecycle/adapters/codex-plugin.ts";
import { parseGlobalNpmPackageVersion } from "../src/lifecycle/adapters/npm-global.ts";

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
