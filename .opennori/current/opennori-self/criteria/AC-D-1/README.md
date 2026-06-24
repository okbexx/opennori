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

Latest: dashboard-ux-verification - Dashboard now leads with a user-facing completion answer, goal, current gap, next action, and Project Profile impact. The radar remains a visual observation aid, supporting detail is secondary, and dashboard.started system events are hidden from the recent activity list so agent activity stays meaningful.
Result: passing
Basis: tool-observation
Reviewability: Run opennori dashboard --root . and open the printed URL in Chrome. Confirm the first screen leads with Goal Outcome Monitor, Completion answer, Current gap, Next, Project Profile impact, and recent agent activity rather than dashboard start noise.
Limitations: Chrome visual review was performed locally through the Codex Chrome plugin. This evidence does not add pixel regression snapshots or change dashboard state authority.

Sources:
- npm run test:dashboard
- npm run typecheck:dashboard
- src/dashboard/src/components/OutcomeHud.tsx
- src/dashboard/src/components/DashboardHeader.tsx
- src/dashboard/src/components/EventLogConsole.tsx
- src/dashboard/src/dashboard-view.ts
- test/dashboard-selection.test.ts
- dashboard/index.html

## Files

- Criterion source: criteria/AC-D-1/criterion.json
- Status projection: criteria/AC-D-1/status.json
- Evidence ledger: criteria/AC-D-1/evidence
- Artifacts: criteria/AC-D-1/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
