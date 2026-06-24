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

Latest: dashboard-profile-impact-verification - The Project Profile drawer now explains completion impact directly: no current goal means not evaluated, blocking items block completion until evidence/revision/waiver, review items require user review, and clear profile does not block the current completion decision.
Result: passing
Basis: tool-observation
Reviewability: Open the Project Profile drawer from the dashboard header or Project Profile impact card and confirm it explains whether project-level preferences affect the current completion decision.
Limitations: This verifies the read-only profile impact explanation. It does not add dashboard write actions for profile evidence or waivers.

Sources:
- npm run test:dashboard
- npm run typecheck:dashboard
- src/dashboard/src/components/inspect/ProfileInspectPanel.tsx
- src/dashboard/src/components/OutcomeHud.tsx

## Files

- Criterion source: criteria/AC-D-5/criterion.json
- Status projection: criteria/AC-D-5/status.json
- Evidence ledger: criteria/AC-D-5/evidence
- Artifacts: criteria/AC-D-5/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
