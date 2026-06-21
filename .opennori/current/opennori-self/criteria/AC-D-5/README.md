# AC-D-5 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: acceptance
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我打开 OpenNori dashboard 后，能点击顶部 Project Profile 图标，在右侧只读浮窗查看项目级 Profile 偏好，以及当前 goal 对这些偏好的合规状态、阻塞项、review 风险和证据摘要。

Measurement: 启动 dashboard，在有 current goal、没有 current goal、存在和不存在 Project Profile items 的项目中点击顶部 Project Profile 图标，并切换 UI Panel / Raw JSON 查看浮窗内容。

Passing threshold: 右侧 overlay 浮窗展示 Project Profile item 总数、must/prefer/avoid 分布、当前 goal compliance complete/blocking/review 状态、每个 item 的 type/name/strength/purpose/scope/install policy/latest compliance evidence；没有 current goal 时显示 Project Profile 已加载但合规未评价，而不是显示完成；没有 profile 时显示空态；浮窗只读，不提供 add/check/evidence/waive/confirm 等写状态按钮；Profile 不被渲染为 Product AC 节点；打开或关闭浮窗前后，radar/main 区域不重新分配布局宽度。

## Evidence

Latest: dashboard-project-profile-verification - Dashboard now exposes Project Profile as a readonly project-level overlay and evaluates compliance only when a current goal exists. The header button is labeled Inspect Project Profile, the profile node raw data distinguishes project_only from current_goal_compliance, no-current-goal snapshots still include Project Profile but mark compliance not evaluated, and the overlay stays read-only without add/check/evidence/waive/confirm controls.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed dashboard and kernel files. Confirm the header icon label is Inspect Project Profile, profile rawData scope is project_only when there is no current goal and current_goal_compliance when active, no-current snapshots include Project Profile without marking compliance complete, and the panel exposes no write actions. Rerun dashboard/profile tests and typecheck.
Limitations: This verifies the dashboard state model, built assets, and test coverage. It does not include a fresh browser screenshot in this evidence record; visual inspection can still be done by running opennori dashboard locally.

Sources:
- .opennori/architecture/evidence/opennori-self-ac-d-5-project-profile-dashboard.json
- npm run test:dashboard
- npm run test:profile
- npx tsc --noEmit --pretty false
- node ./bin/opennori.js check --root . --json
- src/kernel/snapshot.ts
- src/dashboard/src/App.tsx
- src/dashboard/src/selection.ts
- src/dashboard/src/components/InspectNodePanel.tsx
- src/dashboard/src/types.ts
- test/cli-dashboard.test.js
- test/dashboard-selection.test.ts
- dashboard/index.html

## Files

- Criterion source: criteria/AC-D-5/criterion.json
- Status projection: criteria/AC-D-5/status.json
- Evidence ledger: criteria/AC-D-5/evidence
- Artifacts: criteria/AC-D-5/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
