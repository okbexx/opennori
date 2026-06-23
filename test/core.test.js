import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { buildContractFromBrief, buildEvidenceLedger, validateContract } from "../src/core.ts";
import { run, tempRoot, skillBrief } from "./support/cli.js";

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
