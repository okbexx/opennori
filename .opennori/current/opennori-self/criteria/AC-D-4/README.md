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

Latest: dashboard-control-boundary-verification - opennori dashboard now starts the local kernel and prints the URL without opening a browser by default; --open is the only explicit browser-opening path. The dashboard remains observation-only and the user-facing output tells users to open the URL themselves or rerun with --open.
Result: passing
Basis: command-output
Reviewability: Inspect the dashboard command help and human output. Confirm there is no --no-open option, --open is explicit, and normal dashboard startup prints the URL without opening a browser.
Limitations: This verifies CLI/kernel open behavior and documentation. It does not prevent users from manually opening the printed URL or explicitly using --open.

Sources:
- node ./bin/opennori.js dashboard --help
- node ./bin/opennori.js dashboard --root . --port 0 --once
- npm run test:dashboard
- npx vitest run test/cli-human-output.test.js --tagsFilter=quick
- src/cli/commands/dashboard.ts
- src/kernel/server.ts
- src/cli/human-output.ts
- README.md
- .opennori/protocol.md
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-reporting/SKILL.md

## Files

- Criterion source: criteria/AC-D-4/criterion.json
- Status projection: criteria/AC-D-4/status.json
- Evidence ledger: criteria/AC-D-4/evidence
- Artifacts: criteria/AC-D-4/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
