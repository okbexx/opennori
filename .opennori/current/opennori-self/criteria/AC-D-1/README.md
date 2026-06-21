# AC-D-1 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: acceptance
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我运行 opennori dashboard --root . 并打开本地页面后，能不用阅读 CLI 日志就看出当前由哪个 agent/Skill 在推进、目标是什么、当前验收缺口是什么、是否需要我介入、Architecture Baseline 是否有效，以及当前完成判断。

Measurement: 启动 dashboard，触发或模拟 agent activity，分别查看桌面与窄屏页面的首屏状态。

Passing threshold: 页面以视觉化 acceptance loop 和少量状态面板展示 agent activity、goal、current gap、need user、architecture decision、completion decision 和 latest event；有活动动效但不呈现聊天记录、过程任务列表、证据账本或完成权威入口；状态变化来自 /api/snapshot 与 /api/events。

## Evidence

Latest: dashboard-review - Dashboard inspect panel now stays aligned with the rendered radar state: focused passing AC events map to the Passed aggregate instead of a hidden individual node, latest evidence/architecture/profile/report events can refresh the inspected AC, long Chinese measurement/threshold text renders in one readable column, review-required passing criteria show review risk wording, and architecture valid displays as a healthy decision.
Result: passing
Basis: tool-observation
Reviewability: Run npm run lint, npm run typecheck:dashboard, npm run test:quick, npm run test:dashboard, and git diff --check; then open opennori dashboard and trigger evidence/architecture/activity events to confirm the right panel follows the rendered radar node and highlights the focused passed AC inside the aggregate.
Limitations: This verifies the local dashboard behavior and focused regression coverage. Dashboard remains observation-only and does not write Product AC, evidence, profile, architecture, report, waiver, or completion state.

Sources:
- npm run lint
- npm run typecheck:dashboard
- npm run test:quick
- npm run test:dashboard
- git diff --check
- src/dashboard/src/App.tsx
- src/dashboard/src/api.ts
- src/dashboard/src/selection.ts
- src/dashboard/src/components/InspectNodePanel.tsx
- test/dashboard-selection.test.ts

## Files

- Criterion source: criteria/AC-D-1/criterion.json
- Status projection: criteria/AC-D-1/status.json
- Evidence ledger: criteria/AC-D-1/evidence
- Artifacts: criteria/AC-D-1/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
