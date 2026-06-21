# AC-Z-15 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我让 agent 记录验收证据时，不需要 agent 为常见来源手写复杂结构。

Measurement: 运行 opennori evidence add，分别使用 --source-command、--source-path、--source-url 和自由 --source 记录证据，再查看 status/report。

Passing threshold: 证据来源能显示为 command、artifact、url 或自由 reference；report/status 中仍保留 basis、reviewability、limitations 和 confidence。

## Evidence

Latest: review-result - evidence add accepts source, source-command, source-path, and source-url flags so agents can record common sources without hand-writing complex JSON.
Result: passing
Basis: tool-observation
Reviewability: Run npm run check and opennori check, then inspect the referenced source, tests, protocol, and generated report.
Limitations: This is local repository evidence for the current worktree; npm publishing and public site deployment are separate release steps.

Sources:
- npm run check
- node ./bin/opennori.js check --root . --json
- test/core.test.js
- .opennori/protocol.md

## Files

- Criterion source: criteria/AC-Z-15/criterion.json
- Status projection: criteria/AC-Z-15/status.json
- Evidence ledger: criteria/AC-Z-15/evidence
- Artifacts: criteria/AC-Z-15/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
