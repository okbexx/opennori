# AC-O-17 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: high
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我在 draft 的 AC Review Loop 里修订某条 AC 后，OpenNori 仍然把这份 Nori Contract 保持为待确认草案，而不会把 acceptance_basis 自动标成 approved、不会跳到 profile/architecture/implementation，也不会把修订本身当作 evidence。

Measurement: 在一个带有 required Nori Profile 的 draft 上运行 criterion update --from-draft，然后查看 status/current_gap、draft evidence JSON、acceptance markdown、nori-acceptance Skill 和协议文档。

Passing threshold: 修订 draft AC 后 acceptance_basis.status 仍为 draft，approved_at 不存在，source/mode/coverage 等 basis metadata 保留，workflow_status 为 draft，current_gap 为 ACCEPTANCE-BASIS；只有最终 approve 后才能进入 profile、architecture、implementation 或 evidence 路由。已批准 current contract 的 criterion update 仍会清理该 AC 的旧 evidence 并产生新的 evidence gap。

## Evidence

Latest: review-result - Draft criterion revisions now preserve draft acceptance state: criterion add/update keeps drafts unapproved, preserves source/mode/coverage metadata, removes approved_at, and routes current_gap to ACCEPTANCE-BASIS even when required profile items exist. Approved current-contract revisions still clear stale evidence and create an evidence gap.
Result: passing
Basis: tool-observation
Reviewability: Review criterion.ts and the draft/current regression tests. Rerun the listed Vitest commands plus npm run typecheck; inspect status on the draft fixture to confirm current_gap remains ACCEPTANCE-BASIS.
Limitations: This verifies deterministic CLI state and Skill/protocol guidance. It does not prove every future agent will phrase AC revisions well; the AC Review Loop remains a Skill/user conversation responsibility.

Sources:
- npx vitest run test/cli-commands.test.js --testNamePattern 'criterion update command'
- npx vitest run test/core.test.js --testNamePattern 'criterion update'
- npm run typecheck
- src/cli/commands/acceptance/criterion.ts
- test/core.test.js
- plugins/opennori/skills/nori-acceptance/SKILL.md
- .opennori/protocol.md
- README.md
- AGENTS.md

## Files

- Criterion source: criteria/AC-O-17/criterion.json
- Status projection: criteria/AC-O-17/status.json
- Evidence ledger: criteria/AC-O-17/evidence
- Artifacts: criteria/AC-O-17/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
