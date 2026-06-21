# AC-O-3 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我在新的 Codex 会话里说“继续 OpenNori”后，agent 能恢复当前 active goal 并告诉我当前关键验收缺口。

Measurement: 在新会话触发 OpenNori 恢复流程，观察 agent 返回内容。

Passing threshold: 不依赖旧聊天上下文；能返回 goal id、当前状态、当前关键缺口和下一条需要证据的 AC。

## Evidence

Latest: review-result - resume/status recover active goals from .opennori active files, including current_gap, completion, evidence_health, architecture, and next_recommendation.
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

- Criterion source: criteria/AC-O-3/criterion.json
- Status projection: criteria/AC-O-3/status.json
- Evidence ledger: criteria/AC-O-3/evidence
- Artifacts: criteria/AC-O-3/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
