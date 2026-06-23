import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { ROOT, CLI, run, tempRoot, writeBriefFile, draftArgsFromGoal, draftAndApprove, recordArchitectureRequirement, readGoalPayloadFromPaths } from "./support/cli.js";

test("architecture baseline loop is agent-readable sticky and challengeable", { tags: ["architecture"] }, () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  const draft = draftAndApprove(draftArgsFromGoal(root, "Refactor OpenNori into a TypeScript agent state CLI product"));

  const requirementCheck = run(["check", "--root", root, "--json"]);
  assert.equal(requirementCheck.data.architecture_check.status, "needs-action");
  assert.equal(requirementCheck.data.architecture_check.architecture.requirement.status, "unknown");
  assert.equal(requirementCheck.warnings.some((warning) => warning.type === "architecture_requirement"), true);
  assert.equal(requirementCheck.data.agent_next.state, "architecture_requirement_needs_decision");

  const requirement = recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This goal changes OpenNori's TypeScript CLI, state layer, architecture routing, and manifest behavior."
  );
  assert.equal(requirement.data.requirement.status, "required");
  assert.equal(requirement.data.agent_next.state, "architecture_needs_review");

  const missingBaselineCheck = run(["check", "--root", root, "--json"]);
  assert.equal(missingBaselineCheck.data.architecture_check.status, "needs-action");
  assert.equal(missingBaselineCheck.data.architecture_check.decision, "missing");
  assert.equal(missingBaselineCheck.warnings.some((warning) => warning.type === "architecture" && /Architecture Baseline/.test(warning.message)), true);
  assert.equal(missingBaselineCheck.next_actions.some((action) => /architecture_check/.test(action)), true);

  const profiles = run(["architecture", "profiles", "--root", root, "--json"]);
  assert.equal(profiles.data.profiles.some((profile) => profile.id === "typescript-agent-state-cli"), true);
  const builtinProfile = profiles.data.profiles.find((profile) => profile.id === "typescript-agent-state-cli");
  assert.match(builtinProfile.summary, /strict TypeScript/);
  assert.equal(builtinProfile.valid, true);
  assert.equal(builtinProfile.review.can_generate_baseline, true);
  assert.equal(builtinProfile.sources.some((source) => source.label === "CodeGraph / GitNexus"), true);
  assert.equal(builtinProfile.principles.includes("build-vs-buy-before-custom-infrastructure"), true);
  assert.equal(builtinProfile.checks.some((check) => check.id === "ARCH-5" && check.audience === "agent"), true);
  assert.equal(builtinProfile.technical_baseline.runtime_topology.some((item) => item.name === "cli-state-layer"), true);
  assert.equal(builtinProfile.technical_baseline.module_boundaries.some((item) => item.name === "src/architecture"), true);
  assert.equal(builtinProfile.technical_baseline.contract_surfaces.some((item) => item.name === "cli-json"), true);
  assert.equal(builtinProfile.technical_baseline.data_flows.some((item) => item.name === "architecture-before-implementation"), true);
  assert.equal(builtinProfile.technical_baseline.dependency_decisions.some((item) => item.name === "citty"), true);
  assert.equal(builtinProfile.technical_baseline.reference_mappings.some((item) => item.name === "ECC"), true);
  assert.equal(builtinProfile.preferred_libraries.some((entry) => entry.area === "cli"), true);
  assert.equal(builtinProfile.avoid.includes("silent architecture replacement"), true);
  assert.equal(builtinProfile.build_vs_buy_policy.require_reason_when_self_building, true);

  const preview = run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Refactor OpenNori into a TypeScript agent state CLI product",
    "--goal-id", "refactor-opennori-into-a-typescript-agent-state-cli-product",
    "--json"
  ]);
  assert.equal(preview.data.confirmed, false);
  assert.equal(preview.data.side_effect, "none");
  assert.equal(preview.data.baseline.status, "draft");
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "baseline.json")), false);

  const confirmed = run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Refactor OpenNori into a TypeScript agent state CLI product",
    "--goal-id", "refactor-opennori-into-a-typescript-agent-state-cli-product",
    "--confirm",
    "--json"
  ]);
  assert.equal(confirmed.data.confirmed, true);
  assert.equal(confirmed.data.baseline.status, "active");
  assert.equal(confirmed.data.baseline.sticky, true);
  assert.equal(confirmed.data.baseline.requires_challenge_to_change, true);
  assert.equal(confirmed.data.baseline.principles.includes("build-vs-buy-before-custom-infrastructure"), true);
  assert.equal(confirmed.data.baseline.technical_baseline.runtime_topology.some((item) => item.name === "cli-state-layer"), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "architecture", "baseline.json")), true);
  const baselineMarkdown = fs.readFileSync(path.join(root, ".opennori", "architecture", "baseline.md"), "utf8");
  assert.match(baselineMarkdown, /Architecture Baseline/);
  assert.match(baselineMarkdown, /## Technical Architecture Baseline/);
  assert.match(baselineMarkdown, /### Runtime Topology/);
  assert.match(baselineMarkdown, /### Module Boundaries/);
  assert.match(baselineMarkdown, /### Data Flows/);
  assert.match(fs.readFileSync(path.join(root, ".opennori", "agent-guide.md"), "utf8"), /Architecture Baseline/);

  const decision = run([
    "architecture", "build-vs-buy",
    "--root", root,
    "--area", "cli",
    "--need", "Parse subcommands and flags",
    "--recommendation", "reuse",
    "--summary", "Prefer a mature CLI parser or current project convention before expanding custom parsing.",
    "--current-project", "Current project has handwritten argValue/hasFlag helpers.",
    "--standard-library", "Node has no full subcommand parser.",
    "--official-sdk", "No official SDK.",
    "--open-source", "commander, citty, cac",
    "--json"
  ]);
  assert.equal(decision.data.decision.schema_version, "opennori/build-vs-buy-v1");
  assert.equal(fs.existsSync(decision.data.decision_path), true);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.architecture.decision, "valid");
  assert.equal(status.data.architecture.baseline.profile, "typescript-agent-state-cli");
  assert.equal(status.data.architecture.baseline.technical_baseline_summary.runtime_topology_count > 0, true);
  assert.equal(status.data.architecture.baseline.technical_baseline_summary.module_boundary_count > 0, true);
  assert.equal(status.data.architecture.build_vs_buy_decisions.length, 1);

  const clearCheck = run(["check", "--root", root, "--json"]);
  assert.equal(clearCheck.data.architecture_check.status, "clear");
  assert.equal(clearCheck.data.architecture_check.decision, "valid");
  assert.equal(clearCheck.warnings.some((warning) => warning.type === "architecture"), false);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "manifest.json"), "utf8"));
  assert.equal(manifest.architecture.required_for_goal, true);
  assert.equal(manifest.architecture.baseline.goal_id, "refactor-opennori-into-a-typescript-agent-state-cli-product");

  const secondDraft = run([
    "draft",
    "--root", root,
    "--brief", writeBriefFile(root, "Capture follow-up adoption friction", { goalId: "adoption-follow-up" }),
    "--json"
  ]);
  assert.equal(secondDraft.data.goal_id, "adoption-follow-up");
  const multiGoalManifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "manifest.json"), "utf8"));
  assert.equal(multiGoalManifest.current_goal.goal_id, "refactor-opennori-into-a-typescript-agent-state-cli-product");
  assert.equal(multiGoalManifest.draft_goals.some((goal) => goal.goal_id === "adoption-follow-up"), true);
  assert.equal(multiGoalManifest.active_goals.length, 1);
  assert.equal(multiGoalManifest.architecture.required_for_goal, true);
  assert.equal(multiGoalManifest.architecture.baseline.goal_id, "refactor-opennori-into-a-typescript-agent-state-cli-product");

  const report = run([
    "report",
    "--root", root,
    "--goal", "refactor-opennori-into-a-typescript-agent-state-cli-product",
    "--json"
  ]);
  const reportText = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(reportText, /## Architecture Baseline/);
  assert.match(reportText, /Architecture decision: valid/);
  assert.match(reportText, /Technical baseline: /);
  assert.match(reportText, /Build-vs-buy: clear \(1 decisions\)/);

  const exported = run([
    "context", "export",
    "--root", root,
    "--goal", "refactor-opennori-into-a-typescript-agent-state-cli-product",
    "--json"
  ]);
  assert.equal(exported.data.architecture.decision, "valid");
  assert.equal(exported.data.architecture.baseline.profile, "typescript-agent-state-cli");

  const challenge = run([
    "architecture", "challenge",
    "--root", root,
    "--summary", "Existing project standardizes on another CLI parser.",
    "--evidence", "package.json already depends on citty and command modules use it.",
    "--recommendation", "Revise CLI parser preference from commander to citty for this project.",
    "--json"
  ]);
  assert.equal(challenge.data.challenge.schema_version, "opennori/architecture-challenge-v1");
  assert.equal(challenge.data.architecture.decision, "challenged");
  assert.equal(challenge.data.architecture.open_challenges.length, 1);
  assert.match(fs.readFileSync(challenge.data.markdown_path, "utf8"), /Do not silently replace/);

  const challengedStatus = run([
    "status",
    "--root", root,
    "--goal", "refactor-opennori-into-a-typescript-agent-state-cli-product",
    "--json"
  ]);
  assert.equal(challengedStatus.data.architecture.decision, "challenged");

  assert.equal(fs.existsSync(draft.data.acceptance_path), true);
});

test("missing architecture baseline is a completion review risk, not a product AC gap", { tags: ["architecture"] }, () => {
  const root = tempRoot();
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship an architecture-aware user outcome"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture explicitly requires architecture review while omitting the baseline."
  );

  const payload = readGoalPayloadFromPaths(draft.data.acceptance_path, draft.data.evidence_path);
  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has user-reviewable evidence.`,
      "--result", "passing",
      "--source-command", "opennori status --root . --json",
      "--source-path", ".opennori/reports/architecture-aware.report.md",
      "--reviewability", "Run status and inspect the report artifact.",
      "--limitations", "This fixture intentionally omits Architecture Baseline.",
      "--json"
    ]);
  }

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.workflow_status, "complete");
  assert.equal(status.data.current_gap, null);
  assert.equal(status.data.architecture.decision, "missing");
  assert.equal(status.data.completion.objective_complete, true);
  assert.equal(status.data.completion.confidence, "review-risk");
  assert.equal(status.data.completion.review_risks.includes("architecture_review"), true);
  assert.equal(status.data.next_recommendation.status, "completion-review-required");
  assert.equal(status.data.next_recommendation.actions.some((action) => /architecture_check/.test(action)), true);
  assert.equal(status.data.criteria.some((criterion) => /^ARCH-/.test(criterion.id)), false);

  const report = run(["report", "--root", root, "--json"]);
  assert.match(fs.readFileSync(report.data.report_path, "utf8"), /Review risks: architecture_review/);
});

test("architecture apply records do not count as Product AC evidence", { tags: ["architecture"] }, () => {
  const root = tempRoot();
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship an architecture-guided user outcome"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture verifies architecture apply records under a confirmed required baseline."
  );
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship an architecture-guided user outcome",
    "--goal-id", draft.data.goal_id,
    "--confirm",
    "--json"
  ]);

  const applied = run([
    "architecture", "apply",
    "--root", root,
    "--goal", draft.data.goal_id,
    "--criterion", "AC-1",
    "--summary", "AC-1 will follow the confirmed architecture baseline.",
    "--fit", "The intended change keeps the confirmed command and state boundaries.",
    "--implementation-focus", "Work only on AC-1.",
    "--evidence", "Reviewed baseline and current gap before implementation.",
    "--json"
  ]);
  assert.equal(applied.data.apply_record.schema_version, "opennori/architecture-apply-v1");
  assert.equal(applied.data.architecture.apply_records.length, 1);
  assert.equal(applied.data.agent_next.state, "evidence_ready_for_recording");
  assert.equal(applied.data.agent_next.recommended_skill, "nori-evidence");
  assert.match(applied.data.agent_next.instruction, /Product AC evidence/);
  const applyMarkdown = fs.readFileSync(applied.data.markdown_path, "utf8");
  assert.equal(applyMarkdown.endsWith("\n"), true);
  assert.equal(applyMarkdown.endsWith("\n\n"), false);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.architecture.decision, "valid");
  assert.equal(status.data.architecture.apply_records.length, 1);
  assert.equal(status.data.current_gap.id, "AC-1");
  assert.equal(status.data.workflow_status, "active");
  assert.equal(status.data.criteria.find((criterion) => criterion.id === "AC-1").status, "unknown");

  const report = run(["report", "--root", root, "--json"]);
  const reportText = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(reportText, /Architecture apply records: 1/);
  assert.match(reportText, /AC-1: aligned/);
});

test("product evidence can reference architecture apply context without treating it as proof", { tags: ["architecture"] }, () => {
  const root = tempRoot();
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship architecture-context evidence"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture verifies Product evidence with architecture context under a required baseline."
  );
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship architecture-context evidence",
    "--goal-id", draft.data.goal_id,
    "--confirm",
    "--json"
  ]);
  const applied = run([
    "architecture", "apply",
    "--root", root,
    "--id", "ac-1-context",
    "--goal", draft.data.goal_id,
    "--criterion", "AC-1",
    "--summary", "AC-1 will follow the confirmed baseline.",
    "--fit", "The intended work keeps the confirmed CLI and state boundaries.",
    "--implementation-focus", "Work only on AC-1.",
    "--json"
  ]);

  const contextOnly = run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "agent-observation",
    "--summary", "Only the architecture alignment context has been attached so far.",
    "--architecture-apply", "ac-1-context",
    "--reviewability", "Open the architecture apply record.",
    "--limitations", "This does not prove the user-visible behavior.",
    "--result", "passing",
    "--json"
  ]);
  assert.equal(contextOnly.data.criterion_status, "failing");
  assert.equal(contextOnly.data.gate, "downgraded_context_only_requires_product_evidence");
  assert.equal(contextOnly.data.latest_evidence.sources[0].type, "architecture-apply");
  assert.equal(contextOnly.data.latest_evidence.sources[0].role, "context");
  assert.equal(contextOnly.data.latest_evidence.sources[0].path, ".opennori/architecture/evidence/ac-1-context.json");

  const verified = run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "review-result",
    "--basis", "tool-observation",
    "--summary", "The user-visible AC-1 behavior was verified and kept within the architecture baseline.",
    "--architecture-apply", applied.data.apply_record.id,
    "--source-command", "npm run check",
    "--reviewability", "Rerun the command and inspect the architecture apply record for baseline context.",
    "--limitations", "This fixture proves evidence semantics, not a real browser flow.",
    "--result", "passing",
    "--json"
  ]);
  assert.equal(verified.data.criterion_status, "passing");
  assert.equal(verified.data.latest_evidence.sources.some((source) => source.type === "architecture-apply"), true);
  assert.equal(verified.data.latest_evidence.sources.some((source) => source.type === "command"), true);

  const report = run(["report", "--root", root, "--json"]);
  const reportText = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(reportText, /type=architecture-apply/);
  assert.match(reportText, /role=context/);
  assert.match(reportText, /command=npm run check/);
});

test("project architecture profiles can be added and used for baselines", { tags: ["architecture"] }, () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  recordArchitectureRequirement(
    root,
    "ship-under-team-architecture",
    "required",
    "The goal explicitly tests a project Architecture Profile baseline."
  );

  const sourcePath = path.join(root, "preferred-architecture.json");
  fs.writeFileSync(sourcePath, `${JSON.stringify({
    id: "team-cli",
    title: "Team CLI",
    summary: "Use the team's preferred CLI parser, shared schema package, and strict build-vs-buy review.",
    applies_to: ["team-maintained CLI tools"],
    sources: [{ label: "Team standard", lesson: "Follow the shared parser and schema packages unless challenged." }],
    principles: ["team-parser-first", "shared-schema-first", "build-vs-buy-before-self-build"],
    checks: [
      {
        id: "TEAM-ARCH-1",
        audience: "maintainer",
        statement: "New command behavior follows the team parser boundary.",
        review: "Inspect command modules and parser wiring."
      }
    ],
    technical_baseline: {
      runtime_topology: [{ name: "team-cli-runtime", decision: "Run through the team CLI package." }],
      source_of_truth: [{ name: "team-schema-package", decision: "Use the shared schema package as the contract source." }],
      module_boundaries: [{ name: "commands", decision: "Command modules delegate to domain modules." }],
      contract_surfaces: [{ name: "json-cli", decision: "Expose stable JSON for agents." }],
      data_flows: [{ name: "command-to-state", steps: ["Parse command.", "Validate schema.", "Write project state."] }],
      dependency_decisions: [{ name: "team-cli-parser", decision: "Prefer the team CLI parser dependency." }],
      reference_mappings: [{ name: "team-standard", decision: "Map team standards into command and schema modules." }],
      verification: ["pnpm test"]
    },
    preferred_libraries: [{ area: "cli", policy: "Prefer the team CLI parser package." }],
    avoid: ["new handwritten parser without challenge"],
    build_vs_buy_policy: {
      order: ["current-project-dependency", "official-sdk", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    }
  }, null, 2)}\n`);

  const added = run(["architecture", "profile", "--root", root, "--from", sourcePath, "--json"]);
  assert.equal(added.data.profile.id, "team-cli");
  assert.equal(added.data.profile_path, path.join(root, ".opennori", "architecture", "profiles", "team-cli.json"));
  assert.equal(fs.existsSync(added.data.profile_path), true);
  assert.equal(added.data.profiles[0].id, "team-cli");
  assert.equal(added.data.profiles[0].origin, "project");

  const duplicate = spawnSync(process.execPath, [CLI, "architecture", "profile", "--root", root, "--from", sourcePath, "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /already exists/);

  const profiles = run(["architecture", "profiles", "--root", root, "--json"]);
  const projectProfile = profiles.data.profiles.find((profile) => profile.id === "team-cli" && profile.origin === "project");
  assert.equal(Boolean(projectProfile), true);
  assert.equal(projectProfile.valid, true);
  assert.equal(projectProfile.review.can_generate_baseline, true);
  assert.equal(projectProfile.sources.some((source) => source.label === "Team standard"), true);
  assert.equal(projectProfile.principles.includes("team-parser-first"), true);
  assert.equal(projectProfile.avoid.includes("new handwritten parser without challenge"), true);

  const baseline = run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship under team architecture",
    "--goal-id", "ship-under-team-architecture",
    "--profile", "team-cli",
    "--confirm",
    "--json"
  ]);
  assert.equal(baseline.data.baseline.profile, "team-cli");
  assert.equal(baseline.data.baseline.profile_origin, "project");
  assert.equal(baseline.data.baseline.principles.includes("team-parser-first"), true);
  assert.match(fs.readFileSync(path.join(root, ".opennori", "architecture", "baseline.md"), "utf8"), /team-parser-first/);
});

test("architecture evidence directory rejects misplaced profile source files", { tags: ["architecture"] }, () => {
  const root = tempRoot();
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship under clean architecture evidence"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture verifies architecture evidence directory health."
  );
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship under clean architecture evidence",
    "--goal-id", draft.data.goal_id,
    "--confirm",
    "--json"
  ]);

  const misplacedProfilePath = path.join(root, ".opennori", "architecture", "evidence", "team-cli.profile.json");
  fs.mkdirSync(path.dirname(misplacedProfilePath), { recursive: true });
  fs.writeFileSync(misplacedProfilePath, `${JSON.stringify({
    id: "team-cli",
    title: "Team CLI",
    summary: "This is a profile source, not an architecture apply record.",
    principles: ["team-parser-first"],
    checks: [
      {
        id: "TEAM-1",
        audience: "maintainer",
        statement: "Commands follow team architecture.",
        review: "Inspect command modules."
      }
    ],
    technical_baseline: {
      runtime_topology: [{ name: "runtime", decision: "Use the team runtime." }],
      source_of_truth: [{ name: "state", decision: "Use project state." }],
      module_boundaries: [{ name: "modules", decision: "Use team modules." }],
      contract_surfaces: [{ name: "json", decision: "Expose JSON." }],
      data_flows: [{ name: "flow", steps: ["Read input.", "Write state."] }],
      dependency_decisions: [{ name: "parser", decision: "Use team parser." }],
      reference_mappings: [{ name: "standard", decision: "Map team standard." }],
      verification: ["npm test"]
    },
    build_vs_buy_policy: {
      order: ["current-project-dependency", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    }
  }, null, 2)}\n`);

  const check = run(["check", "--root", root, "--json"]);
  assert.equal(check.data.architecture_check.status, "needs-action");
  assert.equal(check.data.architecture_check.architecture.evidence_health.status, "broken");
  assert.equal(check.warnings.some((warning) => warning.type === "architecture_evidence" && warning.path === ".opennori/architecture/evidence/team-cli.profile.json"), true);
  assert.equal(check.next_actions.some((action) => /architecture evidence/.test(action)), true);

  const payload = readGoalPayloadFromPaths(draft.data.acceptance_path, draft.data.evidence_path);
  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "verification",
      "--summary", `${criterion} has user-visible evidence.`,
      "--result", "passing",
      "--confidence", "high",
      "--basis", "tool-observation",
      "--source-command", "npm test",
      "--reviewability", "Rerun npm test and inspect the output.",
      "--limitations", "This fixture focuses on architecture evidence directory health.",
      "--json"
    ]);
  }

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.completion.review_risks.includes("architecture_evidence"), true);
  assert.equal(status.data.next_recommendation.status, "completion-review-required");
  assert.equal(status.data.next_recommendation.recommended_skill, "nori-project-health");

  const doctorPayload = run(["doctor", "--root", root, "--json"]);
  const architectureEvidenceCheck = doctorPayload.data.checks.find((item) => item.name === "architecture_evidence");
  assert.equal(architectureEvidenceCheck.ok, false);
  assert.equal(architectureEvidenceCheck.severity, "broken");
  assert.equal(doctorPayload.data.recovery_actions.some((action) => action.check === "architecture_evidence"), true);

  const report = run(["report", "--root", root, "--json"]);
  const reportText = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(reportText, /Review risks: .*architecture_evidence/);
  assert.match(reportText, /Architecture evidence health: broken/);
  assert.match(reportText, /team-cli\.profile\.json/);
});

test("project architecture profiles without technical verification are not usable for baselines", { tags: ["architecture"] }, () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);

  const profilesDir = path.join(root, ".opennori", "architecture", "profiles");
  fs.mkdirSync(profilesDir, { recursive: true });
  fs.writeFileSync(path.join(profilesDir, "missing-verification.json"), `${JSON.stringify({
    id: "missing-verification",
    title: "Missing Verification Profile",
    summary: "This profile has concrete sections but no verification commands or review checks.",
    principles: ["use-concrete-architecture"],
    checks: [
      {
        id: "TEAM-1",
        audience: "maintainer",
        statement: "Architecture has concrete boundaries.",
        review: "Inspect the baseline."
      }
    ],
    technical_baseline: {
      runtime_topology: [{ name: "runtime", decision: "Use the project runtime." }],
      source_of_truth: [{ name: "state", decision: "Use project-local JSON state." }],
      module_boundaries: [{ name: "modules", decision: "Keep command and domain modules separate." }],
      contract_surfaces: [{ name: "json", decision: "Expose stable JSON." }],
      data_flows: [{ name: "flow", steps: ["Read input.", "Write state."] }],
      dependency_decisions: [{ name: "parser", decision: "Use the existing parser." }],
      reference_mappings: [{ name: "standard", decision: "Map the team standard into modules." }]
    },
    build_vs_buy_policy: {
      order: ["current-project-dependency", "mature-open-source-library", "small-local-implementation"],
      require_reason_when_self_building: true
    }
  }, null, 2)}\n`);

  const profiles = run(["architecture", "profiles", "--root", root, "--json"]);
  const projectProfile = profiles.data.profiles.find((profile) => profile.id === "missing-verification");
  assert.equal(Boolean(projectProfile), true);
  assert.equal(projectProfile.valid, false);
  assert.equal(projectProfile.review.can_generate_baseline, false);
  assert.equal(projectProfile.validation_issues.some((issue) => issue.path === "technical_baseline" && /verification/.test(issue.message)), true);
});

test("build-vs-buy health surfaces missing reuse review before self-build", { tags: ["architecture"] }, () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  const draft = draftAndApprove(draftArgsFromGoal(root, "Ship a reusable infrastructure choice"));
  recordArchitectureRequirement(
    root,
    draft.data.goal_id,
    "required",
    "This fixture verifies build-vs-buy health under a required architecture baseline."
  );
  const payload = readGoalPayloadFromPaths(draft.data.acceptance_path, draft.data.evidence_path);
  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has user-reviewable evidence.`,
      "--result", "passing",
      "--source-command", "opennori status --root . --json",
      "--source-path", ".opennori/reports/build-vs-buy.report.md",
      "--reviewability", "Run status and inspect the report artifact.",
      "--limitations", "This fixture focuses on build-vs-buy health.",
      "--json"
    ]);
  }
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship a reusable infrastructure choice",
    "--goal-id", draft.data.goal_id,
    "--confirm",
    "--json"
  ]);

  run([
    "architecture", "build-vs-buy",
    "--root", root,
    "--id", "schema-validation",
    "--area", "schema-validation",
    "--need", "Validate OpenNori project state",
    "--recommendation", "reuse",
    "--summary", "Use a schema validation library when state contracts grow.",
    "--current-project", "No existing runtime schema dependency.",
    "--standard-library", "Node has JSON.parse but no schema validation.",
    "--official-sdk", "No official OpenNori SDK applies.",
    "--open-source", "Ajv, Zod, Valibot, TypeBox were reviewed.",
    "--json"
  ]);

  const healthy = run(["check", "--root", root, "--json"]);
  assert.equal(healthy.data.architecture_check.architecture.build_vs_buy.status, "clear");
  assert.equal(healthy.warnings.some((warning) => warning.type === "build_vs_buy"), false);
  assert.equal(healthy.data.architecture_check.architecture.build_vs_buy_decisions[0].open_source.includes("Ajv"), true);
  const ready = run(["doctor", "--root", root, "--json"]);
  assert.equal(ready.data.checks.find((check) => check.name === "build_vs_buy_health").ok, true);

  run([
    "architecture", "build-vs-buy",
    "--root", root,
    "--id", "custom-markdown-parser",
    "--area", "markdown",
    "--need", "Parse editable OpenNori markdown",
    "--recommendation", "self-build",
    "--summary", "Keep parsing local for now.",
    "--current-project", "Current parser uses a local regex helper.",
    "--standard-library", "Node has no markdown parser.",
    "--official-sdk", "No official SDK applies.",
    "--json"
  ]);

  const unhealthy = run(["check", "--root", root, "--json"]);
  assert.equal(unhealthy.data.architecture_check.architecture.build_vs_buy.status, "needs-action");
  assert.equal(unhealthy.warnings.some((warning) => warning.type === "build_vs_buy" && warning.issue === "missing-open-source"), true);
  assert.equal(unhealthy.warnings.some((warning) => warning.type === "build_vs_buy" && warning.issue === "missing-self-build-reason"), true);
  assert.equal(unhealthy.next_actions.some((action) => /build_vs_buy/.test(action)), true);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.current_gap, null);
  assert.equal(status.data.completion.objective_complete, true);
  assert.equal(status.data.completion.confidence, "review-risk");
  assert.equal(status.data.completion.review_risks.includes("build_vs_buy"), true);
  assert.equal(status.data.next_recommendation.status, "completion-review-required");
  assert.equal(status.data.next_recommendation.actions.some((action) => /build_vs_buy/.test(action)), true);
  assert.equal(status.data.criteria.some((criterion) => /^ARCH-/.test(criterion.id)), false);

  const report = run(["report", "--root", root, "--json"]);
  assert.equal(report.data.completion.confidence, "review-risk");
  assert.equal(report.data.completion.review_risks.includes("build_vs_buy"), true);
  assert.match(fs.readFileSync(report.data.report_path, "utf8"), /Review risks: build_vs_buy/);

  const doctorPayload = run(["doctor", "--root", root, "--json"]);
  const buildVsBuyCheck = doctorPayload.data.checks.find((check) => check.name === "build_vs_buy_health");
  assert.equal(buildVsBuyCheck.ok, false);
  assert.match(buildVsBuyCheck.summary, /build-vs-buy issue/);

  const decisionPath = path.join(root, ".opennori", "architecture", "decisions", "custom-markdown-parser.json");
  const invalidDecision = JSON.parse(fs.readFileSync(decisionPath, "utf8"));
  invalidDecision.recommendation = "maybe";
  fs.writeFileSync(decisionPath, `${JSON.stringify(invalidDecision, null, 2)}\n`);
  const schemaBroken = run(["check", "--root", root, "--json"]);
  assert.equal(schemaBroken.data.architecture_check.architecture.build_vs_buy.status, "broken");
  assert.equal(schemaBroken.warnings.some((warning) => warning.type === "build_vs_buy" && warning.issue === "schema-invalid-decision"), true);
});

test("superseded build-vs-buy decisions stay reviewable without blocking current health", { tags: ["architecture"] }, () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  run([
    "architecture", "build-vs-buy",
    "--root", root,
    "--id", "old-config-choice",
    "--area", "config",
    "--need", "Choose an earlier local configuration format",
    "--recommendation", "self-build",
    "--status", "superseded",
    "--superseded-by", "protocol-state-validation-ajv-runtime-public-json-schema",
    "--superseded-reason", "The confirmed Architecture Baseline now uses public JSON Schema for protocol state.",
    "--summary", "Old local config decision retained for history.",
    "--current-project", "Previous implementation used small local shape checks.",
    "--standard-library", "JSON.parse was available for syntax checks.",
    "--official-sdk", "No official SDK applies.",
    "--json"
  ]);

  const status = run(["architecture", "show", "--root", root, "--json"]);
  assert.equal(status.data.architecture.build_vs_buy_decisions.length, 1);
  assert.equal(status.data.architecture.build_vs_buy_decisions[0].status, "superseded");
  assert.equal(status.data.architecture.build_vs_buy.status, "clear");
  assert.equal(status.data.architecture.build_vs_buy.decision_count, 0);
  assert.equal(status.data.architecture.build_vs_buy.superseded_decision_count, 1);
});
