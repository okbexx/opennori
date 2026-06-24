import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { parse as parseYaml } from "yaml";
import { buildContractFromBrief, validateContract } from "../src/core.ts";
import { validateSchema } from "../src/validation.ts";
import { ROOT, run, tempRoot, draftArgsFromGoal, draftAndApprove, recordArchitectureRequirement } from "./support/cli.js";

const EXPECTED_SKILL_NAMES = [
  "nori",
  "nori-acceptance",
  "nori-architecture-apply",
  "nori-architecture-brainstorm",
  "nori-architecture-challenge",
  "nori-autogoal",
  "nori-build-vs-buy",
  "nori-capability-profile",
  "nori-evidence",
  "nori-loop-engineer",
  "nori-project-health",
  "nori-reporting"
];

function readSkillFrontmatter(skillPath) {
  const asset = fs.readFileSync(skillPath, "utf8");
  const match = asset.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  assert.ok(match, `${skillPath} must include YAML frontmatter`);
  return {
    asset,
    frontmatter: parseYaml(match[1] || "")
  };
}

test("protocol v1 example is structurally loadable", { tags: ["docs", "quick"] }, () => {
  const brief = JSON.parse(fs.readFileSync(path.join(ROOT, "examples", "opennori-self.json"), "utf8"));
  const contract = buildContractFromBrief(brief);
  const ids = contract.criteria.map((criterion) => criterion.id);
  assert.equal(contract.goal_id, brief.goal_id);
  assert.equal(contract.criteria.length > 0, true);
  assert.equal(new Set(ids).size, ids.length);
  for (const criterion of contract.criteria) {
    assert.equal(Boolean(criterion.id), true);
    assert.equal(Boolean(criterion.user_story), true);
    assert.equal(Boolean(criterion.measurement), true);
    assert.equal(Boolean(criterion.threshold), true);
    assert.equal(["protocol", "operator", "productization", "architecture", "acceptance"].includes(criterion.layer || "acceptance"), true);
  }
  assert.equal(contract.presentation.language, "zh-CN");
  assert.equal(contract.acceptance_basis.status, "approved");
});

test("Codex Plugin manifest exposes OpenNori Skills for agent discovery", { tags: ["docs"] }, () => {
  const pluginRoot = path.join(ROOT, "plugins", "opennori");
  const plugin = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"));
  const marketplace = JSON.parse(fs.readFileSync(path.join(ROOT, ".agents", "plugins", "marketplace.json"), "utf8"));
  assert.equal(plugin.name, "opennori");
  assert.equal(plugin.skills, "./skills/");
  assert.equal(plugin.interface.displayName, "OpenNori");
  assert.equal(plugin.interface.defaultPrompt.length >= 5, true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /Set up OpenNori/.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /autogoal/i.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /AC we just discussed/i.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /acceptance criteria/.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /Loop Engineer/i.test(prompt)), true);
  assert.equal(plugin.interface.defaultPrompt.some((prompt) => /dashboard.*live agent activity/i.test(prompt)), true);
  assert.equal(marketplace.name, "opennori");
  assert.equal(marketplace.interface.displayName, "OpenNori");
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, "opennori");
  assert.equal(marketplace.plugins[0].source.source, "local");
  assert.equal(marketplace.plugins[0].source.path, "./plugins/opennori");
  assert.equal(marketplace.plugins[0].policy.installation, "AVAILABLE");
  assert.equal(marketplace.plugins[0].policy.authentication, "ON_INSTALL");

  const names = fs.readdirSync(path.join(pluginRoot, "skills"))
    .filter((name) => fs.existsSync(path.join(pluginRoot, "skills", name, "SKILL.md")))
    .sort();
  assert.deepEqual(names.sort(), [...EXPECTED_SKILL_NAMES].sort());

  const behaviorProtocolSections = [
    "## Mission",
    "## Start Here",
    "## Natural-Language Mapping",
    "## State Writes",
    "## Handoffs",
    "## User Reply Shape",
    "## Misuse Guards"
  ];
  for (const name of names) {
    const { asset, frontmatter } = readSkillFrontmatter(path.join(pluginRoot, "skills", name, "SKILL.md"));
    assert.equal(frontmatter.name, name);
    assert.equal(typeof frontmatter.description, "string");
    assert.equal(frontmatter.description.trim().length > 80, true);
    for (const section of behaviorProtocolSections) {
      assert.match(asset, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.match(asset, /handoff|hand off/i);
    assert.doesNotMatch(asset, /install --skill/);
    assert.doesNotMatch(asset, /refresh-skill/);
    assert.doesNotMatch(asset, /skill export/);
  }
});

test("OpenNori Skill descriptions stay discovery metadata, not behavior snapshots", { tags: ["docs", "quick"] }, () => {
  const pluginRoot = path.join(ROOT, "plugins", "opennori");
  const descriptions = EXPECTED_SKILL_NAMES.map((name) => {
    const { frontmatter } = readSkillFrontmatter(path.join(pluginRoot, "skills", name, "SKILL.md"));
    return {
      name,
      description: String(frontmatter.description || "")
    };
  });

  for (const { name, description } of descriptions) {
    assert.equal(description.trim().length > 80, true, `${name} must have enough metadata for Codex discovery`);
    assert.equal(description.length < 900, true, `${name} frontmatter must not become the behavior protocol`);
    assert.equal(description.includes("\n"), false, `${name} description must stay one-line discovery metadata`);
    assert.match(description, /OpenNori|Nori|opennori/);
    assert.doesNotMatch(description, /install --skill|refresh-skill|skill export/);
  }
});

test("critical OpenNori Skill routing surfaces remain discoverable from metadata", { tags: ["docs", "quick"] }, () => {
  const pluginRoot = path.join(ROOT, "plugins", "opennori");
  const requiredMetadata = {
    nori: [
      /autogoal/i,
      /MCP context/i,
      /UI\/CRUD\/dashboard\/list\/form\/settings\/admin/,
      /operation paths/i,
      /Loop Engineer/i
    ],
    "nori-loop-engineer": [
      /acceptance loop/i,
      /what is next/i,
      /run to completion/i,
      /agent_next/i
    ],
    "nori-acceptance": [
      /human-centered OpenNori acceptance criteria/i,
      /UI\/CRUD\/dashboard\/list\/form\/settings\/admin/,
      /Acceptance Surface Modeling/i,
      /operation paths/i
    ],
    "nori-autogoal": [
      /enhanced autogoal/i,
      /self-grill/i,
      /complete product\/UI\/CRUD\/dashboard/i,
      /operation paths/i
    ],
    "nori-evidence": [
      /evidence/i,
      /broad UI\/CRUD\/dashboard evidence/i,
      /operation path/i,
      /confident passing/i
    ],
    "nori-reporting": [
      /completion decisions/i,
      /read-only MCP context/i,
      /broad UI\/CRUD\/dashboard\/list\/form\/settings\/admin AC/i,
      /operation paths/i
    ]
  };

  for (const [name, patterns] of Object.entries(requiredMetadata)) {
    const { frontmatter } = readSkillFrontmatter(path.join(pluginRoot, "skills", name, "SKILL.md"));
    const description = String(frontmatter.description || "");
    for (const pattern of patterns) {
      assert.match(description, pattern, `${name} metadata should expose ${pattern}`);
    }
  }
});

test("acceptance and autogoal Skills keep the one-AC review reply protocol", { tags: ["docs", "quick"] }, () => {
  const pluginRoot = path.join(ROOT, "plugins", "opennori");
  for (const name of ["nori-acceptance", "nori-autogoal"]) {
    const { asset } = readSkillFrontmatter(path.join(pluginRoot, "skills", name, "SKILL.md"));
    assert.match(asset, /Review progress: AC 1\/N/);
    assert.match(asset, /Reply `confirm AC-1` to continue to AC-2/);
    assert.match(asset, /`revise AC-1: \.\.\.`/);
    assert.match(asset, /Only reply `approve` after every AC has been confirmed one by one/);
    assert.match(asset, /确认进度：AC 1\/N/);
    assert.match(asset, /回复 `confirm AC-1` 继续确认 AC-2/);
    assert.match(asset, /只有全部 AC 逐条确认后/);
  }
});

test("public product surfaces present OpenNori as one capability bundle", { tags: ["docs", "quick"] }, () => {
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  const plugin = JSON.parse(fs.readFileSync(path.join(ROOT, "plugins", "opennori", ".codex-plugin", "plugin.json"), "utf8"));
  const nori = fs.readFileSync(path.join(ROOT, "plugins", "opennori", "skills", "nori", "SKILL.md"), "utf8");
  const health = fs.readFileSync(path.join(ROOT, "plugins", "opennori", "skills", "nori-project-health", "SKILL.md"), "utf8");
  const protocol = fs.readFileSync(path.join(ROOT, ".opennori", "protocol.md"), "utf8");

  for (const text of [readme, plugin.interface.longDescription, nori, health, protocol]) {
    assert.match(text, /capability bundle/);
  }
  assert.match(readme, /deterministic state layer/);
  assert.match(readme, /not a separate product\s+path/);
  assert.match(readme, /npx opennori setup/);
  assert.match(readme, /opennori init/);
  assert.match(plugin.interface.longDescription, /npx opennori setup installs/);
  assert.match(plugin.interface.longDescription, /Do not treat Plugin, Skills, and CLI as separate user paths/);
  assert.match(nori, /Do not split OpenNori into separate Plugin, Skill, and CLI user paths/);
  assert.match(nori, /npx opennori setup/);
  assert.match(health, /half-installed/);
  assert.match(health, /opennori init/);
  assert.match(protocol, /Direct CLI use\s+is an advanced, automation, or debugging route/);
  assert.match(readme, /one user-facing Nori Contract stored as a goal\s+dossier/);
  assert.match(readme, /each `criteria\/<AC-id>\/` directory keeps that AC's criterion/);
  assert.match(readme, /每个 current 或 draft goal 对用户来说是一份 Nori Contract，物理上保存为 goal dossier/);
  assert.match(readme, /每条 AC 在 `criteria\/<AC-id>\/` 下拥有自己的 `criterion\.json`/);
  assert.match(protocol, /Language Preference/);
  assert.match(protocol, /<goal>\/contract\.json` as the goal-level Nori Contract source of truth/);
  assert.match(protocol, /<goal>\/ledger\.json` as the deterministic aggregate evidence\/status ledger/);
  assert.match(protocol, /<goal>\/criteria\/<AC-id>\/criterion\.json` as each AC source of truth/);
  assert.match(protocol, /<goal>\/criteria\/<AC-id>\/status\.json` as a rebuildable status projection/);

  for (const text of [readme, protocol]) {
    assert.doesNotMatch(text, /Choose one path/);
    assert.doesNotMatch(text, /Try the CLI once/);
    assert.doesNotMatch(text, /Pin the CLI to a project/);
    assert.doesNotMatch(text, /npm install -D opennori/);
    assert.doesNotMatch(text, /codex plugin marketplace add okbexx\/opennori/);
    assert.doesNotMatch(text, /npm install -g opennori@latest/);
  }
});

test("Skill dogfood evals are documented as human-review scenarios", { tags: ["docs"] }, () => {
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  const testing = fs.readFileSync(path.join(ROOT, "docs", "testing.md"), "utf8");
  const evals = fs.readFileSync(path.join(ROOT, "docs", "skill-evals.md"), "utf8");

  assert.match(readme, /docs\/skill-evals\.md/);
  assert.match(testing, /docs\/skill-evals\.md/);
  assert.match(evals, /not automated natural-language tests/i);
  assert.match(evals, /## Run Protocol/);
  assert.match(evals, /## Rubric/);
  assert.match(evals, /Enhanced Autogoal Todolist/);
  assert.match(evals, /Project CRUD Operation Paths/);
  assert.match(evals, /Complete Project Workbench/);
  assert.match(evals, /Evidence And Reporting Boundary/);
  assert.doesNotMatch(evals, /exact output snapshots as tests/i);
});

test("public JSON Schemas validate persisted OpenNori state and separate structure from semantics", { tags: ["schema"] }, () => {
  const root = tempRoot();
  run(["install", "--root", root, "--json"]);
  const current = draftAndApprove(draftArgsFromGoal(root, "Ship schema-backed OpenNori state"));
  recordArchitectureRequirement(
    root,
    current.data.goal_id,
    "required",
    "Schema-backed OpenNori state touches protocol, manifest, and architecture evidence files."
  );
  run([
    "architecture", "baseline",
    "--root", root,
    "--goal", "Ship schema-backed OpenNori state",
    "--goal-id", "ship-schema-backed-opennori-state",
    "--confirm",
    "--json"
  ]);
  run([
    "architecture", "build-vs-buy",
    "--root", root,
    "--id", "schema-validation",
    "--area", "schema-validation",
    "--need", "Validate persisted OpenNori state",
    "--recommendation", "reuse",
    "--summary", "Use JSON Schema and Ajv for structural validation.",
    "--current-project", "OpenNori writes JSON state files under .opennori.",
    "--standard-library", "JSON.parse only validates syntax.",
    "--official-sdk", "No official SDK applies.",
    "--open-source", "Ajv is the selected JSON Schema validator.",
    "--json"
  ]);
  run([
    "architecture", "apply",
    "--root", root,
    "--goal", "ship-schema-backed-opennori-state",
    "--criterion", "AC-1",
    "--summary", "AC-1 follows the confirmed schema-backed architecture.",
    "--fit", "The architecture apply record uses public schema-backed state.",
    "--implementation-focus", "Keep schema validation as structural protocol validation.",
    "--evidence", "Reviewed baseline and schema files.",
    "--json"
  ]);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "manifest.json"), "utf8"));
  const contract = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "current", current.data.goal_id, "contract.json"), "utf8"));
  const ledger = JSON.parse(fs.readFileSync(current.data.evidence_path, "utf8"));
  const evidence = { contract, ledger };
  const requirement = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "architecture", "requirements", "ship-schema-backed-opennori-state.json"), "utf8"));
  const baseline = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "architecture", "baseline.json"), "utf8"));
  const decision = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "architecture", "decisions", "schema-validation.json"), "utf8"));
  const applyRecord = JSON.parse(fs.readFileSync(path.join(root, ".opennori", "architecture", "evidence", "ship-schema-backed-opennori-state-ac-1-aligned.json"), "utf8"));

  assert.equal(validateSchema("manifest", manifest).valid, true);
  assert.equal(validateSchema("contract", contract).valid, true);
  assert.equal(validateSchema("ledger", ledger).valid, true);
  assert.equal(validateSchema("evidence-payload", evidence).valid, true);
  assert.equal(validateSchema("architecture-requirement", requirement).valid, true);
  assert.equal(validateSchema("architecture-baseline", baseline).valid, true);
  assert.equal(validateSchema("build-vs-buy", decision).valid, true);
  assert.equal(validateSchema("architecture-apply", applyRecord).valid, true);

  const invalidShape = validateSchema("evidence-payload", { contract: { goal: "missing required fields" }, ledger: {} });
  assert.equal(invalidShape.valid, false);
  assert.equal(invalidShape.errors.some((error) => error.path.includes("/contract")), true);

  contract.criteria[0].user_story = "Implementation detail only";
  assert.equal(validateSchema("contract", contract).valid, true);
  evidence.contract.criteria[0].user_story = "Implementation detail only";
  assert.equal(validateSchema("evidence-payload", evidence).valid, true);
  assert.equal(validateContract(evidence.contract, evidence.ledger).some((issue) => issue.path === "criteria[0].user_story"), false);
});
