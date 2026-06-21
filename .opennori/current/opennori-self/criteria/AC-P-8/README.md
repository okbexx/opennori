# AC-P-8 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我能区分证据是来自工具观察、人类确认、产物审查、协议校验，还是 agent 的判断。

Measurement: 给不同 basis 的证据运行 status/report。

Passing threshold: 输出明确展示证据 basis；agent 判断可以记录，但不会伪装成工具验证或人类确认。

## Evidence

Latest: review-result - Evidence basis distinguishes tool observations, artifact reviews, protocol checks, human confirmations, and agent observations in status/report/context export.
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

- Criterion source: criteria/AC-P-8/criterion.json
- Status projection: criteria/AC-P-8/status.json
- Evidence ledger: criteria/AC-P-8/evidence
- Artifacts: criteria/AC-P-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
