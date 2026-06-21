# AC-O-7 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我说“OpenNori 先头脑风暴：想法 X”后，能看到几个可选择的验收方向，而不需要记住 CLI 用法。

Measurement: 在 Codex 对话中触发 brainstorm，查看 agent 展示的候选方向。

Passing threshold: 候选项围绕用户价值、可观察验收方式和风险组织；用户能选择或改写方向进入 draft；brainstorm 输出不能被当作 Nori Contract 或完成证据。

## Evidence

Latest: review-result - brainstorm produces selectable acceptance directions with user value, observable acceptance direction, and risk, without treating brainstorm output as a contract.
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

- Criterion source: criteria/AC-O-7/criterion.json
- Status projection: criteria/AC-O-7/status.json
- Evidence ledger: criteria/AC-O-7/evidence
- Artifacts: criteria/AC-O-7/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
