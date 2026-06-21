# AC-P-16 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: As an OpenNori maintainer or agent user, I can open the current goal directory and each criterion dossier README to understand the goal, AC status, evidence, and next gap without reading a flat ledger first.

Measurement: Inspect .opennori/current/<goal-id>/README.md and .opennori/current/<goal-id>/criteria/<AC-id>/README.md after drafting, approving, recording evidence, reporting, or archiving a goal.

Passing threshold: Goal state is stored as a goal directory; every Product AC has its own criteria/<AC-id>/ directory with criterion.json as the AC source of truth, status.json as rebuildable status projection, evidence/ and artifacts/ subdirectories, and README.md as a generated human review surface; status/report/dashboard/doctor/manifest use the directory model and no normal current/draft/completed/blocked state relies on flat <goal>.acceptance.md + <goal>.evidence.json pairs.

## Evidence

Latest: protocol-dashboard-review - Dashboard status projection now uses the goal dossier model directly: snapshots include goal-level dossier paths and each criterion includes its own dossier paths, including README, criterion source, status projection, evidence directory, and artifacts directory.
Result: passing
Basis: tool-observation
Reviewability: Inspect /api/snapshot or .opennori/snapshots/current.json after refreshSnapshot; the goal.dossier and criteria[].dossier fields should point to the physical goal and criterion dossier files.
Limitations: This is a read-only dashboard projection of the dossier model. It does not make Markdown authoritative over JSON and does not introduce flat legacy state.

Sources:
- npm run test:dashboard
- npm run test:quick

## Files

- Criterion source: criteria/AC-P-16/criterion.json
- Status projection: criteria/AC-P-16/status.json
- Evidence ledger: criteria/AC-P-16/evidence
- Artifacts: criteria/AC-P-16/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
