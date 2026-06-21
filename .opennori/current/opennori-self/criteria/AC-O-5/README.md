# AC-O-5 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我在 Codex 对话里问“我需要做什么？”后，如果任务 blocked，能看到一个明确的人类动作。

Measurement: 制造或查看 blocked 状态下的 OpenNori 报告或 agent 回复。

Passing threshold: blocked 说明必须是用户可执行动作，例如确认取舍、提供权限、批准成本或选择方案，而不是技术日志。

## Evidence

Latest: review-result - Blocked criteria and violated required profile items produce intervention.required with a concrete user action instead of vague process status.
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

- Criterion source: criteria/AC-O-5/criterion.json
- Status projection: criteria/AC-O-5/status.json
- Evidence ledger: criteria/AC-O-5/evidence
- Artifacts: criteria/AC-O-5/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
