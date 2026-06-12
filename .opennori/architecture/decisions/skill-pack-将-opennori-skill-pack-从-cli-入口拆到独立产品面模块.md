# skill-pack-将-opennori-skill-pack-从-cli-入口拆到独立产品面模块 Build-vs-Buy Decision

Area: skill-pack
Need: 将 OpenNori Skill Pack 从 CLI 入口拆到独立产品面模块
Recommendation: self-build
Status: superseded
Superseded by: skill-pack-directory-assets
Superseded reason: The confirmed Skill Pack architecture now uses package-local skills/*/SKILL.md directory assets instead of JS string bodies.

## Summary

Historical decision retained for review: OpenNori first extracted Skill Pack text from src/cli.js into src/skills.js, but still kept pure JavaScript string bodies.

## Candidates Checked

- Current project: The current project now has skills/<name>/SKILL.md source assets and src/skills.js reads them for export/install/manifest sync.
- Standard library: Node fs/path reads package-local Skill assets; no template engine is needed.
- Official SDK: OpenAI/Codex Skill convention defines directory-based SKILL.md assets with optional references/scripts/assets.
- Open source: vibecode-pro-max-kit and ECC remain the reference pattern for Skill directory organization and manifest-managed assets.

## Self-build Reason

The old JS string extraction is superseded; the remaining local code is small product glue for first-party Skill assets.
