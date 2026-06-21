# AC-O-2 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我在 Codex 对话里 approve 或 revise 验收标准后，能控制什么叫完成，而不是让 agent 自动决定完成定义。

Measurement: 查看 active Nori Contract 中是否反映用户确认后的验收标准。

Passing threshold: agent 在用户确认前不能进入 complete 判断；用户修改过的 AC 会成为后续状态判断依据。

## Evidence

Latest: review-result - Approval and criterion update flows preserve the acceptance basis and keep completion blocked until the user approves or revises the criteria.
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

- Criterion source: criteria/AC-O-2/criterion.json
- Status projection: criteria/AC-O-2/status.json
- Evidence ledger: criteria/AC-O-2/evidence
- Artifacts: criteria/AC-O-2/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
