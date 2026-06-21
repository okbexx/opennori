# AC-P-6 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我查看 OpenNori 报告时，能知道每条通过、阻塞或豁免的 AC 是基于什么证据判断的。

Measurement: 给 AC 添加不同来源的证据后运行 opennori report 或 opennori status。

Passing threshold: 报告或状态输出展示证据摘要、判断基础、证据强度和剩余限制；不会只显示 agent 自我结论。

## Evidence

Latest: review-result - Report and status expose evidence kind, basis, confidence, sources, reviewability, limitations, and gate for passing, blocked, and waived criteria.
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

- Criterion source: criteria/AC-P-6/criterion.json
- Status projection: criteria/AC-P-6/status.json
- Evidence ledger: criteria/AC-P-6/evidence
- Artifacts: criteria/AC-P-6/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
