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

Latest: activity-command-boundary-refactor - Activity CLI internals now separate citty argument definitions, activity input/target normalization, dashboard signal payload writing, and snapshot summary response projection. The opennori activity commands still publish only dashboard_activity_only signals, return no full snapshot payload, and do not write Product AC evidence or contract state.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed activity command modules. Confirm activity.ts only defines commands, args.ts defines CLI args, input.ts normalizes target/input, payload.ts performs dashboard signal writes and refreshes the snapshot projection, and response.ts returns only a compact snapshot_summary with side_effect dashboard_activity_only. Rerun the listed commands.
Limitations: This verifies CLI activity boundary and tests. It does not add new dashboard UI behavior or long-running agent telemetry beyond the existing activity/event projections.

Sources:
- .opennori/architecture/evidence/opennori-self-activity-command-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:dashboard
- npm run test:cli
- npm run lint
- node ./bin/opennori.js check --root . --json
- node ./bin/opennori.js status --root . --json
- node ./bin/opennori.js activity show --root . --json
- src/cli/commands/activity.ts
- src/cli/commands/activity/args.ts
- src/cli/commands/activity/input.ts
- src/cli/commands/activity/payload.ts
- src/cli/commands/activity/response.ts
- test/cli-dashboard.test.js
- test/cli-human-output.test.js

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
