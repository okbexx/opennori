# AC-A-11 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我让 agent 处理一个 OpenNori goal 时，能看到 Architecture Baseline 是否需要由 agent/user 明确判断并记录，而不是 CLI 因为存在 goal 就默认所有 AC 都必须走架构 review。

Measurement: 分别用简单 goal、非平凡 goal 和用户 waiver 场景检查 status/check/agent_next、architecture show、README/Skills 和测试；确认简单 goal 可以记录 architecture not_required 并直接进入 evidence，非平凡 goal 记录 required 后才路由 baseline，waiver 有明确 reason 和 review 风险表达。

Passing threshold: OpenNori 提供 architecture requirement 状态（unknown/required/not_required/waived）和记录入口；Skill 要求 agent 判断非平凡性并写入该状态；CLI 不再用 Boolean(goalId) 作为是否需要 baseline 的依据，只根据已记录 requirement、baseline、challenge、build-vs-buy 和 evidence 状态做确定性路由；该机制不把技术架构写成 Product AC，也不让 CLI 通过自然语言硬判非平凡。

## Evidence

Latest: review-result - OpenNori now records Architecture Requirement as explicit agent/user state and no longer treats Boolean(goalId) as requiring Architecture Baseline. Unknown routes to architecture_requirement_needs_decision; required routes to baseline review or current-gap work when baseline is valid; not_required routes to Product AC evidence; waived continues with review risk. Packaged Skills, README, protocol, AGENTS, schema, check/doctor/status/report/agent_next, and tests were updated.
Result: passing
Basis: tool-observation
Reviewability: Inspect the new requirement state schema/module/CLI, run status/check on required/not_required/waived fixtures, and rerun the listed typecheck and Vitest commands.
Limitations: Full npm run check may still fail in this sandbox if tests attempt to bind the local dashboard server to 127.0.0.1; the relevant non-dashboard targeted suites passed.

Sources:
- /Users/jarl/code/jarlone/opennori/.opennori/architecture/evidence/ac-a-11-architecture-requirement-routing.json
- npm run typecheck
- npx vitest run test/core.test.js --testNamePattern 'architecture|requirement|doctor|schema|high-risk|build-vs-buy|context export'
- npx vitest run test/cli-commands.test.js test/core.test.js --testNamePattern '^(?!.*human output summarizes doctor check status report and dashboard).*(architecture|requirement|doctor|schema|check command module|resume command module|status command module|report command module|high-risk|build-vs-buy|context export).*'
- src/architecture/requirement.ts
- src/cli/commands/architecture/requirement.ts
- schemas/architecture-requirement.schema.json
- plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md
- test/core.test.js

## Files

- Criterion source: criteria/AC-A-11/criterion.json
- Status projection: criteria/AC-A-11/status.json
- Evidence ledger: criteria/AC-A-11/evidence
- Artifacts: criteria/AC-A-11/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
