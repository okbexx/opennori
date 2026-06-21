# AC-P-10 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我能看到一条 AC 可以由多个证据来源共同支撑，而不要求 agent 把它们拆成固定适配器。

Measurement: 为一条 AC 添加包含多个来源的证据后查看 evidence record 和 report。

Passing threshold: 同一条证据可以包含多个 sources；报告能合并展示这些来源，并保留 agent 的自由取证空间。

## Evidence

Latest: review-result - A single AC can carry multiple evidence sources without fixed adapters; the CLI preserves command, artifact, URL, path, and custom metadata sources.
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

- Criterion source: criteria/AC-P-10/criterion.json
- Status projection: criteria/AC-P-10/status.json
- Evidence ledger: criteria/AC-P-10/evidence
- Artifacts: criteria/AC-P-10/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
