# AC-A-5 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我查看 status/report 时，能看到 Product decision 和 Architecture decision 分开呈现。

Measurement: 运行 opennori status、opennori report 和 context export。

Passing threshold: 输出分别展示产品 AC 状态、Architecture Baseline 状态、open challenges、build-vs-buy decisions、当前缺口和下一步证据。

## Evidence

Latest: review-result - Status, report, and context export now pass ArchitectureState into completionAnswer/nextRecommendation so Product AC completion and Architecture decision are shown separately; missing or challenged architecture becomes architecture_review without replacing current_gap.
Result: passing
Basis: tool-observation
Reviewability: Run the targeted tests and inspect status/report/context export wiring plus the missing architecture baseline test.
Limitations: This verifies CLI/report surfaces; downstream UI or website renderers should continue to mirror the same fields.

Sources:
- npm run check
- npx vitest run test/core.test.js -t 'architecture|build-vs-buy'
- src/core/report.ts
- src/architecture/report.ts
- src/cli/commands/acceptance/runtime-status.ts
- src/lifecycle/context-export.ts
- test/core.test.js

## Files

- Criterion source: criteria/AC-A-5/criterion.json
- Status projection: criteria/AC-A-5/status.json
- Evidence ledger: criteria/AC-A-5/evidence
- Artifacts: criteria/AC-A-5/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
