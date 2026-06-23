# AC-A-8 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我查看 OpenNori 自身 dogfood 状态时，能知道 Architecture Baseline 已建立，但后续架构修复是否真的完成不能被最小可运行结果误报。

Measurement: 查看 OpenNori 自身 status/report、Architecture Baseline、build-vs-buy decision、代码结构审查和后续架构修复证据。

Passing threshold: 报告能清楚显示 baseline 已建立、当前仍有哪些架构风险或未完成缺口；如果核心结构仍未完成修复，目标不能显示 complete。

## Evidence

Latest: core-review-projection-boundary-refactor - OpenNori now has a core ReviewState projection shared by lifecycle goalReviewState and report rendering. The projection derives current gap, completion, user intervention, acceptance review, evidence health, Project Profile compliance, and next recommendation from contract, ledger, Project Profile, and ArchitectureState. Lifecycle adds only agent_next, while report rendering consumes the same projection instead of recomputing a parallel outcome model.
Result: passing
Basis: tool-observation
Reviewability: Inspect src/core/review-state.ts and confirm it owns deterministic outcome projection below lifecycle and kernel. Inspect lifecycle/reporting files to confirm they consume that projection, and lifecycle alone adds agent_next. Rerun the listed commands.
Limitations: This verifies outcome projection sharing for lifecycle status/report/context surfaces. It does not change report Markdown structure, dashboard visuals, persisted protocol fields, or subjective Skill/user acceptance-quality review.

Sources:
- .opennori/architecture/evidence/opennori-self-core-review-projection-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:reporting
- npm run test:cli
- npx vitest run test/mcp.test.ts test/cli-reporting.test.js test/cli-human-output.test.js
- npm run lint
- node ./bin/opennori.js check --root . --json
- node ./bin/opennori.js status --root . --json
- node ./bin/opennori.js context export --root . --json
- src/core/review-state.ts
- src/lifecycle/goal-review-state.ts
- src/core/report-render.ts
- src/architecture/report.ts
- src/cli/commands/reporting.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
