import assert from "node:assert/strict";
import { test } from "vitest";
import { tempRoot, runProfileAddCommand, runProfileEvidenceCommand, runProfileShowCommand, addEvidence, buildEvidenceLedger, goalPaths, readGoalPayloadFromPaths, writeGoalDossier } from "./support/command-fixtures.js";

test("profile show command module reads the current goal via injected loader", { tags: ["cli", "profile", "acceptance", "quick"] }, async () => {
  const contract = {
    goal_id: "module-goal",
    criteria: [],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "active", criteria: {}, capability_profile: { items: [], evidence: [] } };

  const profile = await runProfileShowCommand(["--json"], {
    loadPair: () => ({ contract, ledger })
  });
  assert.equal(profile.ok, true);
  assert.equal(profile.data.goal_id, "module-goal");
  assert.equal(profile.data.workflow_status, "active");
  assert.equal(profile.data.profile.items.length, 0);
});

test("profile add and evidence modules update compliance and workflow state", { tags: ["cli", "profile", "evidence", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Use a required Skill",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can see the required behavior.",
        measurement: "Open the completed flow.",
        threshold: "I can see the expected result."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", { kind: "test-summary", summary: "AC-1 passes.", result: "passing" });
  writeGoalDossier(paths.goalDir, contract, ledger);
  const data = {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root }),
    savePair: (_nextAcceptancePath, _nextEvidencePath, nextContract, nextLedger) => writeGoalDossier(paths.goalDir, nextContract, nextLedger),
    refreshManifest: () => {}
  };

  const added = await runProfileAddCommand([
    "--type", "skill",
    "--name", "design-taste-frontend",
    "--strength", "must",
    "--purpose", "Generate a design read before implementation.",
    "--install-policy", "existing_only",
    "--json"
  ], data);
  assert.equal(added.ok, true);
  assert.equal(added.data.workflow_status, "blocked");
  assert.equal(added.data.current_gap.id, "PROFILE-skill-design-taste-frontend");

  const evidenced = await runProfileEvidenceCommand([
    "--item", "skill-design-taste-frontend",
    "--result", "satisfied",
    "--summary", "Agent used design-taste-frontend.",
    "--path", "/Users/jarl/.agents/skills/design-taste-frontend/SKILL.md",
    "--json"
  ], data);
  assert.equal(evidenced.ok, true);
  assert.equal(evidenced.data.workflow_status, "complete");
  assert.equal(evidenced.data.current_gap, null);
  assert.equal(readGoalPayloadFromPaths(acceptancePath, evidencePath).ledger.capability_profile.items.length, 1);
});
