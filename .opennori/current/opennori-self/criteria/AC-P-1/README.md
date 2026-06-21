# AC-P-1 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我在编辑器或文件浏览器里打开 active Nori Contract 后，能在 60 秒内看懂目标、分层验收标准、每条状态和当前缺口。

Measurement: 打开 .opennori/active/<goal>.acceptance.md 并阅读。

Passing threshold: 不读聊天历史、不读实现说明，60 秒内能判断任务在验收层面的状态和下一条缺口。

## Evidence

Latest: review-result - Active Nori Contract markdown shows the goal, layered criteria, criterion statuses, Nori Profile section, and current rule in one readable file.
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

- Criterion source: criteria/AC-P-1/criterion.json
- Status projection: criteria/AC-P-1/status.json
- Evidence ledger: criteria/AC-P-1/evidence
- Artifacts: criteria/AC-P-1/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
