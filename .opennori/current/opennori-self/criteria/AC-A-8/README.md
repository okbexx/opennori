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

Latest: goal-review-state-boundary-refactor - OpenNori now centralizes read-only goal outcome assembly in GoalReviewState. Status, resume, report, check, and context export share the same current gap, completion, intervention, acceptance review, evidence health, architecture, Project Profile compliance, next recommendation, and agent_next projection without adding any new state writer or subjective validator.
Result: passing
Basis: tool-observation
Reviewability: Inspect goal-review-state.ts and the listed command modules. Confirm the projection is read-only, uses existing core/domain computations, and does not write .opennori state. Rerun the listed commands and compare status/report/context export output shape.
Limitations: This centralizes outcome assembly for current CLI/report/context surfaces. Some lower-level helpers and dashboard snapshot builders still compute their own specialized projections and may be future cleanup candidates.

Sources:
- .opennori/architecture/evidence/opennori-self-goal-review-state-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:reporting
- npm run test:cli
- npx vitest run test/mcp.test.ts test/cli-acceptance.test.js test/cli-reporting.test.js test/cli-human-output.test.js
- npm run lint
- node ./bin/opennori.js check --root . --json
- node ./bin/opennori.js status --root . --json
- node ./bin/opennori.js context export --root . --json
- src/lifecycle/goal-review-state.ts
- src/lifecycle/context-export-state.ts
- src/cli/commands/acceptance/runtime-status.ts
- src/cli/commands/reporting.ts
- src/cli/commands/check.ts
- test/reporting.test.js
- test/cli-reporting.test.js
- test/cli-acceptance.test.js

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
