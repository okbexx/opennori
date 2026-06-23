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

Latest: architecture-refactor - Dashboard radar code now separates read-only OpenNori node semantics from geometry and visual style helpers. radar-model remains the compatibility assembly surface, while radar-nodes owns goal/profile/passed/criterion/evidence node projection, radar-geometry owns layout math, radar-status owns status/style classification, and selection reuses the shared node projection instead of duplicating Passed and Project Profile semantics.
Result: passing
Basis: tool-observation
Reviewability: Inspect the dashboard radar modules to confirm radar-model only assembles the read-only model, radar-nodes owns snapshot-to-node projection, radar-geometry owns layout math, radar-status owns color/pulse/link style classification, and selection.ts reuses shared node projection. Rerun typecheck, dashboard, CLI, lint, check/status, and diff checks.
Limitations: This refactor does not change dashboard UI controls, dashboard API, kernel snapshot schema, event stream behavior, Product AC evidence semantics, or dashboard write restrictions. It preserves the existing radar-model import surface for components and tests.

Sources:
- .opennori/architecture/evidence/opennori-self-dashboard-radar-boundary.json
- npx tsc --noEmit --pretty false
- npm run typecheck:dashboard
- npm run test:dashboard
- npm run test:cli
- npm run lint
- node ./bin/opennori.js check --root . --json
- node ./bin/opennori.js status --root . --json
- git diff --check
- src/dashboard/src/radar-model.ts
- src/dashboard/src/radar-nodes.ts
- src/dashboard/src/radar-geometry.ts
- src/dashboard/src/radar-status.ts
- src/dashboard/src/radar-types.ts
- src/dashboard/src/selection.ts
- test/dashboard-selection.test.ts
- test/cli-dashboard.test.js
- dashboard/index.html
- dashboard/assets/index-CQhSd-vc.js

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
