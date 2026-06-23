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

Latest: evidence-state-boundary-verification - Product evidence state boundaries were split so evidence.ts is a compatibility export; source normalization/path reviewability, context-only risk gate, evidence recording, workflow status/current gap, evidence view, stale pruning, and evidence health now live in separate core modules. Existing behavior is preserved across evidence/reporting/CLI/dashboard tests, typecheck, and doctor.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed core evidence modules to confirm each owns a distinct objective responsibility and evidence.ts remains a stable barrel. Rerun the listed focused verification commands.
Limitations: This proves the evidence state module boundary and behavior preservation for the current slice. It intentionally does not add subjective AC-quality validators or a fixed evidence adapter taxonomy.

Sources:
- .opennori/architecture/evidence/opennori-self-evidence-state-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:evidence
- npm run test:reporting
- npm run test:cli -- --run test/cli-evidence.test.js test/cli-reporting.test.js test/cli-acceptance.test.js
- npm run test:dashboard
- node ./bin/opennori.js doctor --root . --json
- src/core/evidence.ts
- src/core/evidence-source.ts
- src/core/evidence-risk.ts
- src/core/evidence-record.ts
- src/core/evidence-workflow.ts
- src/core/evidence-view.ts
- src/core/evidence-prune.ts
- src/core/evidence-health.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
