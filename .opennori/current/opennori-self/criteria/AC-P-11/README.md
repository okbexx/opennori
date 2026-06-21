# AC-P-11 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我在 Codex 对话中说“把这次验证作为证据”后，agent 能按 OpenNori 结构记录，而不要求我记住 CLI 参数。

Measurement: 查看 OpenNori Skill 导出的证据记录说明，并检查 agent 使用自然语言到 CLI 的映射。

Passing threshold: Skill 明确要求 agent 自由选择验证方式，但记录证据时说明 basis、sources、reviewability、confidence 和 limitations。

## Evidence

Latest: review-result - OpenNori Skills tell agents how to map natural language evidence requests to opennori evidence add with basis, sources, reviewability, confidence, and limitations.
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

- Criterion source: criteria/AC-P-11/criterion.json
- Status projection: criteria/AC-P-11/status.json
- Evidence ledger: criteria/AC-P-11/evidence
- Artifacts: criteria/AC-P-11/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
