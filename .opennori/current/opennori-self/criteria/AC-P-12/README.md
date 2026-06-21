# AC-P-12 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我让 agent 升级或继续一个已经使用 OpenNori 的项目时，能看到 agent 会用 OpenNori Skills 复核旧 AC 是否仍足够可验收，但项目状态检查不会把主观 AC 质量写成硬编码 CLI 裁判。

Measurement: 查看 opennori upgrade/check 的项目状态输出、nori-acceptance Skill、nori-reporting Skill、README 和测试，确认旧 contract 不被自动改写，主观 AC 复核由 agent 提问和用户确认完成。

Passing threshold: upgrade/check 保留并报告现有 contract/evidence/report 状态，不因固定词表重写或 hard-fail 旧 AC；测试不再断言某句自然语言必须触发特定 gap id 或问题文本；Skills 明确要求 agent 对“修改字段”“整体情况”“长期资产”等含糊表述追问具体入口、对象、规则、状态、失败恢复和边界。

## Evidence

Latest: skill-boundary-review - Existing-project AC review is now Skill-driven rather than a CLI word-list audit: tests no longer assert natural-language ACs must trigger fixed gap ids/questions; discover tests only cover question-source state; project-health, acceptance, reporting, root Skills, AGENTS, README, and protocol tell agents to inspect vague old ACs and ask user-facing questions without mutating existing contracts.
Result: passing
Basis: tool-observation
Reviewability: Rerun npm run check, inspect discovery/check tests for objective assertions only, and read the packaged Skills to verify agent-side rules for reviewing vague existing ACs.
Limitations: This protects OpenNori from hard-coded subjective AC-quality tests and validators. Real old-project AC revision still depends on the agent loading the Skills and the user confirming the revised contract.

Sources:
- npm run check
- test/core.test.js
- plugins/opennori/skills/nori-project-health/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- plugins/opennori/skills/nori-reporting/SKILL.md
- plugins/opennori/skills/nori/SKILL.md
- .opennori/protocol.md
- README.md
- examples/opennori-self.json

## Files

- Criterion source: criteria/AC-P-12/criterion.json
- Status projection: criteria/AC-P-12/status.json
- Evidence ledger: criteria/AC-P-12/evidence
- Artifacts: criteria/AC-P-12/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
