import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { tempRoot, runEvidenceAddCommand, runEvidencePruneCommand, addEvidence, buildEvidenceLedger, goalPaths, writeGoalDossier, writeJson } from "./support/command-fixtures.js";

test("evidence add command module records flexible reviewable sources", { tags: ["cli", "evidence", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Record reviewable evidence",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can review evidence for the completed behavior.",
        measurement: "Open the evidence report.",
        threshold: "I can see reviewable evidence."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  const architectureApplyPath = path.join(root, ".opennori", "architecture", "evidence", "module-ac-1-apply.json");
  fs.mkdirSync(path.dirname(architectureApplyPath), { recursive: true });
  writeJson(architectureApplyPath, {
    schema_version: "opennori/architecture-apply-v1",
    id: "module-ac-1-apply",
    goal_id: "module-goal",
    criterion_id: "AC-1",
    status: "aligned",
    baseline: { profile: "typescript-agent-state-cli", accepted_at: "2026-06-15T00:00:00.000Z" },
    summary: "AC-1 follows the module architecture baseline.",
    fit: "The evidence command stays inside the confirmed boundary.",
    implementation_focus: "Record evidence for AC-1.",
    created_at: "2026-06-15T00:00:00.000Z",
    next: "Use this apply record as architecture context when recording Product AC evidence."
  });
  writeGoalDossier(paths.goalDir, contract, ledger);

  const added = await runEvidenceAddCommand([
    "--criterion", "AC-1",
    "--kind", "agent-observation",
    "--basis", "tool-observation",
    "--summary", "The user-visible workflow can be reviewed.",
    "--architecture-apply", "module-ac-1-apply",
    "--source", "{\"type\":\"command\",\"label\":\"npm run check\",\"command\":\"npm run check\",\"outcome\":\"passed\"}",
    "--source", "screenshots/reviewable-flow.png",
    "--source-command", "npm run check",
    "--source-path", "src/cli.ts",
    "--source-url", "https://example.com/review",
    "--reviewability", "User can rerun the command or open the artifact.",
    "--limitations", "Browser-specific visual review was not performed.",
    "--confidence", "verified",
    "--result", "passing",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(added.ok, true);
  assert.equal(added.data.criterion_status, "passing");
  assert.equal(added.data.workflow_status, "complete");
  assert.equal(added.data.current_gap, null);
  assert.equal(added.data.next_recommendation.status, "completion-review-required");
  assert.equal(added.data.agent_next.state, "completion_needs_review");
  assert.equal(added.data.agent_next.recommended_skill, "nori-reporting");
  assert.equal(added.data.latest_evidence.sources.length, 5);
  const architectureSource = added.data.latest_evidence.sources.find((source) => source.type === "architecture-apply");
  assert.equal(architectureSource.role, "context");
  assert.equal(architectureSource.path, ".opennori/architecture/evidence/module-ac-1-apply.json");
  assert.equal(added.data.latest_evidence.sources.some((source) => source.command === "npm run check"), true);
  assert.equal(added.data.latest_evidence.sources.some((source) => source.label === "screenshots/reviewable-flow.png"), true);
  assert.equal(added.data.latest_evidence.sources.some((source) => source.type === "url"), true);
  assert.equal(JSON.parse(fs.readFileSync(evidencePath, "utf8")).criteria["AC-1"].status, "passing");
});

test("evidence add only refreshes the touched criterion status projection", { tags: ["cli", "evidence", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "projection-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "projection-goal",
    goal: "Avoid noisy status projection writes",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can review the first result.",
        measurement: "Open the first status projection.",
        threshold: "It reflects only first-result evidence."
      },
      {
        id: "AC-2",
        user_story: "As a user, I can review the second result.",
        measurement: "Open the second status projection.",
        threshold: "It is not rewritten when AC-1 changes."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  ledger.updated_at = "2026-06-01T00:00:00.000Z";
  ledger.criteria["AC-1"].updated_at = "2026-06-01T00:00:00.000Z";
  ledger.criteria["AC-2"].updated_at = "2026-06-01T00:00:00.000Z";
  writeGoalDossier(paths.goalDir, contract, ledger);

  await new Promise((resolve) => setTimeout(resolve, 5));
  const added = await runEvidenceAddCommand([
    "--criterion", "AC-1",
    "--kind", "review-result",
    "--basis", "tool-observation",
    "--summary", "AC-1 has reviewable evidence.",
    "--source-command", "npm test",
    "--reviewability", "Run the command.",
    "--limitations", "This fixture checks projection writes.",
    "--confidence", "verified",
    "--result", "passing",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });

  assert.equal(added.ok, true);
  const ac1Status = JSON.parse(fs.readFileSync(path.join(paths.goalDir, "criteria", "AC-1", "status.json"), "utf8"));
  const ac2Status = JSON.parse(fs.readFileSync(path.join(paths.goalDir, "criteria", "AC-2", "status.json"), "utf8"));
  assert.equal(ac1Status.status, "passing");
  assert.notEqual(ac1Status.updated_at, "2026-06-01T00:00:00.000Z");
  assert.equal(ac2Status.status, "unknown");
  assert.equal(ac2Status.updated_at, "2026-06-01T00:00:00.000Z");
});

test("evidence prune command module removes obsolete criterion evidence", { tags: ["cli", "evidence", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Refresh obsolete evidence",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can see only current evidence in the report.",
        measurement: "Open the report.",
        threshold: "Obsolete proof no longer appears."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", {
    kind: "review-result",
    basis: "tool-observation",
    summary: "Old proof was valid before the product changed.",
    result: "passing",
    sources: [{ type: "command", label: "old check", command: "npm test" }],
    reviewability: "Rerun the old check.",
    limitations: "It no longer proves the current behavior."
  });
  writeGoalDossier(paths.goalDir, contract, ledger);

  const pruned = await runEvidencePruneCommand([
    "--criterion", "AC-1",
    "--reason", "Product behavior changed and this proof is obsolete.",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });

  assert.equal(pruned.ok, true);
  assert.equal(pruned.data.evidence_prune.removed_records, 1);
  assert.equal(pruned.data.criterion_status, "unknown");
  assert.equal(pruned.data.latest_evidence, null);
  assert.equal(pruned.data.current_gap.id, "AC-1");
  const written = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  assert.equal(written.criteria["AC-1"].evidence.length, 0);
  assert.equal(written.criteria["AC-1"].status, "unknown");
});
