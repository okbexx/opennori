# AC-O-12 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: high
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我告诉 agent 要做完整产品、完整功能闭环、完整应用、完整 Dashboard 或完整工作台时，OpenNori 会让 agent 充分展开用户可验收 AC，而不是默认压缩成少量 MVP、第一版或 happy-path AC。

Measurement: 阅读 nori、nori-acceptance、nori-autogoal packaged Skills、本机 OpenNori 开发 Skills、OpenNori protocol、README、官网和自验收报告；用完整产品类目标检查 agent 是否会覆盖足够的验收面，并让用户显式确认保留完整闭环或缩小范围。

Passing threshold: Skills 明确要求完整产品类目标默认展开完整验收面，包括用户角色、入口与导航、核心工作流、状态转换、数据规则、权限与边界、失败与恢复、持久化、UI/UX、报告或审查方式；AC 数量可以按目标需要增加，执行仍按当前缺口推进；只有用户明确要求原型、MVP、第一版或缩小范围时，agent 才能压缩完成定义；该规则只写入 Skill 行为协议、文档、用户确认和资产测试，不写成 CLI hard validator 或固定自然语言词表。

## Evidence

Latest: review-result - OpenNori now instructs agents to expand complete product, complete feature, full app, full dashboard, and full workbench goals into a full human-reviewable acceptance surface instead of a compact MVP-style AC set. The rule is present in packaged Skills, local development Skills, protocol, README, Plugin prompt, objective asset tests, self example, and the public website content.
Result: passing
Basis: artifact-review
Reviewability: Review the listed Skill, documentation, example, test, and website files. Run the targeted asset tests and website build to confirm the rule remains present without adding a CLI subjective validator.
Limitations: This evidence proves the OpenNori product assets and user-facing website now express the complete-product acceptance behavior. It does not prove that every future agent will apply the Skill perfectly, and it intentionally does not add a hard-coded natural-language AC quality validator.

Sources:
- .opennori/architecture/evidence/ac-o-12-full-product-acceptance-surface.json
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- plugins/opennori/skills/nori-autogoal/SKILL.md
- /Users/jarl/code/jarlone/.agents/skills/nori-product-development/SKILL.md
- README.md
- .opennori/protocol.md
- AGENTS.md
- examples/opennori-self.json
- test/core.test.js
- /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro

## Files

- Criterion source: criteria/AC-O-12/criterion.json
- Status projection: criteria/AC-O-12/status.json
- Evidence ledger: criteria/AC-O-12/evidence
- Artifacts: criteria/AC-O-12/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
