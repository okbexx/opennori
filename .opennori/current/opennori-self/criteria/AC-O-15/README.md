# AC-O-15 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: high
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我要求 OpenNori autogoal 增强模式或让 agent 先自己 grill 一个粗略想法时，agent 会先自行展开使用场景、假设、边界和关键问题，再把结果收敛成标准 Nori Contract Draft。

Measurement: 阅读 nori、nori-autogoal packaged Skill、OpenNori protocol、README、官网和测试资产；用 todolist 这类粗略 idea 检查 agent 是否先做 Enhanced Discovery，而不是直接生成少量泛化 AC 或向用户抛完整问卷。

Passing threshold: Skills 明确要求增强 autogoal 仍是 Skill 行为而不是新 CLI 或新产物；agent 自行展开用户角色、入口、场景、数据对象与规则、状态转换、非法输入、成功反馈、持久化、失败/恢复、UI/UX、复查方式、假设和 out-of-scope；只把会改变完成定义的关键问题交给用户确认；最后仍写入标准 Nori Contract Draft，并进入逐条 AC Review Loop。

## Evidence

Latest: asset-review - Enhanced autogoal discovery is documented as nori-autogoal Skill behavior and surfaced in product docs/site/tests without adding a new CLI artifact.
Result: passing
Basis: artifact_review
Reviewability: Review the listed assets for Enhanced Discovery, self-grill/todolist routing, standard Nori Contract Draft output, and no new CLI command or artifact.
Limitations: This verifies packaged behavior instructions and documentation surfaces; real project quality still depends on the agent applying the Skill and the user confirming AC in conversation.

Sources:
- plugins/opennori/skills/nori-autogoal/SKILL.md
- plugins/opennori/skills/nori/SKILL.md
- .opennori/protocol.md
- README.md
- examples/opennori-self.json
- test/core.test.js
- ../opennori-site/src/pages/index.astro

## Files

- Criterion source: criteria/AC-O-15/criterion.json
- Status projection: criteria/AC-O-15/status.json
- Evidence ledger: criteria/AC-O-15/evidence
- Artifacts: criteria/AC-O-15/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
