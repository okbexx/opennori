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

Latest: type-boundary-verification - The central src/types.ts type barrel was removed; source and tests now import owned domain type modules directly, and boundary tests prevent restoring the central barrel.
Result: passing
Basis: tool-observation
Reviewability: Confirm src/types.ts is absent; inspect test/module-boundaries.test.js for the guard; inspect test/mcp.test.ts for domain type imports; rerun the listed typecheck, focused tests, and lint.
Limitations: This lowers central type coupling but does not exhaustively redesign every domain type. Existing domain type modules remain intentionally separate.

Sources:
- .opennori/architecture/evidence/opennori-self-central-type-barrel-removal.json
- npx tsc --noEmit --pretty false
- npx vitest run test/module-boundaries.test.js test/mcp.test.ts
- npm run lint
- src/types/common.ts
- src/types/lifecycle.ts
- src/types/contract.ts
- src/types/evidence.ts
- src/types/profile.ts
- src/types/architecture.ts
- src/mcp/types.ts
- src/cli/command-types.ts
- test/mcp.test.ts
- test/module-boundaries.test.js

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
