# AC-O-6 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我发现新事实后在对话中修改某条 AC，agent 后续只按更新后的验收标准判断完成。

Measurement: 用户提出 AC 修改后，查看 active contract、status 和 report。

Passing threshold: 更新后的 AC 成为后续 completion 和 current_gap 的唯一验收依据；旧标准不会继续被当成完成条件。

## Evidence

Latest: review-result - criterion update rewrites the user-facing AC, clears stale criterion evidence, preserves acceptance basis, and makes future completion depend on the revised AC.
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

- Criterion source: criteria/AC-O-6/criterion.json
- Status projection: criteria/AC-O-6/status.json
- Evidence ledger: criteria/AC-O-6/evidence
- Artifacts: criteria/AC-O-6/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
