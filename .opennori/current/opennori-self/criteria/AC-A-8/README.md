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

Latest: architecture-refactor-verification - OpenNori core shared helpers are now separated by responsibility: protocol constants/layer inference, deterministic IO/result helpers, goal-state path discovery, dossier rendering, and dossier persistence/hydration. shared.ts remains a narrow compatibility barrel, so existing CLI/kernel imports keep working while the architecture boundary is clearer.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed src/core files: shared.ts should only re-export; protocol, IO, goal-state discovery, generated dossier rendering, and dossier persistence/hydration should be separate modules. Rerun the listed commands.
Limitations: This verifies the core module boundary and current behavior. It does not claim the entire OpenNori architecture is fully finished; further slices still need CLI runtime and command/domain boundary review.

Sources:
- .opennori/architecture/evidence/opennori-self-core-shared-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:quick
- npm run check
- node ./bin/opennori.js doctor --root . --json
- node ./bin/opennori.js status --root . --json
- git diff --check
- src/core/protocol.ts
- src/core/io.ts
- src/core/goal-state.ts
- src/core/dossier-render.ts
- src/core/dossier.ts
- src/core/shared.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
