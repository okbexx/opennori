# AC-P-5 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我运行 opennori report 后，能看到目标、分层 AC 状态、证据摘要、当前缺口、是否需要我介入和结论。

Measurement: 运行 opennori report 或让 Codex 生成 OpenNori 报告。

Passing threshold: 报告默认围绕验收状态和证据组织，不把过程任务当作主线。

## Evidence

Latest: review-result - opennori report leads with decision summary, goal, acceptance basis, Nori Profile, acceptance status, evidence health, user intervention, and conclusion.
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

- Criterion source: criteria/AC-P-5/criterion.json
- Status projection: criteria/AC-P-5/status.json
- Evidence ledger: criteria/AC-P-5/evidence
- Artifacts: criteria/AC-P-5/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
