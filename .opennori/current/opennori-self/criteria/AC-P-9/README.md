# AC-P-9 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我能看到证据的复查方式和限制，而不是只看到通过结论。

Measurement: 添加带复查说明和限制说明的证据后运行 report。

Passing threshold: 报告展示 reviewability 和 limitations；限制不会被隐藏在实现日志里。

## Evidence

Latest: review-result - Evidence records and reports show reviewability and limitations, and evidence_health warns when those fields are missing before confident completion.
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

- Criterion source: criteria/AC-P-9/criterion.json
- Status projection: criteria/AC-P-9/status.json
- Evidence ledger: criteria/AC-P-9/evidence
- Artifacts: criteria/AC-P-9/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
