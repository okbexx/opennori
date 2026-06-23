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

Latest: architecture-refactor-verification - OpenNori CLI runtime infrastructure is now separated into executor, active-goal args, active-goal store, active-goal lock, and a compatibility runtime barrel. runner.ts consumes lock/store directly, while command modules can continue importing the runtime barrel during migration. The split keeps objective .opennori state loading, dossier writes, stale-evidence pruning, citty command execution, and single-writer locking in deterministic code, without adding subjective AC or architecture-quality validators.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed CLI runtime files: executor.ts should only wrap citty runCommand, active-goal-args.ts should only define shared CLI args, active-goal-store.ts should own load/save/prune/dossier state, active-goal-lock.ts should own the local write lock and should not read goal payloads, runtime.ts should only re-export. Rerun the listed commands.
Limitations: This verifies the CLI runtime infrastructure boundary and current behavior. It does not yet split every individual command module or lifecycle/setup orchestration module.

Sources:
- .opennori/architecture/evidence/opennori-self-cli-runtime-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:core
- npm run test:cli
- git diff --check
- src/cli/executor.ts
- src/cli/active-goal-args.ts
- src/cli/active-goal-store.ts
- src/cli/active-goal-lock.ts
- src/cli/runtime.ts
- src/cli/runner.ts
- test/core.test.js

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
