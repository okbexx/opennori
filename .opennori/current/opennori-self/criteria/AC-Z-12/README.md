# AC-Z-12 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我安装或获取 OpenNori 后，agent 能通过一组职责清晰的 OpenNori Plugin Skills，把自然语言请求稳定映射到验收发现、架构基线、证据、能力偏好、项目健康、报告和下一轮候选目标，而不需要我记住 Skill 名或 CLI 参数。

Measurement: 查看 .codex-plugin/plugin.json、plugins/opennori/skills/nori*/SKILL.md、opennori doctor、opennori status/report/context export，以及典型自然语言场景下的 Skill 路由说明。

Passing threshold: OpenNori Plugin 包含总入口和 acceptance、autogoal、evidence、capability-profile、architecture、project-health、reporting、loop-engineer 子 Skill；install 不把 Skills 复制进用户项目；manifest 记录 plugin；doctor 能报告 packaged Skills 是否可用。

## Evidence

Latest: review-result - Loop Engineer is now part of the packaged OpenNori Skill Pack and Codex Plugin discovery surface.
Result: passing
Basis: protocol-check
Reviewability: Inspect the referenced Skill and Plugin files, rerun npm run test:docs, and verify the docs-schema expected Skill list includes nori-loop-engineer.
Limitations: This verifies package assets and discovery metadata in the source checkout; Codex must refresh the Plugin cache and start a new session before the new Skill is loaded locally.

Sources:
- .opennori/architecture/evidence/ac-z-12-loop-engineer-skill-pack.json
- npm run test:docs
- plugins/opennori/skills/nori-loop-engineer/SKILL.md
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/.codex-plugin/plugin.json
- test/docs-schema.test.js

## Files

- Criterion source: criteria/AC-Z-12/criterion.json
- Status projection: criteria/AC-Z-12/status.json
- Evidence ledger: criteria/AC-Z-12/evidence
- Artifacts: criteria/AC-Z-12/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
