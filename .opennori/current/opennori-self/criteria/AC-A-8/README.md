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

Latest: lifecycle-adapter-parser-boundary-verification - Lifecycle external command parsing is kept inside adapters: setup and plugin-sync consume Codex/npm probe objects, and the Codex Plugin adapter now tolerates minor plugin-list stdout status/spacing/version format drift without pushing parsing logic into lifecycle orchestration.
Result: passing
Basis: tool-observation
Reviewability: Inspect the adapter implementation and tests. setup.ts and plugin-sync.ts should call inspectCodexMarketplace/inspectCodexPlugin instead of parsing stdout directly; lifecycle-adapters.test.ts covers status/spacing/version drift inside the adapter.
Limitations: This still depends on text output from the Codex CLI because no structured Codex Plugin SDK/JSON probe is used here. If one becomes available, OpenNori should revisit this adapter.

Sources:
- .opennori/architecture/evidence/opennori-self-lifecycle-adapter-parser-boundary.json
- npx vitest run test/lifecycle-adapters.test.ts
- npm run test:lifecycle
- npx tsc --noEmit --pretty false
- npm run lint
- src/lifecycle/adapters/codex-plugin.ts
- src/lifecycle/setup.ts
- src/lifecycle/plugin-sync.ts
- test/lifecycle-adapters.test.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
