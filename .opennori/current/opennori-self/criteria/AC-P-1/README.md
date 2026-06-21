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

Latest: project-profile-report-surface-review - Active Nori Contract dossier shows goal, layered criteria, criterion statuses, Project Profile compliance, and the current rule in one readable review surface.
Result: passing
Basis: tool-observation
Reviewability: Open .opennori/current/opennori-self/README.md and confirm the readable contract surface leads with goal, criteria, status, Project Profile compliance, and current gap/rule without requiring chat history.
Limitations: This verifies the generated active goal dossier and status projection. It does not replace user review of whether future contract prose is sufficiently detailed.

Sources:
- node ./bin/opennori.js status --root . --json
- .opennori/current/opennori-self/README.md
- .opennori/current/opennori-self/contract.json
- .opennori/current/opennori-self/ledger.json

## Files

- Criterion source: criteria/AC-P-1/criterion.json
- Status projection: criteria/AC-P-1/status.json
- Evidence ledger: criteria/AC-P-1/evidence
- Artifacts: criteria/AC-P-1/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
