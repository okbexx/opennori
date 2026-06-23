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

Latest: architecture-refactor-verification - OpenNori lifecycle capability-bundle infrastructure now has a shared external-actions module for command runner, command display, action preview, summary counts, and applied/failed command results. setup.ts and plugin-sync.ts keep their product-specific setup and plugin sync logic, but no longer duplicate the same external command planning/execution infrastructure. Verified that setup and plugin sync preview outputs still expose the same setup-plan/plugin-sync-plan action surfaces and that lifecycle/CLI/typecheck checks pass.
Result: passing
Basis: tool-observation
Reviewability: Inspect external-actions.ts for the shared runner/action/summary/apply helpers, then inspect setup.ts and plugin-sync.ts to confirm they keep product-specific bundle logic while delegating shared command infrastructure. Rerun the listed tests and preview commands; setup should still produce opennori/setup-plan-v1 and plugin sync should still produce opennori/plugin-sync-plan-v1.
Limitations: This verifies setup/plugin-sync shared lifecycle infrastructure and preview behavior. It does not yet refactor install/upgrade/uninstall managed-file planning or lifecycle doctor internals.

Sources:
- .opennori/architecture/evidence/opennori-self-lifecycle-external-actions-boundary.json
- npm run test:lifecycle
- npm run test:cli
- npx tsc --noEmit --pretty false
- node ./bin/opennori.js setup --root /tmp/opennori-lifecycle-preview --json
- node ./bin/opennori.js plugin sync --json
- git diff --check
- src/lifecycle/external-actions.ts
- src/lifecycle/setup.ts
- src/lifecycle/plugin-sync.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
