import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { ROOT } from "./support/cli.js";

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "dashboard") return [];
      return sourceFiles(fullPath);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

function relative(filePath) {
  return path.relative(ROOT, filePath);
}

test("source and tests import domain types instead of restoring a central type barrel", { tags: ["architecture", "unit", "quick"] }, () => {
  const publicTypeBarrel = path.join(ROOT, "src", "types.ts");
  assert.equal(fs.existsSync(publicTypeBarrel), false);
  const offenders = sourceFiles(path.join(ROOT, "src"))
    .filter((filePath) => !filePath.includes(`${path.sep}dashboard${path.sep}`))
    .filter((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");
      return [...source.matchAll(/from\s+["']([^"']*types\.ts)["']/g)]
        .some((match) => path.resolve(path.dirname(filePath), match[1]) === publicTypeBarrel);
    })
    .map(relative);

  assert.deepEqual(offenders, []);
});

test("MCP source stays read-only and does not register write tools", { tags: ["architecture", "unit"] }, () => {
  const mcpFiles = [
    path.join(ROOT, "src", "mcp.ts"),
    ...sourceFiles(path.join(ROOT, "src", "mcp"))
  ];
  const offenders = mcpFiles
    .filter((filePath) => /registerTool|CallTool|setRequestHandler/.test(fs.readFileSync(filePath, "utf8")))
    .map(relative);

  assert.deepEqual(offenders, []);
  assert.match(fs.readFileSync(path.join(ROOT, "src", "mcp", "server.ts"), "utf8"), /registerResource/);
  assert.match(fs.readFileSync(path.join(ROOT, "src", "mcp", "resources.ts"), "utf8"), /tools:\s*\[\]/);
});

test("MCP CLI startup stays behind command registry policy", { tags: ["architecture", "cli", "unit"] }, () => {
  const cliEntrypoint = fs.readFileSync(path.join(ROOT, "src", "cli.ts"), "utf8");
  const registry = fs.readFileSync(path.join(ROOT, "src", "cli", "registry.ts"), "utf8");
  const mcpCommand = fs.readFileSync(path.join(ROOT, "src", "cli", "commands", "mcp.ts"), "utf8");

  assert.equal(/command\s*={2,3}\s*["']mcp["']/.test(cliEntrypoint), false);
  assert.equal(cliEntrypoint.includes("serveOpenNoriMcpStdio"), false);
  assert.match(registry, /stdioServer:\s*true/);
  assert.match(mcpCommand, /serveOpenNoriMcpStdio/);
});

test("setup and plugin sync command output parsing stays inside lifecycle adapters", { tags: ["architecture", "lifecycle", "unit"] }, () => {
  const allowed = new Set([
    path.join(ROOT, "src", "lifecycle", "adapters", "codex-plugin.ts"),
    path.join(ROOT, "src", "lifecycle", "adapters", "external-command-runner.ts"),
    path.join(ROOT, "src", "lifecycle", "adapters", "npm-global.ts"),
    path.join(ROOT, "src", "lifecycle", "external-actions.ts")
  ]);
  const outputParsingPattern = /result\.stdout|JSON\.parse\(stdout\)|stdout\.split\(|parseCodexMarketplaceRoot|parseInstalledCodexPluginVersion|parseGlobalNpmPackageVersion/;
  const offenders = sourceFiles(path.join(ROOT, "src", "lifecycle"))
    .filter((filePath) => !allowed.has(filePath))
    .filter((filePath) => outputParsingPattern.test(fs.readFileSync(filePath, "utf8")))
    .map(relative);

  assert.deepEqual(offenders, []);
});

test("external action modeling does not own process execution infrastructure", { tags: ["architecture", "lifecycle", "unit", "quick"] }, () => {
  const actionModel = fs.readFileSync(path.join(ROOT, "src", "lifecycle", "external-actions.ts"), "utf8");
  const runnerAdapter = fs.readFileSync(path.join(ROOT, "src", "lifecycle", "adapters", "external-command-runner.ts"), "utf8");

  assert.equal(actionModel.includes("node:child_process"), false);
  assert.equal(actionModel.includes("spawnSync"), false);
  assert.equal(actionModel.includes("runExternalCommandAction"), false);
  assert.match(runnerAdapter, /node:child_process/);
  assert.match(runnerAdapter, /runExternalCommandAction/);
});

test("goal dossier Markdown stays a generated review surface, not a state import path", { tags: ["architecture", "acceptance", "unit", "quick"] }, () => {
  assert.equal(fs.existsSync(path.join(ROOT, "src", "core", "generated-acceptance-markdown.ts")), false);

  const forbiddenPattern = /parseGeneratedAcceptanceReviewMarkdown|ParsedGeneratedAcceptanceReviewMarkdown|fromMarkdown|markdownToContract|importMarkdown/;
  const offenders = sourceFiles(path.join(ROOT, "src"))
    .filter((filePath) => forbiddenPattern.test(fs.readFileSync(filePath, "utf8")))
    .map(relative);

  assert.deepEqual(offenders, []);

  const coreBarrel = fs.readFileSync(path.join(ROOT, "src", "core.ts"), "utf8");
  assert.equal(coreBarrel.includes("generated-acceptance-markdown"), false);
});
