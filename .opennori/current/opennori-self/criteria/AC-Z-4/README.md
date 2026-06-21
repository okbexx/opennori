# AC-Z-4 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我运行 opennori list 后，能看到多个 active goals，并能明确选择要继续的目标。

Measurement: 创建多个 active goals 后运行 opennori list，并用 --goal 指定 resume/status/report 的目标。

Passing threshold: 多个目标不会被 agent 随机选择；用户能看见目标列表、状态、当前缺口和对应路径。

## Evidence

Latest: review-result - list shows multiple active OpenNori goals and resume requires explicit --goal when more than one active contract exists.
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

- Criterion source: criteria/AC-Z-4/criterion.json
- Status projection: criteria/AC-Z-4/status.json
- Evidence ledger: criteria/AC-Z-4/evidence
- Artifacts: criteria/AC-Z-4/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
