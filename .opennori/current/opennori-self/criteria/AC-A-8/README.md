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

Latest: dashboard-architecture-boundary-verification - Dashboard inspect rendering is now split by observation node type: the route component delegates to read-only Goal, Passed Criteria, Project Profile, Criterion, and Evidence panels, with shared copy/path/status helpers isolated under components/inspect. The dashboard still renders only projected snapshot data and exposes no approve, waive, evidence, profile, architecture, or report write controls from these panels.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed dashboard source files. Confirm InspectNodePanel is now only a node-type router, the node panels are read-only renderers over snapshot rawData, Project Profile remains project-level observation, evidence panels only show review sources, and no confirmation or state-write controls were added. Rerun the listed dashboard, typecheck, lint, doctor, and status commands.
Limitations: This verifies the dashboard inspect boundary and built asset update. It does not redesign the radar visualization, change snapshot semantics, or include a fresh browser screenshot; visual review can still be done by running opennori dashboard.

Sources:
- .opennori/architecture/evidence/opennori-self-dashboard-inspect-boundary.json
- npm run test:dashboard
- npm run typecheck:dashboard
- npx tsc --noEmit --pretty false
- npm run lint
- node ./bin/opennori.js doctor --root . --json
- node ./bin/opennori.js status --root . --json
- src/dashboard/src/components/InspectNodePanel.tsx
- src/dashboard/src/components/inspect/GoalInspectPanel.tsx
- src/dashboard/src/components/inspect/PassedCriteriaPanel.tsx
- src/dashboard/src/components/inspect/ProfileInspectPanel.tsx
- src/dashboard/src/components/inspect/CriterionInspectPanel.tsx
- src/dashboard/src/components/inspect/EvidenceInspectPanel.tsx
- src/dashboard/src/components/inspect/InspectShared.tsx
- dashboard/index.html
- dashboard/assets/index-QMqd8O4F.js

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
