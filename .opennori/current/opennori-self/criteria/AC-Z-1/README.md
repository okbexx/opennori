# AC-Z-1 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我获取 OpenNori 包后，我的 agent 能通过 Codex Plugin 发现 OpenNori Skills，而不需要我记住内部 Skill 名或手动查找能力入口。

Measurement: 查看 Codex Plugin manifest、package Skills、README 和 opennori doctor 输出。

Passing threshold: 包内包含 .codex-plugin/plugin.json 且 skills 指向 ./skills/；nori 总入口和子 Skills 说明自然语言路由；doctor 报告 plugin_manifest、plugin_skills 和 manifest_plugin_state；用户能判断 Plugin Skills 可用。

## Evidence

Latest: review-result - OpenNori exposes package-local Codex Plugin Skills for agent discovery: the marketplace points to plugins/opennori, plugin.json points to ./skills, package Skills describe natural-language routing, and doctor reports Plugin manifest, marketplace, Skills, and manifest state as healthy.
Result: passing
Basis: tool-observation
Reviewability: Inspect plugin manifest, marketplace metadata, package Skills, and doctor data.plugin/checks.
Limitations: This validates the source checkout package assets; external package installation should be smoke-tested after publish.

Sources:
- node ./bin/opennori.js doctor --root . --json
- .agents/plugins/marketplace.json
- plugins/opennori/.codex-plugin/plugin.json
- plugins/opennori/skills/nori/SKILL.md
- src/lifecycle/doctor/plugin-health.ts

## Files

- Criterion source: criteria/AC-Z-1/criterion.json
- Status projection: criteria/AC-Z-1/status.json
- Evidence ledger: criteria/AC-Z-1/evidence
- Artifacts: criteria/AC-Z-1/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
