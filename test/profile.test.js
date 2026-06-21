import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { run, tempRoot, draftAndApprove, readGoalPayloadFromPaths } from "./support/cli.js";

test("Project Profile records required skills and blocks completion until satisfied", { tags: ["profile"] }, () => {
  const root = tempRoot();
  const init = draftAndApprove([
    "--goal", "Build a frontend page",
    "--root", root,
    "--json"
  ], { summary: "User approved frontend acceptance criteria." });
  const payload = readGoalPayloadFromPaths(init.data.acceptance_path, init.data.evidence_path);

  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} is satisfied.`,
      "--result", "passing",
      "--json"
    ]);
  }

  const must = run([
    "profile", "add",
    "--root", root,
    "--type", "skill",
    "--name", "design-taste-frontend",
    "--strength", "must",
    "--purpose", "Generate design read and global theme tokens before implementation.",
    "--scope", "landing pages, portfolios, and redesigns",
    "--install-policy", "existing_only",
    "--json"
  ]);
  assert.equal(must.data.workflow_status, "blocked");
  assert.equal(must.data.current_gap.id, "PROFILE-skill-design-taste-frontend");
  assert.equal(fs.existsSync(path.join(root, ".opennori", "profile", "profile.json")), true);

  const prefer = run([
    "profile", "add",
    "--root", root,
    "--type", "stack",
    "--name", "radix-ui",
    "--strength", "prefer",
    "--purpose", "Use accessible primitives for custom components.",
    "--install-policy", "ask_before_install",
    "--json"
  ]);
  assert.equal(prefer.data.compliance.statuses.some((item) => item.name === "radix-ui" && item.strength === "prefer"), true);

  const afterEvidence = run([
    "profile", "evidence",
    "--root", root,
    "--item", "skill-design-taste-frontend",
    "--result", "satisfied",
    "--summary", "Agent used design-taste-frontend for the design read and theme token pass.",
    "--path", "/Users/jarl/.agents/skills/design-taste-frontend/SKILL.md",
    "--json"
  ]);
  assert.equal(afterEvidence.data.workflow_status, "complete");

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(text, /Project Profile Compliance/);
  assert.match(text, /design-taste-frontend/);
  assert.match(text, /radix-ui/);
});

test("preferred profile items create review risk without blocking objective completion", { tags: ["profile"] }, () => {
  const root = tempRoot();
  const init = draftAndApprove([
    "--goal", "Build a frontend page",
    "--root", root,
    "--json"
  ], { summary: "User approved frontend acceptance criteria." });
  const payload = readGoalPayloadFromPaths(init.data.acceptance_path, init.data.evidence_path);

  for (const criterion of Object.keys(payload.ledger.criteria)) {
    run([
      "evidence", "add",
      "--root", root,
      "--criterion", criterion,
      "--kind", "test-summary",
      "--summary", `${criterion} is satisfied.`,
      "--result", "passing",
      "--source-command", "npm test",
      "--reviewability", "Run npm test and inspect the completed UI.",
      "--limitations", "Profile preference still needs review.",
      "--json"
    ]);
  }

  const preferred = run([
    "profile", "add",
    "--root", root,
    "--type", "stack",
    "--name", "radix-ui",
    "--strength", "prefer",
    "--purpose", "Use accessible primitives for custom components.",
    "--install-policy", "ask_before_install",
    "--json"
  ]);
  assert.equal(preferred.data.workflow_status, "complete");
  assert.equal(preferred.data.current_gap, null);
  assert.equal(preferred.data.compliance.review.some((item) => item.name === "radix-ui" && item.status === "unknown"), true);

  const status = run(["status", "--root", root, "--json"]);
  assert.equal(status.data.completion.objective_complete, true);
  assert.equal(status.data.completion.confidence, "review-risk");
  assert.equal(status.data.completion.review_risks.includes("profile_review"), true);
  assert.equal(status.data.next_recommendation.status, "completion-review-required");

  const check = run(["check", "--root", root, "--json"]);
  assert.equal(check.ok, true);
  assert.equal(check.data.capability_compliance.review.some((item) => item.name === "radix-ui"), true);
  assert.equal(check.warnings.some((warning) => warning.type === "profile_review" && warning.item_id === "stack-radix-ui"), true);

  const report = run(["report", "--root", root, "--json"]);
  const text = fs.readFileSync(report.data.report_path, "utf8");
  assert.match(text, /Review risks: profile_review/);
  assert.match(text, /Profile review risks:/);
  assert.match(text, /radix-ui is unknown \(prefer\)/);
});

test("profile check automatically checks local Skills and package stacks without forcing adapters", { tags: ["profile"] }, () => {
  const root = tempRoot();
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({
    dependencies: {
      "radix-ui": "1.0.0",
      "forbidden-lib": "1.0.0"
    }
  }));
  const init = draftAndApprove([
    "--goal", "Build a frontend page",
    "--root", root,
    "--json"
  ], { summary: "User approved frontend acceptance criteria." });

  run([
    "profile", "add",
    "--root", root,
    "--type", "skill",
    "--name", "design-taste-frontend",
    "--strength", "must",
    "--purpose", "Use the design Skill.",
    "--install-policy", "existing_only",
    "--json"
  ]);
  run([
    "profile", "add",
    "--root", root,
    "--type", "stack",
    "--name", "radix-ui",
    "--strength", "prefer",
    "--purpose", "Use accessible primitives.",
    "--json"
  ]);
  run([
    "profile", "add",
    "--root", root,
    "--type", "stack",
    "--name", "forbidden-lib",
    "--strength", "avoid",
    "--purpose", "Avoid this library.",
    "--json"
  ]);

  const checked = run(["profile", "check", "--root", root, "--json"]);
  assert.equal(checked.data.recorded, false);
  assert.equal(checked.data.checks.some((item) => item.item_id === "skill-design-taste-frontend" && item.result === "satisfied"), true);
  assert.equal(checked.data.checks.some((item) => item.item_id === "stack-radix-ui" && item.result === "satisfied"), true);
  assert.equal(checked.data.checks.some((item) => item.item_id === "stack-forbidden-lib" && item.result === "violated"), true);
  let payload = readGoalPayloadFromPaths(init.data.acceptance_path, init.data.evidence_path);
  assert.equal((payload.ledger.profile_evidence || []).length, 0);

  const recorded = run(["profile", "check", "--root", root, "--record", "--json"]);
  assert.equal(recorded.data.recorded, true);
  assert.equal(recorded.data.compliance.statuses.some((item) => item.id === "stack-forbidden-lib" && item.status === "violated"), true);
  assert.equal(recorded.data.workflow_status, "blocked");
  payload = readGoalPayloadFromPaths(init.data.acceptance_path, init.data.evidence_path);
  assert.equal(payload.ledger.profile_evidence.length, 3);
});
