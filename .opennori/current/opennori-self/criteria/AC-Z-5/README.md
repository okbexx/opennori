# AC-Z-5 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我运行归档入口后，completed 或 blocked 中保留报告，active 中不再出现这个目标。

Measurement: 对 complete 或 blocked goal 执行归档，再运行 opennori list 并打开归档产物。

Passing threshold: 归档不会丢失 Nori Contract、evidence record 或 report；active 列表只显示仍需推进的目标。

## Evidence

Latest: review-result - archive moves complete or blocked goals out of active into completed/blocked while preserving evidence and reports.
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

- Criterion source: criteria/AC-Z-5/criterion.json
- Status projection: criteria/AC-Z-5/status.json
- Evidence ledger: criteria/AC-Z-5/evidence
- Artifacts: criteria/AC-Z-5/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
