# AC-P-3 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我运行 opennori next 或 opennori status 后，看到的是当前验收缺口和完成判断，而不是任务步骤列表。

Measurement: 运行 opennori next/status 并查看返回的 current_gap、completion 和 intervention。

Passing threshold: 输出默认回答“当前差哪条 AC、是否完成、是否需要人类动作”，不把过程任务当作主线。

## Evidence

Latest: review-result - opennori next/status return current_gap, completion answer, intervention, architecture, and next_recommendation instead of a process-step list.
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

- Criterion source: criteria/AC-P-3/criterion.json
- Status projection: criteria/AC-P-3/status.json
- Evidence ledger: criteria/AC-P-3/evidence
- Artifacts: criteria/AC-P-3/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
