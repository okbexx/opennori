import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { buildContractFromBrief, buildEvidenceLedger, validateContract } from "../src/core.ts";
import { ROOT, run, tempRoot, skillBrief } from "./support/cli.js";

test("command help is side-effect free", { tags: ["core", "unit", "quick"] }, () => {
  const root = tempRoot();
  const payload = run(["install", "--help", "--json", "--root", root]);

  assert.equal(payload.ok, true);
  assert.equal(payload.data.side_effect, "none");
  assert.match(payload.data.usage, /opennori install/);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);
});

test("contract integrity validation stays structural and does not hard-fail subjective process wording", { tags: ["core", "schema", "acceptance", "quick"] }, () => {
  const contract = buildContractFromBrief(skillBrief("Ship a contract boundary check"));
  const ledger = buildEvidenceLedger(contract);
  contract.plan = "Agent-private planning is not a Product AC.";
  contract.steps = ["Use a Skill to judge whether this is appropriate."];

  const issues = validateContract(contract, ledger);

  assert.equal(issues.some((issue) => issue.path === "plan"), false);
  assert.equal(issues.some((issue) => issue.path === "steps"), false);
});

test("CLI entrypoint delegates command dispatch to the citty command tree", { tags: ["core", "unit", "quick"] }, () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const cliSource = fs.readFileSync(path.join(ROOT, "src", "cli.ts"), "utf8");
  const commandTree = fs.readFileSync(path.join(ROOT, "src", "cli", "command-tree.ts"), "utf8");

  assert.equal(packageJson.dependencies.citty.startsWith("^"), true);
  assert.equal(fs.existsSync(path.join(ROOT, "src", "cli", "routes.ts")), false);
  assert.match(cliSource, /from "\.\/cli\/command-tree\.ts"/);
  assert.match(cliSource, /runCliCommand\(resolved\)/);
  assert.match(commandTree, /defineCommand/);
  assert.match(commandTree, /runCommand/);
  assert.match(commandTree, /subCommands/);
});
