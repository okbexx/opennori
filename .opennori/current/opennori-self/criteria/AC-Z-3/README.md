# AC-Z-3 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我在 Git 或 PR diff 中审查 agent 本轮改动后，能区分验收证据变化和实现过程噪音。

Measurement: 查看本轮 diff 或报告变更摘要。

Passing threshold: 默认摘要围绕 AC 状态变化、证据变化和用户影响组织；实现过程只作为附属证据出现。

## Evidence

Latest: review-result - changes groups .opennori/examples acceptance artifacts separately from implementation files so PR review can separate evidence state from code changes.
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

- Criterion source: criteria/AC-Z-3/criterion.json
- Status projection: criteria/AC-Z-3/status.json
- Evidence ledger: criteria/AC-Z-3/evidence
- Artifacts: criteria/AC-Z-3/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
