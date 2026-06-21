# AC-D-5 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: acceptance
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我打开 OpenNori dashboard 后，能点击顶部 Profile 图标，在右侧只读浮窗查看当前 Nori Profile 的执行偏好、合规状态、阻塞或 review 风险和证据摘要，而不需要回到 CLI 才知道 agent 是否遵守了我声明的 Skill、技术栈或 avoid 约束。

Measurement: 启动 dashboard，在存在和不存在 Nori Profile items 的项目中点击顶部 Profile 图标，并切换 UI Panel / Raw JSON 查看浮窗内容。

Passing threshold: 右侧 overlay 浮窗展示 Profile item 总数、must/prefer/avoid 分布、complete/blocking/review 状态、每个 item 的 type/name/strength/purpose/scope/install policy/latest evidence summary；没有 profile 时显示空态；浮窗只读，不提供 add/check/evidence/waive/confirm 等写状态按钮；Profile 不被渲染为 Product AC 节点；打开或关闭浮窗前后，radar/main 区域不重新分配布局宽度，浮窗只覆盖在右侧观察层上。

## Evidence

Latest: dashboard-ui-verification - Dashboard now exposes a readonly Nori Profile drawer from the header Profile icon. The snapshot includes capability_profile and capability_compliance; the drawer shows item counts, must/prefer/avoid distribution, compliance, blocking/review counts, item metadata, and latest evidence; Profile remains outside Product AC radar criteria. Playwright measured the radar SVG width before and after opening the drawer as 1118px both times, confirming the right-side drawer is an overlay and does not affect main layout sizing.
Result: passing
Basis: tool-observation
Reviewability: Run npm run lint, npm run typecheck:dashboard, npm run test:quick, npm run test:dashboard, and git diff --check. Start opennori dashboard, click the header Profile icon, inspect UI Panel / Raw JSON, and compare the radar SVG width before and after opening the drawer.
Limitations: Manual Playwright verification used a local demo dashboard state with one required Profile item; tests cover snapshot and selection behavior but do not create a permanent browser screenshot artifact.

Sources:
- Playwright dashboard observation: clicked Inspect Nori Profile; UI Panel showed NORI PROFILE, ITEMS 1, MUST 1, PREFER 0, AVOID 0, NEEDS REVIEW, Blocking 1, Review 0, design-taste-frontend, install policy existing_only, latest evidence <none>. Radar width was 1118px before and 1118px after opening the drawer.
- /Users/jarl/code/jarlone/opennori/.opennori/architecture/evidence/opennori-self-ac-d-5-aligned.json
- npm run lint
- npm run typecheck:dashboard
- npm run test:quick
- npm run test:dashboard
- git diff --check
- src/dashboard/src/App.tsx
- src/dashboard/src/components/InspectNodePanel.tsx
- src/dashboard/src/selection.ts
- src/kernel/snapshot.ts
- test/dashboard-selection.test.ts

## Files

- Criterion source: criteria/AC-D-5/criterion.json
- Status projection: criteria/AC-D-5/status.json
- Evidence ledger: criteria/AC-D-5/evidence
- Artifacts: criteria/AC-D-5/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
