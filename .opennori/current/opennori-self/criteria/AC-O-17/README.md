# AC-O-17 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我在 draft 的 AC Review Loop 里修订某条 AC 后，OpenNori 仍然把这份 Nori Contract 保持为待确认草案，而不会把 acceptance_basis 自动标成 approved、不会跳到 profile/architecture/implementation，也不会把修订本身当作 evidence。

Measurement: 在一个带有 required Project Profile 的 draft 上运行 criterion update --from-draft，然后查看 status/current_gap、draft evidence JSON、acceptance markdown、nori-acceptance Skill 和协议文档。

Passing threshold: 修订 draft AC 后 acceptance_basis.status 仍为 draft，approved_at 不存在，source/mode/coverage 等 basis metadata 保留，workflow_status 为 draft，current_gap 为 ACCEPTANCE-BASIS；只有最终 approve 后才能进入 profile、architecture、implementation 或 evidence 路由。已批准 current contract 的 criterion update 仍会清理该 AC 的旧 evidence 并产生新的 evidence gap。

## Evidence

Latest: draft-revision-boundary-verification - Draft criterion revision remains goal-dossier state while Project Profile is separate project state. The criterion update path synchronizes contract.json, ledger.json, criterion README/status, and manifest for draft/current AC revisions; Project Profile requirements are created through profile add under .opennori/profile and no longer embedded into draft ledgers. The acceptance tests exercise a draft with a required Project Profile preference and verify acceptance_basis remains draft after criterion update.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed command modules and tests. In test/cli-acceptance.test.js, verify the draft revision fixture creates Project Profile with profile add and still asserts acceptance_basis.status remains draft after criterion update. Rerun acceptance/profile tests and typecheck.
Limitations: This proves state synchronization and Project Profile separation for draft AC revision. It does not replace the user's AC Review Loop confirmation of whether the revised AC wording is semantically correct.

Sources:
- .opennori/architecture/evidence/opennori-self-ac-o-17-project-profile-draft-revision.json
- npm run test:acceptance
- npm run test:profile
- npx tsc --noEmit --pretty false
- src/cli/commands/acceptance/criterion.ts
- src/cli/commands/profile/add.ts
- test/cli-acceptance.test.js
- test/cli-profile.test.js
- .opennori/protocol.md
- AGENTS.md

## Files

- Criterion source: criteria/AC-O-17/criterion.json
- Status projection: criteria/AC-O-17/status.json
- Evidence ledger: criteria/AC-O-17/evidence
- Artifacts: criteria/AC-O-17/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
