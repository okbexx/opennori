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

function importSpecifiers(source) {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

function resolvesTo(filePath, specifier, targetPath) {
  if (!specifier.startsWith(".")) return false;
  return path.resolve(path.dirname(filePath), specifier) === targetPath;
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

test("lifecycle types stay split by domain with only a compatibility re-export", { tags: ["architecture", "unit", "quick"] }, () => {
  const lifecycleTypes = path.join(ROOT, "src", "types", "lifecycle.ts");
  const source = fs.readFileSync(lifecycleTypes, "utf8");
  assert.equal(source.split(/\r?\n/).filter((line) => line.trim().startsWith("export type")).length > 0, true);
  assert.equal(source.includes("export type {"), true);
  assert.equal(source.includes("import type"), false);
  assert.equal(source.includes("export type NoriResult ="), false);
  assert.equal(source.includes("export type Manifest ="), false);
  assert.equal(source.includes("export type DoctorState ="), false);

  const offenders = sourceFiles(path.join(ROOT, "src"))
    .concat(sourceFiles(path.join(ROOT, "test")))
    .filter((filePath) => relative(filePath) !== "src/types/lifecycle.ts")
    .filter((filePath) => importSpecifiers(fs.readFileSync(filePath, "utf8")).some((specifier) => /types\/lifecycle\.ts$/.test(specifier)))
    .map(relative);

  assert.deepEqual(offenders, []);
});

test("CLI entrypoint stays on the citty command tree boundary", { tags: ["architecture", "cli", "unit", "quick"] }, () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const cliSource = fs.readFileSync(path.join(ROOT, "src", "cli.ts"), "utf8");
  const commandTree = fs.readFileSync(path.join(ROOT, "src", "cli", "command-tree.ts"), "utf8");
  const registrySource = fs.readFileSync(path.join(ROOT, "src", "cli", "registry.ts"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(ROOT, "src", "cli", "runtime.ts"), "utf8");
  const activeGoalLockSource = fs.readFileSync(path.join(ROOT, "src", "cli", "active-goal-lock.ts"), "utf8");

  assert.equal(packageJson.dependencies.citty.startsWith("^"), true);
  assert.equal(fs.existsSync(path.join(ROOT, "src", "cli", "routes.ts")), false);
  assert.deepEqual(importSpecifiers(cliSource).filter((specifier) => /commands\//.test(specifier)), []);
  assert.equal(importSpecifiers(cliSource).includes("./cli/command-tree.ts"), true);
  assert.equal(importSpecifiers(commandTree).includes("./registry.ts"), true);
  assert.equal(importSpecifiers(commandTree).includes("./resolver.ts"), true);
  assert.equal(importSpecifiers(commandTree).includes("./runner.ts"), true);
  assert.match(registrySource, /defineCommand/);
  assert.match(runtimeSource, /active-goal-store\.ts/);
  assert.match(runtimeSource, /active-goal-lock\.ts/);
  assert.match(runtimeSource, /executor\.ts/);
  assert.match(activeGoalLockSource, /active-goal\.write\.lock/);
  assert.doesNotMatch(activeGoalLockSource, /readGoalPayload/);
});

test("MCP source stays read-only and does not register write tools", { tags: ["architecture", "unit"] }, () => {
  const mcpFiles = [
    path.join(ROOT, "src", "mcp.ts"),
    ...sourceFiles(path.join(ROOT, "src", "mcp"))
  ];
  const toolRegistrationOffenders = mcpFiles
    .filter((filePath) => /registerTool|CallTool|setRequestHandler/.test(fs.readFileSync(filePath, "utf8")))
    .map(relative);
  const writeBoundaryOffenders = mcpFiles
    .filter((filePath) => importSpecifiers(fs.readFileSync(filePath, "utf8"))
      .some((specifier) => (
        /commands\/(?:acceptance|architecture|evidence|profile|activity)/.test(specifier)
        || /(?:^|\/)\.\.\/core\.ts$/.test(specifier)
        || /(?:^|\/)\.\.\/lifecycle\.ts$/.test(specifier)
        || /kernel\/snapshot\.ts$/.test(specifier)
        || /kernel\/activity/.test(specifier)
        || /kernel\/events/.test(specifier)
      )))
    .map(relative);

  assert.deepEqual(toolRegistrationOffenders, []);
  assert.deepEqual(writeBoundaryOffenders, []);
  assert.deepEqual(mcpFiles
    .filter((filePath) => /writeFileSync|appendFileSync|rmSync|mkdirSync|renameSync|copyFileSync|refreshSnapshot|recordEvent|writeActivitySignal/.test(fs.readFileSync(filePath, "utf8")))
    .map(relative), []);
  assert.match(fs.readFileSync(path.join(ROOT, "src", "mcp", "server.ts"), "utf8"), /registerResource/);
  assert.match(fs.readFileSync(path.join(ROOT, "src", "mcp", "resources.ts"), "utf8"), /write_capability:\s*["']none["']/);
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

test("evidence commands use narrow state modules instead of wide barrels", { tags: ["architecture", "evidence", "cli", "unit", "quick"] }, () => {
  const forbiddenTargets = [
    path.join(ROOT, "src", "core.ts"),
    path.join(ROOT, "src", "lifecycle.ts")
  ];
  const offenders = sourceFiles(path.join(ROOT, "src", "cli", "commands", "evidence"))
    .filter((filePath) => {
      const specifiers = importSpecifiers(fs.readFileSync(filePath, "utf8"));
      return specifiers.some((specifier) => forbiddenTargets.some((target) => resolvesTo(filePath, specifier, target)));
    })
    .map(relative);

  assert.deepEqual(offenders, []);
});

test("setup and plugin sync command output parsing stays inside lifecycle adapters", { tags: ["architecture", "lifecycle", "unit"] }, () => {
  const allowed = new Set([
    path.join(ROOT, "src", "lifecycle", "adapters", "codex-plugin.ts"),
    path.join(ROOT, "src", "lifecycle", "adapters", "external-command-runner.ts"),
    path.join(ROOT, "src", "lifecycle", "adapters", "npm-global.ts"),
    path.join(ROOT, "src", "lifecycle", "external-actions.ts")
  ]);
  const outputParsingPattern = /result\.stdout|JSON\.parse\(stdout\)|stdout\.split\(|parseCodexMarketplaceRoot|parseInstalledCodexPluginVersion|parseGlobalNpmPackageVersion|child_process|spawnSync|codex plugin (?:marketplace )?list|npm ls -g/;
  const offenders = sourceFiles(path.join(ROOT, "src", "lifecycle"))
    .filter((filePath) => !allowed.has(filePath))
    .filter((filePath) => outputParsingPattern.test(fs.readFileSync(filePath, "utf8")))
    .map(relative);

  assert.deepEqual(offenders, []);

  const orchestrationFiles = [
    "setup-plan.ts",
    "setup-actions.ts",
    "setup-execution.ts",
    "plugin-sync-plan.ts",
    "plugin-sync-actions.ts",
    "plugin-sync-execution.ts"
  ].map((fileName) => path.join(ROOT, "src", "lifecycle", fileName));
  const wideCoreImportOffenders = orchestrationFiles
    .filter((filePath) => importSpecifiers(fs.readFileSync(filePath, "utf8")).some((specifier) => resolvesTo(filePath, specifier, path.join(ROOT, "src", "core.ts"))))
    .map(relative);

  assert.deepEqual(wideCoreImportOffenders, []);
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

  const stateReaders = [
    path.join(ROOT, "src", "core", "dossier.ts"),
    path.join(ROOT, "src", "cli", "active-goal-store.ts")
  ];
  const markdownReadOffenders = stateReaders
    .filter((filePath) => /readFileSync\([^)]*README\.md|readFileSync\([^)]*acceptancePath/.test(fs.readFileSync(filePath, "utf8")))
    .map(relative);
  assert.deepEqual(markdownReadOffenders, []);

  const activeGoalArgs = fs.readFileSync(path.join(ROOT, "src", "cli", "active-goal-args.ts"), "utf8");
  assert.match(activeGoalArgs, /dossier/);
  assert.match(activeGoalArgs, /Markdown is not parsed as state/);
  assert.match(activeGoalArgs, /Legacy generated goal README path used only to locate the dossier/);
});
