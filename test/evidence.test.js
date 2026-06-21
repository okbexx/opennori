import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { run, tempRoot, writeBriefFile, draftArgsFromGoal, draftAndApprove, recordArchitectureRequirement, spawnJson, readGoalPayloadFromPaths } from "./support/cli.js";

test("blocked criteria produce a concrete intervention answer", { tags: ["evidence"] }, () => {
  const root = tempRoot();
  draftAndApprove(["--brief", "examples/opennori-self.json", "--root", root, "--json"]);

  const blocked = run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-O-5",
    "--kind", "human-confirmation",
    "--summary", "Choose whether OpenNori should pause or continue without external credentials.",
    "--result", "blocked",
    "--json"
  ]);
  assert.equal(blocked.data.workflow_status, "blocked");

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.intervention.required, true);
  assert.equal(status.data.intervention.criterion, "AC-O-5");
  assert.match(status.data.intervention.action, /Choose whether OpenNori should pause/);
});

test("high-risk agent observation stays objective passing but surfaces review risk", { tags: ["evidence"] }, () => {
  const root = tempRoot();
  const init = run(["draft", "--brief", "examples/opennori-self.json", "--root", root, "--json"]);
  recordArchitectureRequirement(
    root,
    init.data.goal_id,
    "not_required",
    "This fixture isolates evidence risk gating and does not evaluate architecture."
  );

  const weak = run([
    "evidence", "add",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--criterion", "AC-P-4",
    "--kind", "agent-summary",
    "--summary", "Agent says recovery works.",
    "--result", "passing",
    "--json"
  ]);

  assert.equal(weak.data.criterion_status, "passing");
  assert.equal(weak.data.confidence, "review-required");
  assert.equal(weak.data.gate, "accepted");
  assert.equal(weak.data.workflow_status, "active");
  assert.notEqual(weak.data.current_gap.id, "AC-P-4");

  const health = run([
    "check",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--root", root,
    "--json"
  ]);
  assert.equal(health.data.evidence_health.status, "review");
  assert.equal(health.warnings.some((warning) => warning.type === "evidence_health" && warning.issue === "high-risk-agent-observation"), true);

  const strong = run([
    "evidence", "add",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--criterion", "AC-P-4",
    "--kind", "review-result",
    "--summary", "Reviewer verified recovery from repository files.",
    "--result", "passing",
    "--confidence", "verified",
    "--json"
  ]);

  assert.equal(strong.data.criterion_status, "passing");
  assert.equal(strong.data.confidence, "verified");
  assert.equal(strong.data.gate, "accepted");

  const flexibleStrong = run([
    "evidence", "add",
    "--acceptance", init.data.acceptance_path,
    "--evidence", init.data.evidence_path,
    "--criterion", "AC-P-4",
    "--kind", "dogfood-doctor",
    "--basis", "tool-observation",
    "--summary", "Reviewer can rerun doctor and inspect the report artifact.",
    "--source-command", "opennori doctor --root . --json",
    "--source-path", ".opennori/reports/opennori-self.report.md",
    "--result", "passing",
    "--confidence", "verified",
    "--json"
  ]);

  assert.equal(flexibleStrong.data.criterion_status, "passing");
  assert.equal(flexibleStrong.data.confidence, "verified");
  assert.equal(flexibleStrong.data.gate, "accepted");
});

test("evidence records flexible reviewable sources without fixed adapters", { tags: ["evidence"] }, () => {
  const root = tempRoot();
  run(["draft", ...draftArgsFromGoal(root, "Ship a reviewable OpenNori task")]);
  run(["approve", "--root", root, "--summary", "User approved criteria.", "--json"]);

  const added = run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "agent-observation",
    "--basis", "tool-observation",
    "--summary", "The user-visible workflow can be reviewed from a command and an artifact.",
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
  ]);

  assert.equal(added.data.criterion_status, "passing");
  assert.equal(added.data.latest_evidence.basis, "tool-observation");
  assert.equal(added.data.latest_evidence.sources.length, 4);
  assert.equal(added.data.latest_evidence.reviewability, "User can rerun the command or open the artifact.");
  assert.equal(added.data.latest_evidence.limitations, "Browser-specific visual review was not performed.");

  const status = run(["status", "--root", root, "--json"]);
  const criterion = status.data.criteria.find((row) => row.id === "AC-1");
  assert.equal(criterion.latest_evidence.sources[0].command, "npm run check");
  assert.equal(criterion.latest_evidence.sources[1].label, "screenshots/reviewable-flow.png");
  assert.equal(criterion.latest_evidence.sources[2].type, "command");
  assert.equal(criterion.latest_evidence.sources[2].command, "npm run check");
  assert.equal(criterion.latest_evidence.sources[3].type, "url");
  assert.equal(criterion.latest_evidence.sources[3].url, "https://example.com/review");
  assert.equal(criterion.latest_evidence.sources.some((source) => source.path === "src/cli.ts"), false);

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(text, /Basis/);
  assert.match(text, /Sources/);
  assert.match(text, /Reviewability/);
  assert.match(text, /Limitations/);
  assert.match(text, /command=npm run check/);
  assert.match(text, /screenshots\/reviewable-flow\.png/);
  assert.match(text, /Browser-specific visual review was not performed/);
});

test("evidence health accepts custom non-context source shapes as reviewable", { tags: ["evidence"] }, () => {
  const root = tempRoot();
  draftAndApprove([
    "--brief", writeBriefFile(root, "Ship with custom review sources", {
      criteria: [
        {
          id: "AC-1",
          user_story: "As a user, I can inspect a screenshot-backed result.",
          measurement: "Open the referenced screenshot review source.",
          threshold: "The evidence health report accepts the screenshot source as reviewable.",
          risk: "medium"
        },
        {
          id: "AC-2",
          user_story: "As a user, I can inspect a diff-backed result.",
          measurement: "Open the referenced diff review source.",
          threshold: "The evidence health report accepts the diff source as reviewable.",
          risk: "medium"
        },
        {
          id: "AC-3",
          user_story: "As a user, I can inspect a log-backed result.",
          measurement: "Open the referenced log review source.",
          threshold: "The evidence health report accepts the log source as reviewable.",
          risk: "medium"
        }
      ]
    }),
    "--root", root,
    "--json"
  ], { summary: "User approved custom source shape test." });

  const customSources = [
    ["AC-1", "{\"type\":\"screenshot\",\"label\":\"settings-failure.png\",\"path\":\"https://example.com/settings-failure.png\"}"],
    ["AC-2", "{\"type\":\"diff\",\"label\":\"git diff -- src/settings.tsx\",\"summary\":\"Review the changed settings UI diff.\"}"],
    ["AC-3", "{\"type\":\"log\",\"label\":\"server error log excerpt\",\"summary\":\"Review the failed-save error log excerpt.\"}"]
  ];
  for (const [criterion, source] of customSources) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "review-result",
      "--basis", "artifact-review",
      "--summary", `${criterion} has a custom reviewable source.`,
      "--result", "passing",
      "--confidence", "verified",
      "--source", source,
      "--reviewability", "Inspect the custom evidence source.",
      "--limitations", "This fixture checks source shape handling, not business behavior.",
      "--json"
    ]);
  }

  const check = run(["check", "--root", root, "--json"]);
  assert.equal(check.data.evidence_health.status, "clear");
  assert.equal(check.warnings.some((warning) => warning.type === "evidence_health" && warning.issue === "missing-reviewable-source"), false);
});

test("concurrent evidence writes preserve every reviewable record", { tags: ["evidence"] }, async () => {
  const root = tempRoot();
  const current = draftAndApprove(draftArgsFromGoal(root, "Ship concurrent evidence safely"));
  const lockPath = path.join(root, ".opennori", ".locks", "active-goal.write.lock");
  fs.mkdirSync(lockPath, { recursive: true });

  const children = Array.from({ length: 4 }, (_, index) => {
    const id = `concurrent-${index + 1}`;
    return spawnJson([
      "evidence", "add",
      "--root", root,
      "--criterion", "AC-1",
      "--kind", "concurrency-check",
      "--basis", "tool-observation",
      "--summary", `Concurrent evidence ${id}`,
      "--source-command", `verify ${id}`,
      "--reviewability", `Review ${id}`,
      "--result", "passing",
      "--confidence", "verified",
      "--json"
    ]);
  });

  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(children.some(({ child }) => child.exitCode !== null), false);
  fs.rmSync(lockPath, { recursive: true, force: true });
  await Promise.all(children.map(({ done }) => done));

  const payload = readGoalPayloadFromPaths(current.data.acceptance_path, current.data.evidence_path);
  const evidence = payload.ledger.criteria["AC-1"].evidence;
  assert.equal(evidence.length, 4);
  assert.deepEqual(
    evidence.map((item) => item.summary).sort(),
    [
      "Concurrent evidence concurrent-1",
      "Concurrent evidence concurrent-2",
      "Concurrent evidence concurrent-3",
      "Concurrent evidence concurrent-4"
    ]
  );
});

test("check surfaces high-risk agent-observation evidence health without forcing adapter taxonomy", { tags: ["evidence"] }, () => {
  const weakRoot = tempRoot();
  draftAndApprove([
    "--brief", writeBriefFile(weakRoot, "Ship with weak evidence", {
      criteria: [
        {
          id: "AC-1",
          layer: "operator",
          user_story: "As a user, I can review a high-risk completion claim.",
          measurement: "Open the report and inspect the evidence for the high-risk result.",
          threshold: "The report exposes review risks when the claim is only an agent observation.",
          risk: "high"
        },
        {
          id: "AC-2",
          layer: "operator",
          user_story: "As a user, I can review a supporting command result.",
          measurement: "Run status and inspect the output.",
          threshold: "The output shows reviewable evidence."
        },
        {
          id: "AC-3",
          layer: "operator",
          user_story: "As a user, I can review a supporting report artifact.",
          measurement: "Open the report artifact.",
          threshold: "The artifact explains what was verified."
        }
      ]
    }),
    "--root", weakRoot,
    "--json"
  ], { summary: "User approved evidence health test." });
  run([
    "evidence", "add",
    "--root", weakRoot,
    "--criterion", "AC-1",
    "--kind", "agent-observation",
    "--basis", "agent-observation",
    "--summary", "Agent says AC-1 is complete.",
    "--result", "passing",
    "--json"
  ]);
  for (const criterion of ["AC-2", "AC-3"]) {
    run([
      "evidence", "add",
      "--root", weakRoot,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} has reviewable evidence.`,
      "--result", "passing",
      "--confidence", "verified",
      "--source-command", "opennori status --root . --json",
      "--reviewability", "Run status and inspect the result.",
      "--limitations", "This fixture focuses on evidence health semantics.",
      "--json"
    ]);
  }

  const weakCheck = run(["check", "--root", weakRoot, "--json"]);
  assert.equal(weakCheck.data.evidence_health.status, "review");
  assert.equal(weakCheck.warnings.some((warning) => warning.type === "evidence_health" && warning.issue === "high-risk-agent-observation"), true);
  assert.equal(weakCheck.warnings.some((warning) => warning.type === "evidence_health" && warning.issue === "missing-reviewable-source"), true);
  assert.equal(weakCheck.next_actions.some((action) => /evidence_health/.test(action)), true);

  const report = run(["report", "--root", weakRoot, "--json"]);
  assert.equal(report.data.completion.complete, true);
  assert.equal(report.data.completion.objective_complete, true);
  assert.equal(report.data.completion.confidence, "review-risk");
  assert.equal(report.data.completion.review_risks.includes("evidence_health"), true);
  assert.equal(report.data.evidence_health.status, "review");
  assert.match(fs.readFileSync(report.data.report_path, "utf8"), /## Evidence Health/);

  const strongRoot = tempRoot();
  draftAndApprove([
    "--goal", "Ship with reviewable evidence",
    "--root", strongRoot,
    "--json"
  ], { summary: "User approved evidence health test." });
  run([
    "evidence", "add",
    "--root", strongRoot,
    "--criterion", "AC-1",
    "--kind", "test-summary",
    "--summary", "User-visible status command shows completion and current gap.",
    "--result", "passing",
    "--confidence", "verified",
    "--source-command", "opennori status --root . --json",
    "--source-path", ".opennori/reports/example.report.md",
    "--reviewability", "Run the command and inspect the report artifact.",
    "--limitations", "This does not prove public website deployment.",
    "--json"
  ]);

  const strongCheck = run(["check", "--root", strongRoot, "--json"]);
  assert.equal(strongCheck.data.evidence_health.status, "clear");
  assert.equal(strongCheck.warnings.some((warning) => warning.type === "evidence_health"), false);
});

test("missing local artifact evidence is pruned and does not occupy report or context export", { tags: ["evidence"] }, () => {
  const root = tempRoot();
  const current = draftAndApprove(draftArgsFromGoal(root, "Ship without stale evidence"));

  const stalePath = "docs/removed-proof.md";
  const added = run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "artifact",
    "--summary", "The user-visible operation was proven by an artifact that was later removed.",
    "--source-path", stalePath,
    "--reviewability", "Open the artifact.",
    "--limitations", "Only proves the local artifact existed.",
    "--confidence", "verified",
    "--result", "passing",
    "--json"
  ]);
  assert.equal(added.data.criterion_status, "unknown");
  assert.equal(added.data.latest_evidence, null);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.workflow_status, "active");
  assert.equal(status.data.current_gap.id, "AC-1");
  const criterion = status.data.criteria.find((row) => row.id === "AC-1");
  assert.equal(criterion.status, "unknown");
  assert.equal(criterion.latest_evidence, null);

  const evidencePath = current.data.evidence_path;
  const payload = readGoalPayloadFromPaths(current.data.acceptance_path, evidencePath);
  assert.equal(payload.ledger.criteria["AC-1"].evidence.length, 0);
  assert.equal(payload.ledger.criteria["AC-1"].status, "unknown");

  const exported = run(["context", "export", "--root", root, "--json"]);
  assert.equal(exported.data.criteria.find((row) => row.id === "AC-1").latest_evidence, null);
  assert.equal(JSON.stringify(exported.data).includes(stalePath), false);

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.doesNotMatch(text, /docs\/removed-proof\.md/);
  assert.match(text, /AC-1/);
});

test("agent can explicitly prune obsolete evidence before recording fresh proof", { tags: ["evidence"] }, () => {
  const root = tempRoot();
  draftAndApprove(draftArgsFromGoal(root, "Refresh obsolete evidence"));

  run([
    "evidence", "add",
    "--root", root,
    "--criterion", "AC-1",
    "--kind", "review-result",
    "--basis", "tool-observation",
    "--summary", "Old product behavior passed before the acceptance target changed.",
    "--source-command", "npm test",
    "--reviewability", "Rerun the old command.",
    "--limitations", "This evidence is obsolete after the product changed.",
    "--confidence", "verified",
    "--result", "passing",
    "--json"
  ]);

  const pruned = run([
    "evidence", "prune",
    "--root", root,
    "--criterion", "AC-1",
    "--reason", "Old product behavior no longer proves the current AC.",
    "--json"
  ]);
  assert.equal(pruned.data.evidence_prune.removed_records, 1);
  assert.equal(pruned.data.criterion_status, "unknown");
  assert.equal(pruned.data.current_gap.id, "AC-1");

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.doesNotMatch(text, /Old product behavior/);

  const exported = run(["context", "export", "--root", root, "--json"]);
  assert.equal(JSON.stringify(exported.data).includes("Old product behavior"), false);
});
