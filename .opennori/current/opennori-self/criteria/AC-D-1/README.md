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

Latest: dashboard-review - Dashboard snapshot and inspect panels now expose goal dossier and criterion dossier paths so users can trace Goal and AC nodes back to .opennori/current/<goal>/contract.json, ledger.json, README.md, and criteria/<AC-id>/{README.md,criterion.json,status.json,evidence,artifacts}. Plugin cache was synced locally from 0.1.9 to 0.1.10 with opennori plugin sync --local --confirm.
Result: passing
Basis: tool-observation
Reviewability: Run the listed checks; start opennori dashboard and select Goal, an individual AC, and a focused Passed AC to confirm dossier paths are visible in the read-only inspect panel.
Limitations: This verifies dashboard projection, UI build, and selection behavior. It does not require dashboard to write, approve, waive, or record evidence; those remain agent/CLI paths.

Sources:
- npm run typecheck:dashboard
- npx tsc --noEmit --pretty false
- npm run build:dashboard
- npm run test:dashboard
- npm run test:quick
- git diff --check

## Files

- Criterion source: criteria/AC-D-1/criterion.json
- Status projection: criteria/AC-D-1/status.json
- Evidence ledger: criteria/AC-D-1/evidence
- Artifacts: criteria/AC-D-1/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
