import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { packagePath } from "./package-root.js";

const SKILLS_DIR = packagePath("skills");
const PREFERRED_SKILL_ORDER = [
  "nori",
  "nori-acceptance",
  "nori-evidence",
  "nori-capability-profile",
  "nori-architecture-brainstorm",
  "nori-architecture-apply",
  "nori-architecture-challenge",
  "nori-build-vs-buy",
  "nori-project-health",
  "nori-reporting"
];

function readSkillAsset(name) {
  const filePath = path.join(SKILLS_DIR, name, "SKILL.md");
  const markdown = fs.readFileSync(filePath, "utf8");
  const match = markdown.match(/^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    throw new Error(`OpenNori Skill ${name} is missing YAML frontmatter in ${filePath}`);
  }

  const frontmatter = parseYaml(match[1]) || {};
  const skillName = String(frontmatter.name || "").trim();
  const description = String(frontmatter.description || "").trim();
  if (!skillName) throw new Error(`OpenNori Skill ${name} is missing frontmatter name`);
  if (!description) throw new Error(`OpenNori Skill ${name} is missing frontmatter description`);

  return {
    name: skillName,
    description,
    asset_path: filePath,
    markdown
  };
}

function skillAssetNames() {
  if (!fs.existsSync(SKILLS_DIR)) {
    throw new Error(`OpenNori Skill asset directory is missing: ${SKILLS_DIR}`);
  }

  const order = new Map(PREFERRED_SKILL_ORDER.map((name, index) => [name, index]));
  return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(SKILLS_DIR, name, "SKILL.md")))
    .sort((left, right) => {
      const leftOrder = order.has(left) ? order.get(left) : Number.MAX_SAFE_INTEGER;
      const rightOrder = order.has(right) ? order.get(right) : Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return left.localeCompare(right);
    });
}

export const SKILL_PACK = skillAssetNames().map(readSkillAsset);

export function skillMarkdown(skill) {
  return skill.markdown;
}

export function exportedSkillMarkdown() {
  const nori = SKILL_PACK.find((skill) => skill.name === "nori");
  if (!nori) throw new Error("OpenNori Skill Pack is missing the nori entrypoint Skill");
  return skillMarkdown(nori);
}

export function skillPackMarkdowns() {
  return Object.fromEntries(SKILL_PACK.map((skill) => [skill.name, skillMarkdown(skill)]));
}
