# AC-O-16 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: high
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我要求 OpenNori autogoal 增强模式后，能从 agent 回复、draft 状态和 report/status 中看出 Enhanced Discovery 是否真的被使用，而不是只能相信 agent 自称用了增强模式。

Measurement: 查看 nori-autogoal/nori Skills、OpenNori protocol、AGENTS、README、draft markdown/status/report 输出和测试。

Passing threshold: 增强 autogoal 的用户可见回复必须包含 Enhanced Discovery checked；标准 Nori Contract Draft 的 acceptance_basis 必须持久化 source=autogoal、mode=enhanced、coverage_summary、assumptions、open_questions 和可选 out_of_scope；opennori status/resume/report 和 acceptance markdown 能展示这些来源元数据；缺少该确认面时 Skill 不得要求用户 approve；该机制不创建新 CLI、新产物、过程日志或主观 hard validator。

## Evidence

Latest: review-result - Enhanced autogoal now leaves a user-visible confirmation surface: Skill replies must show Enhanced Discovery checked, drafts persist source/mode/coverage metadata, and status/report/acceptance markdown expose that metadata for review.
Result: passing
Basis: tool-observation
Reviewability: Review the listed Skills, protocol, README, CLI rendering code, tests, and website copy; run the enhanced autogoal targeted Vitest command, npm run check, opennori status/check, and opennori-site pnpm build.
Limitations: This verifies persisted and visible confirmation surfaces for enhanced autogoal. It intentionally does not make CLI judge whether the agent's scenario expansion is subjectively sufficient; users still review and confirm the draft.

Sources:
- artifact:plugins/opennori/skills/nori-autogoal/SKILL.md
- artifact:plugins/opennori/skills/nori/SKILL.md
- artifact:.opennori/protocol.md
- artifact:AGENTS.md
- artifact:README.md
- artifact:src/core/contract.ts
- artifact:src/core/report.ts
- artifact:src/cli/commands/acceptance/runtime-status.ts
- artifact:src/cli/commands/acceptance/draft.ts
- artifact:src/cli/human-output.ts
- artifact:test/core.test.js
- artifact:test/cli-commands.test.js
- artifact:../opennori-site/src/pages/index.astro

## Files

- Criterion source: criteria/AC-O-16/criterion.json
- Status projection: criteria/AC-O-16/status.json
- Evidence ledger: criteria/AC-O-16/evidence
- Artifacts: criteria/AC-O-16/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
