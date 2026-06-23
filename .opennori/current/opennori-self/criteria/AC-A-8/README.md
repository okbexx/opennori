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

Latest: architecture-refactor - Setup lifecycle responsibilities were split into setup types, action builders, plan construction, and execution orchestration while preserving the preview-first OpenNori capability bundle setup behavior.
Result: passing
Basis: tool-observation
Reviewability: Inspect the setup lifecycle modules. Confirm setup.ts remains a compatibility export, setup-types.ts owns public setup types, setup-actions.ts owns bundle action construction and external probes, setup-plan.ts builds preview plans, and setup-execution.ts performs confirm-time orchestration. Rerun the listed typecheck, lifecycle, CLI, and lint commands.
Limitations: This is an internal lifecycle boundary refactor. It does not change npx opennori setup, dry-run/confirm behavior, Codex Plugin commands, npm global install commands, or project .opennori initialization semantics.

Sources:
- .opennori/architecture/evidence/opennori-self-setup-lifecycle-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:lifecycle
- npm run test:cli
- npm run lint
- src/lifecycle/setup.ts
- src/lifecycle/setup-types.ts
- src/lifecycle/setup-actions.ts
- src/lifecycle/setup-plan.ts
- src/lifecycle/setup-execution.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
