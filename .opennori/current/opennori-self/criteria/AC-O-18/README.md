# AC-O-18 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: high
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我给 agent 一个 UI、CRUD、Dashboard、表单、列表、设置页、管理台或其它可见产品目标时，OpenNori 能让所有相关 Skills 先守住可验收表面模型，再写 AC、进入架构、记录证据、检查健康或报告完成，而不是生成、接受或绕过宽泛 outcome AC。

Measurement: 阅读全部 packaged Skills：nori、nori-acceptance、nori-autogoal、nori-evidence、nori-reporting、nori-architecture-brainstorm、nori-architecture-apply、nori-architecture-challenge、nori-build-vs-buy、nori-capability-profile、nori-project-health，以及 README、protocol、AGENTS 和资产测试；用项目 CRUD 目标检查新增、查看或选择、编辑、删除或解绑等 AC 是否描述用户入口、可见触发、交互面、字段或规则、反馈、状态变化、失败或取消边界和证据形态，并确认 architecture/profile/build-vs-buy/health 不能绕过该建模。

Passing threshold: Skills 把 Acceptance Surface Modeling 写成跨 Skill 的 agent runtime contract：draft、autogoal、AC Review Loop、evidence、reporting、architecture brainstorm/apply/challenge、build-vs-buy、capability profile 和 project health 都必须在可见产品表面缺少 actor、entry、visible trigger、object、action、interaction surface、required information、feedback、state change、persistence、destructive boundary 或 evidence shape 时回到 nori-acceptance；未知项要问单个会改变完成定义的问题，或写成明确假设进入 AC Review Loop；任何旁路都不能把宽泛 AC 当作 confidently acceptable；该机制不变成 CLI hard validator、固定目标类型词表、自然语言好坏单元测试或实现计划。

## Evidence

Latest: review-result - Acceptance Surface Modeling now covers all OpenNori packaged Skill bodies and frontmatter trigger descriptions. The root router and acceptance/autogoal Skills route broad UI/CRUD/dashboard/list/form/settings/admin goals into operation-path modeling; evidence/reporting refuse confident passing/completion without the modeled path; architecture brainstorm/apply/challenge, build-vs-buy, capability profile, and project health route missing product-surface semantics back to nori-acceptance instead of bypassing Product AC. The behavior remains Skill/user review plus asset tests, not a CLI hard validator or fixed natural-language AC-quality test.
Result: passing
Basis: tool-observation
Reviewability: Inspect every listed packaged Skill, especially frontmatter description and Misuse Guards. Rerun the targeted Vitest command, npm run check, the Node frontmatter read-back script, and git diff --check.
Limitations: This proves the packaged Skill behavior protocols, trigger metadata, docs, and tests encode the operation-path boundary. It does not prove every future agent will ask perfect product questions; users still confirm or revise AC through the AC Review Loop.

Sources:
- .opennori/architecture/evidence/opennori-self-ac-o-18-aligned.json
- npx vitest run test/core.test.js --testNamePattern 'protocol v1 example|Codex Plugin manifest'
- npm run check
- node -e frontmatter skill metadata read-back
- git diff --check
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- plugins/opennori/skills/nori-autogoal/SKILL.md
- plugins/opennori/skills/nori-evidence/SKILL.md
- plugins/opennori/skills/nori-reporting/SKILL.md
- plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md
- plugins/opennori/skills/nori-architecture-apply/SKILL.md
- plugins/opennori/skills/nori-architecture-challenge/SKILL.md
- plugins/opennori/skills/nori-build-vs-buy/SKILL.md
- plugins/opennori/skills/nori-capability-profile/SKILL.md
- plugins/opennori/skills/nori-project-health/SKILL.md
- test/core.test.js
- AGENTS.md
- README.md
- .opennori/protocol.md

## Files

- Criterion source: criteria/AC-O-18/criterion.json
- Status projection: criteria/AC-O-18/status.json
- Evidence ledger: criteria/AC-O-18/evidence
- Artifacts: criteria/AC-O-18/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
