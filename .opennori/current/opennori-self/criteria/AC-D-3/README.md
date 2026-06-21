# AC-D-3 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: acceptance
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我打开 OpenNori dashboard 观察 agent 执行时，首屏就能看出当前 agent 是否正在活动、使用哪个 Skill、正在推进哪个验收缺口，以及活动是否已经过期；我不需要展开详情面板或阅读事件日志才能判断当前执行态。

Measurement: 启动 dashboard，分别模拟 active activity、waiting user、expired/idle activity，在桌面和窄屏截图中查看首屏状态。

Passing threshold: 首屏有清晰的 live activity 主视觉：显示 agent/Skill、state、summary、current gap、last seen 或 stale 标记；active/verifying 有明显但不过度的动效，idle/expired 降低视觉权重；不新增聊天记录、过程任务列表、证据账本或完成权威入口。

## Evidence

Latest: dashboard-execution-presence-review - Dashboard event focus now follows execution-relevant OpenNori events beyond activity.started: ac.finished, evidence.added, architecture.changed, profile.changed, gap.changed, report.generated, and activity.finished can refresh the selected current gap, while idle snapshots still show the last agent event instead of looking disconnected.
Result: passing
Basis: tool-observation
Reviewability: Run the listed dashboard tests and inspect selection.ts to confirm event-to-gap focus behavior; open the dashboard during agent activity to see current execution state and latest agent event without reading raw logs first.
Limitations: This covers event focus and visible execution presence for the dashboard projection. It does not turn the dashboard into an agent runtime or completion authority.

Sources:
- npm run typecheck:dashboard
- npm run test:quick
- npm run test:dashboard
- src/dashboard/src/api.ts
- src/dashboard/src/selection.ts
- src/dashboard/src/App.tsx
- test/dashboard-selection.test.ts

## Files

- Criterion source: criteria/AC-D-3/criterion.json
- Status projection: criteria/AC-D-3/status.json
- Evidence ledger: criteria/AC-D-3/evidence
- Artifacts: criteria/AC-D-3/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
