import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { tempRoot, writeActiveGoalWithId, runArchitectureApplyCommand, runArchitectureBaselineCommand, runArchitectureBuildVsBuyCommand, runArchitectureChallengeCommand, runArchitectureProfileCommand, runArchitectureRequirementCommand, runCheckCommand, buildArchitectureBaseline, writeArchitectureBaseline, writeArchitectureRequirement, buildEvidenceLedger, goalPaths, writeGoalDossier, writeJson } from "./support/command-fixtures.js";

test("check command module reports acceptance architecture and evidence health", { tags: ["cli", "architecture", "evidence", "reporting", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Check module health",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can check the goal health.",
        measurement: "Open status.",
        threshold: "I can see health warnings."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);

  const checked = await runCheckCommand(["--json"], {
    loadPair: () => ({ contract, ledger, root })
  });
  assert.equal(checked.ok, true);
  assert.equal(checked.data.goal_id, "module-goal");
  assert.equal(checked.data.acceptance_review.status, "clear");
  assert.equal(checked.data.architecture_check.status, "needs-action");
  assert.equal(checked.data.architecture_check.decision, "missing");
  assert.equal(checked.data.evidence_health.status, "clear");
  assert.equal(checked.warnings.some((warning) => warning.type === "architecture_requirement"), true);
  assert.equal(checked.next_actions.some((action) => /architecture requirement/.test(action) || /opennori architecture requirement/.test(action)), true);
});

test("architecture build-vs-buy command module records reviewable decisions", { tags: ["cli", "architecture", "quick"] }, async () => {
  const root = tempRoot();

  const decision = await runArchitectureBuildVsBuyCommand([
    "--root", root,
    "--id", "module-parser-choice",
    "--area", "cli",
    "--need", "Parse OpenNori subcommands",
    "--recommendation", "self-build",
    "--summary", "Use citty command modules and keep repeated-source parsing as narrow command-local glue.",
    "--current-project", "Current project uses src/cli/command-tree.ts and src/cli/commands/** citty modules.",
    "--standard-library", "Node exposes argv tokens but not a full nested command definition model.",
    "--official-sdk", "No official SDK applies.",
    "--json"
  ]);

  assert.equal(decision.ok, true);
  assert.equal(decision.data.decision.schema_version, "opennori/build-vs-buy-v1");
  assert.equal(decision.data.decision.id, "module-parser-choice");
  assert.equal(decision.data.decision.recommendation, "self-build");
  assert.equal(decision.data.decision.current_project, "Current project uses src/cli/command-tree.ts and src/cli/commands/** citty modules.");
  assert.equal(decision.data.decision.standard_library, "Node exposes argv tokens but not a full nested command definition model.");
  assert.equal(decision.data.decision.official_sdk, "No official SDK applies.");
  assert.equal(decision.data.decision_path, path.join(root, ".opennori", "architecture", "decisions", "module-parser-choice.json"));
  assert.equal(fs.existsSync(decision.data.decision_path), true);
  assert.equal(fs.existsSync(decision.data.markdown_path), true);
  assert.equal(decision.artifacts.some((artifact) => artifact.kind === "build_vs_buy_decision"), true);
  assert.equal(decision.warnings.some((warning) => warning.type === "build_vs_buy"), true);
  assert.match(fs.readFileSync(decision.data.markdown_path, "utf8"), /Build-vs-Buy Decision/);
});

test("architecture challenge command module records baseline challenges", { tags: ["cli", "architecture", "quick"] }, async () => {
  const root = tempRoot();
  writeArchitectureRequirement(root, {
    goalId: "module-goal",
    status: "required",
    reason: "This fixture challenges a required Architecture Baseline."
  });
  writeArchitectureBaseline(root, buildArchitectureBaseline(root, {
    goal: "Keep architecture reviewable",
    goalId: "module-goal",
    accepted: true
  }));

  const challenge = await runArchitectureChallengeCommand([
    "--root", root,
    "--id", "module-challenge",
    "--summary", "Current project already uses another CLI parser.",
    "--evidence", "package.json contains a parser dependency.",
    "--recommendation", "Ask the user whether to revise the baseline.",
    "--no-user",
    "--json"
  ]);

  assert.equal(challenge.ok, true);
  assert.equal(challenge.data.challenge.schema_version, "opennori/architecture-challenge-v1");
  assert.equal(challenge.data.challenge.id, "module-challenge");
  assert.equal(challenge.data.challenge.needs_user, false);
  assert.equal(challenge.data.challenge.baseline.goal_id, "module-goal");
  assert.equal(challenge.data.architecture.decision, "challenged");
  assert.equal(challenge.data.challenge_path, path.join(root, ".opennori", "architecture", "challenges", "module-challenge.json"));
  assert.equal(fs.existsSync(challenge.data.challenge_path), true);
  assert.equal(fs.existsSync(challenge.data.markdown_path), true);
  assert.equal(challenge.artifacts.some((artifact) => artifact.kind === "architecture_challenge"), true);
  assert.match(fs.readFileSync(challenge.data.markdown_path, "utf8"), /Do not silently replace/);
});

test("architecture apply command module records baseline alignment without Product AC evidence", { tags: ["cli", "architecture", "evidence", "quick"] }, async () => {
  const root = tempRoot();
  writeArchitectureRequirement(root, {
    goalId: "module-goal",
    status: "required",
    reason: "This fixture applies a required Architecture Baseline."
  });
  writeArchitectureBaseline(root, buildArchitectureBaseline(root, {
    goal: "Keep architecture aligned",
    goalId: "module-goal",
    accepted: true
  }));

  const applied = await runArchitectureApplyCommand([
    "--root", root,
    "--id", "module-ac-1-apply",
    "--goal", "module-goal",
    "--criterion", "AC-1",
    "--summary", "AC-1 will use the confirmed command-module boundary.",
    "--fit", "The change stays inside the command layer and does not replace the baseline stack.",
    "--implementation-focus", "Implement only the current AC-1 behavior.",
    "--evidence", "Reviewed baseline.json and the current command module.",
    "--json"
  ]);

  assert.equal(applied.ok, true);
  assert.equal(applied.data.apply_record.schema_version, "opennori/architecture-apply-v1");
  assert.equal(applied.data.apply_record.goal_id, "module-goal");
  assert.equal(applied.data.apply_record.criterion_id, "AC-1");
  assert.equal(applied.data.apply_record.status, "aligned");
  assert.equal(applied.data.apply_record.baseline.profile, "typescript-agent-state-cli");
  assert.equal(applied.data.apply_path, path.join(root, ".opennori", "architecture", "evidence", "module-ac-1-apply.json"));
  assert.equal(fs.existsSync(applied.data.apply_path), true);
  assert.equal(fs.existsSync(applied.data.markdown_path), true);
  assert.equal(applied.data.architecture.apply_records.length, 1);
  assert.equal(applied.data.architecture.apply_records[0].criterion_id, "AC-1");
  assert.equal(applied.data.agent_next.state, "evidence_ready_for_recording");
  assert.equal(applied.data.agent_next.recommended_skill, "nori-evidence");
  assert.equal(applied.data.agent_next.current_gap_id, "AC-1");
  assert.equal(applied.data.agent_next.dashboard_activity.target.goal_id, "module-goal");
  assert.equal(applied.data.agent_next.dashboard_activity.target.gap_id, "AC-1");
  assert.match(applied.data.agent_next.dashboard_activity.start_command, /opennori activity start/);
  assert.match(applied.data.agent_next.dashboard_activity.note, /not Product AC evidence/);
  assert.match(applied.data.agent_next.instruction, /--architecture-apply/);
  assert.equal(applied.artifacts.some((artifact) => artifact.kind === "architecture_apply"), true);
  assert.equal(applied.next_actions.some((action) => /Product AC evidence/.test(action)), true);
  assert.match(fs.readFileSync(applied.data.markdown_path, "utf8"), /not Product AC evidence/);
});

test("architecture apply routes conflicts to architecture challenge", { tags: ["cli", "architecture", "quick"] }, async () => {
  const root = tempRoot();
  writeArchitectureRequirement(root, {
    goalId: "module-goal",
    status: "required",
    reason: "This fixture applies a required Architecture Baseline and records a challenge path."
  });
  writeArchitectureBaseline(root, buildArchitectureBaseline(root, {
    goal: "Keep architecture aligned",
    goalId: "module-goal",
    accepted: true
  }));

  const applied = await runArchitectureApplyCommand([
    "--root", root,
    "--goal", "module-goal",
    "--criterion", "AC-1",
    "--status", "needs-challenge",
    "--summary", "AC-1 conflicts with the confirmed command-module boundary.",
    "--fit", "The intended work would replace the confirmed stack.",
    "--implementation-focus", "Stop before implementation.",
    "--json"
  ]);

  assert.equal(applied.ok, true);
  assert.equal(applied.data.apply_record.status, "needs-challenge");
  assert.equal(applied.data.agent_next.state, "architecture_needs_review");
  assert.equal(applied.data.agent_next.recommended_skill, "nori-architecture-challenge");
  assert.equal(applied.data.agent_next.needs_user, true);
  assert.equal(applied.next_actions.some((action) => /Architecture Challenge/.test(action)), true);
});

test("architecture profile command module installs and validates project profiles", { tags: ["cli", "architecture", "profile", "lifecycle"] }, async () => {
  const root = tempRoot();
  const sourcePath = path.join(root, "team-architecture.json");
  writeJson(sourcePath, {
    id: "module-team-cli",
    title: "Module Team CLI",
    summary: "Use the team command module shape.",
    principles: ["team-command-module"],
    checks: [
      {
        id: "TEAM-1",
        audience: "maintainer",
        statement: "Commands live in modules.",
        review: "Inspect src/cli/commands."
      }
    ],
    technical_baseline: {
      runtime_topology: [{ name: "team-cli-runtime", decision: "Run through the team CLI runtime." }],
      source_of_truth: [{ name: "team-state", decision: "Use project-local JSON state as truth." }],
      module_boundaries: [{ name: "team-command-modules", decision: "Commands delegate to domain modules." }],
      contract_surfaces: [{ name: "team-json", decision: "Expose stable JSON to agents." }],
      data_flows: [{ name: "team-command-flow", steps: ["Parse command.", "Validate input.", "Write state."] }],
      dependency_decisions: [{ name: "team-parser", decision: "Prefer the existing team parser." }],
      reference_mappings: [{ name: "team-standard", decision: "Map the team standard into CLI modules." }],
      verification: ["npm test"]
    },
    build_vs_buy_policy: {
      order: ["current-project-dependency", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    }
  });

  const added = await runArchitectureProfileCommand(["--root", root, "--from", sourcePath, "--json"]);
  assert.equal(added.ok, true);
  assert.equal(added.data.profile.id, "module-team-cli");
  assert.equal(added.data.profile_path, path.join(root, ".opennori", "architecture", "profiles", "module-team-cli.json"));
  assert.equal(fs.existsSync(added.data.profile_path), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "evidence", "module-team-cli.profile.json")), false);
  assert.equal(added.data.profiles[0].id, "module-team-cli");
  assert.equal(added.artifacts.some((artifact) => artifact.kind === "architecture_profile"), true);

  const invalidPath = path.join(root, "invalid-architecture.json");
  writeJson(invalidPath, { id: "invalid-profile" });
  const invalid = await runArchitectureProfileCommand(["--root", root, "--from", invalidPath, "--json"]);
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error.type, "invalid_architecture_profile");
  assert.equal(invalid.issues.some((issue) => issue.path === "summary"), true);

  const missingVerificationPath = path.join(root, "missing-verification-architecture.json");
  const missingVerificationProfile = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  delete missingVerificationProfile.technical_baseline.verification;
  writeJson(missingVerificationPath, missingVerificationProfile);

  const missingVerification = await runArchitectureProfileCommand(["--root", root, "--from", missingVerificationPath, "--id", "module-team-cli-missing-verification", "--json"]);
  assert.equal(missingVerification.ok, false);
  assert.equal(missingVerification.error.type, "invalid_architecture_profile");
  assert.equal(missingVerification.issues.some((issue) => issue.path === "technical_baseline" && /verification/.test(issue.message)), true);
});

test("architecture baseline command module previews before confirmed write", { tags: ["cli", "architecture", "quick"] }, async () => {
  const root = tempRoot();
  const baselinePath = path.join(root, ".opennori", "architecture", "baseline.json");
  const paths = goalPaths(root, "module-goal");
  const contract = {
    schema_version: "opennori/contract-v1",
    goal_id: "module-goal",
    goal: "Ship a reviewable CLI architecture",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can verify the current architecture-guided gap."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  writeGoalDossier(paths.goalDir, contract, ledger);
  writeArchitectureRequirement(root, {
    goalId: "module-goal",
    status: "required",
    reason: "This fixture confirms a required Architecture Baseline."
  });

  const preview = await runArchitectureBaselineCommand([
    "--root", root,
    "--goal", "Ship a reviewable CLI architecture",
    "--goal-id", "module-goal",
    "--json"
  ]);
  assert.equal(preview.ok, true);
  assert.equal(preview.data.confirmed, false);
  assert.equal(preview.data.side_effect, "none");
  assert.equal(preview.data.baseline.status, "draft");
  assert.equal(preview.data.baseline.goal_id, "module-goal");
  assert.equal(preview.data.architecture.preview.baseline_path, ".opennori/architecture/baseline.json");
  assert.equal(fs.existsSync(baselinePath), false);

  const confirmed = await runArchitectureBaselineCommand([
    "--root", root,
    "--goal", "Ship a reviewable CLI architecture",
    "--goal-id", "module-goal",
    "--confirm",
    "--json"
  ]);
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.data.confirmed, true);
  assert.equal(confirmed.data.side_effect, "write");
  assert.equal(confirmed.data.baseline.status, "active");
  assert.equal(confirmed.data.architecture.decision, "valid");
  assert.equal(confirmed.data.current_gap.id, "AC-1");
  assert.equal(confirmed.data.next_recommendation.status, "work-on-current-gap");
  assert.equal(confirmed.data.agent_next.state, "work_on_current_gap");
  assert.equal(confirmed.data.agent_next.recommended_skill, "nori-architecture-apply");
  assert.match(confirmed.data.agent_next.instruction, /Architecture Baseline/);
  assert.equal(fs.existsSync(baselinePath), true);
  assert.equal(confirmed.artifacts.some((artifact) => artifact.kind === "architecture_baseline"), true);
  assert.equal(confirmed.next_actions.some((action) => /AC-1/.test(action)), true);
});

test("architecture requirement command records decisions and controls baseline routing", { tags: ["cli", "architecture", "quick"] }, async () => {
  const root = tempRoot();
  writeActiveGoalWithId(root, "module-goal");

  const notRequired = await runArchitectureRequirementCommand([
    "--root", root,
    "--goal-id", "module-goal",
    "--status", "not_required",
    "--reason", "Single documentation copy edit with no runtime, state, dependency, or module boundary change.",
    "--json"
  ]);
  assert.equal(notRequired.ok, true);
  assert.equal(notRequired.data.requirement.status, "not_required");
  assert.equal(notRequired.data.architecture.required_for_goal, false);
  assert.equal(notRequired.data.agent_next.state, "work_on_current_gap");
  assert.equal(notRequired.data.agent_next.recommended_skill, "nori-evidence");

  const required = await runArchitectureRequirementCommand([
    "--root", root,
    "--goal-id", "module-goal",
    "--status", "required",
    "--reason", "Implementation touches command modules and project state boundaries.",
    "--json"
  ]);
  assert.equal(required.data.requirement.status, "required");
  assert.equal(required.data.architecture.required_for_goal, true);
  assert.equal(required.data.next_recommendation.status, "architecture-review-required");
  assert.equal(required.data.agent_next.state, "architecture_needs_review");

  const waived = await runArchitectureRequirementCommand([
    "--root", root,
    "--goal-id", "module-goal",
    "--status", "waived",
    "--reason", "User explicitly accepts architecture review risk for this small follow-up.",
    "--decided-by", "user",
    "--limitations", "No baseline is confirmed for later non-trivial changes.",
    "--json"
  ]);
  assert.equal(waived.data.requirement.status, "waived");
  assert.equal(waived.warnings.some((warning) => warning.type === "architecture_requirement"), true);
  assert.equal(waived.data.agent_next.state, "work_on_current_gap");
  assert.equal(waived.data.agent_next.recommended_skill, "nori-evidence");
});
