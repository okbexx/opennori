# AC-A-4 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，当 agent 认为 baseline 不适合当前项目时，我看到明确 Architecture Challenge，而不是 agent 静默改架构。

Measurement: 运行 opennori architecture challenge 后查看 status/report 和 challenge 文件。

Passing threshold: challenge 展示当前 baseline、项目证据、冲突说明、建议修正和是否需要用户确认。

## Evidence

Latest: test-summary - Architecture Challenge command records evidence-backed baseline conflicts and marks architecture as challenged instead of allowing silent replacement.
Result: passing
Basis: tool-observation
Reviewability: Run npm test and inspect the architecture challenge regression test and Skill rules.
Limitations: The self repo currently has no open challenge because the current baseline is valid; behavior is covered in isolated test projects.

Sources:
- npm test
- test/core.test.js

## Files

- Criterion source: criteria/AC-A-4/criterion.json
- Status projection: criteria/AC-A-4/status.json
- Evidence ledger: criteria/AC-A-4/evidence
- Artifacts: criteria/AC-A-4/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
