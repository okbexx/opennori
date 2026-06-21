# AC-D-4 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: acceptance
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我在 OpenNori dashboard 看到需要用户介入时，页面只告诉我应该回到 agent 对话里确认、修改或豁免，而不会提供 dashboard 内的确认、拒绝、waive 或写状态按钮。

Measurement: 启动 dashboard，制造 need_user / waiting_user 状态，检查页面首屏和控制区；同时对常见确认型 dashboard API 路径发送 POST。

Passing threshold: 页面清楚显示 dashboard 是 observation surface / reply in agent chat；可见控件只用于刷新或查看快照；POST /api/confirm、/api/approve、/api/waive、/api/evidence、/api/activity 等控制型请求返回 method_not_allowed；Product AC、evidence、profile、architecture 和 report 状态只能由 agent 对话中的 OpenNori Skill/CLI 路径写入。

## Evidence

Latest: dashboard-observation-boundary - Dashboard now presents user intervention as an agent-conversation reply boundary, not an in-dashboard confirmation flow. The built React app shows Agent reply / Control boundary / reply in agent chat, packaged Skills and docs forbid dashboard confirmation controls, and dashboard HTTP rejects confirmation-style POST control paths with method_not_allowed.
Result: passing
Basis: tool-observation
Reviewability: Run npm run check, inspect the dashboard bundle/source for Agent reply and reply in agent chat, and rerun the dashboard control-write tests to confirm POST confirmation endpoints are rejected.
Limitations: This verifies the current local dashboard and package assets. It does not add a browser screenshot for a forced need_user fixture, and future UI work must keep the same observation-only boundary.

Sources:
- npm run typecheck:dashboard && npm run build:dashboard && npx vitest run test/cli-commands.test.js -t "dashboard rejects non-GET|dashboard exposes observation only|dashboard serves the built React app|dashboard command can start|dashboard SSE emits"
- npm run check
- src/dashboard/src/App.tsx
- src/dashboard/src/components/AcceptanceLoop.tsx
- src/kernel/http/app.ts
- README.md
- AGENTS.md
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-reporting/SKILL.md
- plugins/opennori/skills/nori-project-health/SKILL.md
- plugins/opennori/.codex-plugin/plugin.json

## Files

- Criterion source: criteria/AC-D-4/criterion.json
- Status projection: criteria/AC-D-4/status.json
- Evidence ledger: criteria/AC-D-4/evidence
- Artifacts: criteria/AC-D-4/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
