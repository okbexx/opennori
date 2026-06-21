# AC-O-14 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我在 agent 生成 Nori Contract Draft 后，不会一次面对一大段所有 AC 的理解，而是能从 AC-1 开始逐条确认 agent 对当前 AC 的具体理解，全部确认后再决定 approve。

Measurement: 阅读 nori、nori-acceptance、nori-autogoal packaged Skills、README、protocol、AGENTS、agent_next 输出和 draft next_actions，检查 draft 后是否要求 AC Review Loop：先概览，再逐条确认当前 AC。

Passing threshold: agent 在请求最终 approve 前必须先展示 compact overview，然后一次只解释当前 AC 的具体理解：精确用户入口、对象或字段、可见状态/提示/结果、不通过样例和具体证据对象；用户用 confirm AC-<n> 或 revise AC-<n>: ... 推进；全部 AC 逐条确认前不得运行 approve；批量解释、早期 approve 或泛化理解不能作为批准依据；该规则只在 Skill 行为协议、文档、agent_next 提示和资产测试中表达，不写成 CLI 主观 validator、实现计划或证据声明。

## Evidence

Latest: review-result - AC Review Loop now documents and tests the safe draft criterion add path, preventing agents from manually patching draft acceptance/evidence/manifest files when a missing AC is discovered.
Result: passing
Basis: artifact-review
Reviewability: Inspect the listed Skills, docs, CLI help text, and tests; rerun the two targeted Vitest commands to confirm draft criterion add keeps drafts unapproved and synchronized.
Limitations: This verifies the packaged OpenNori assets and CLI behavior in this source checkout. Future Codex sessions need plugin sync or a published package update before the new Skill wording is loaded.

Sources:
- npx vitest run test/core.test.js -t 'criterion add|Codex Plugin manifest exposes OpenNori Skills|public product surfaces'
- npx vitest run test/cli-commands.test.js -t 'criterion add'
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- README.md
- .opennori/protocol.md
- AGENTS.md
- test/core.test.js
- src/cli/commands/acceptance/criterion.ts

## Files

- Criterion source: criteria/AC-O-14/criterion.json
- Status projection: criteria/AC-O-14/status.json
- Evidence ledger: criteria/AC-O-14/evidence
- Artifacts: criteria/AC-O-14/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
