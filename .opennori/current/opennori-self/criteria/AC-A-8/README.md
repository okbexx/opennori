# AC-A-8 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: reviewed
Required: yes
Risk: high

## Criterion

User story: 作为用户，我查看 OpenNori 自身 dogfood 状态时，能知道 Architecture Baseline 已建立，但后续架构修复是否真的完成不能被最小可运行结果误报。

Measurement: 查看 OpenNori 自身 status/report、Architecture Baseline、build-vs-buy decision、代码结构审查和后续架构修复证据。

Passing threshold: 报告能清楚显示 baseline 已建立、当前仍有哪些架构风险或未完成缺口；如果核心结构仍未完成修复，目标不能显示 complete。

## Evidence

Latest: protocol-check - Markdown dossier authority boundary was tightened: opennori help now exposes --dossier as the explicit Nori Contract dossier locator, legacy --acceptance is described as README locator only, status reads structured JSON even when README content is forged, and protocol marker text matches generated README output.
Result: passing
Basis: tool-observation
Reviewability: Run the two test commands and inspect evidence add --help plus the listed source files; the acceptance test explicitly forges README content and verifies status still reads criterion JSON.
Limitations: This keeps legacy --acceptance/--evidence option names for compatibility while steering new explicit path usage to --dossier.

Sources:
- /Users/jarl/code/jarlone/opennori/.opennori/architecture/evidence/opennori-self-markdown-dossier-authority-boundary.json
- npx vitest run test/acceptance.test.js test/module-boundaries.test.js
- npx tsc --noEmit --pretty false
- node ./bin/opennori.js evidence add --help
- src/cli/active-goal-store.ts
- src/cli/active-goal-args.ts
- test/acceptance.test.js
- test/module-boundaries.test.js
- .opennori/protocol.md

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
