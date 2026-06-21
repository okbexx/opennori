# AC-P-13 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我打开 opennori report 后，能先看到完成结论、当前缺口和是否需要我介入，再查看详细 AC 表格。

Measurement: 运行 opennori report 并阅读报告顶部内容，再向下查看 Acceptance Status 表格。

Passing threshold: 报告在详细表格前显示 Decision Summary，包含 completion、current gap、user intervention 和 workflow status；blocked 报告也先显示需要用户采取的动作。

## Evidence

Latest: review-result - Acceptance report starts with Decision Summary before the detailed AC table, then includes Evidence Health before user intervention and conclusion.
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

- Criterion source: criteria/AC-P-13/criterion.json
- Status projection: criteria/AC-P-13/status.json
- Evidence ledger: criteria/AC-P-13/evidence
- Artifacts: criteria/AC-P-13/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
