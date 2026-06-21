# AC-O-10 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我在非 OpenNori 项目里已经和 agent 讨论过目标和 AC 后，要求 OpenNori 接管这段讨论时，最终看到的是基于已有讨论整理出的标准 Nori Contract Draft，并且状态保持 draft/need user，而不是重新 autogoal、直接开始实现或把讨论记录当作完成证据。

Measurement: 用户在 agent 对话中提供已有目标、AC、假设和未决问题后，说‘用 OpenNori 接管我们刚才讨论的 AC，整理成 Nori Contract Draft，不要开始实现，先给我确认。’

Passing threshold: agent 使用 nori-acceptance 将已有讨论材料整理为标准 draft Nori Contract，写入 .opennori/drafts，展示 Goal、AC、衡量方式、通过条件、假设和开放问题；status/report 表达 need user approve/revise，不进入 current/active、不记录 passing evidence、不走 autogoal 的粗略 idea 收敛路径。

## Evidence

Latest: review-result - OpenNori now supports adopting an in-progress AC discussion as a standard draft Nori Contract. The root nori Skill routes 'take over the AC we just discussed' to nori-acceptance, nori-acceptance prepares a brief with acceptance_basis.source conversation and writes only .opennori/drafts via draft --brief, nori-autogoal explicitly hands off already discussed AC material instead of treating it as a rough idea, and docs/site/default prompts show the user-facing phrase. Objective tests verify the adopted conversation brief remains draft with ACCEPTANCE-BASIS as current gap, no current contract, assumptions/open questions rendered, and no implementation/task-list/autogoal artifact wording.
Result: passing
Basis: tool-observation
Reviewability: Rerun npm run check in /Users/jarl/code/jarlone/opennori, rerun pnpm build in /Users/jarl/code/jarlone/opennori-site, inspect the packaged nori/nori-acceptance/nori-autogoal Skills and test/core.test.js conversation adoption brief test, then verify README/site examples show the natural-language adoption prompt.
Limitations: This verifies local source, packaged Skill behavior, deterministic draft state, tests, and website text. It does not publish npm or deploy the website in this slice; future agent behavior still depends on the installed Plugin cache being synced to this version.

Sources:
- .opennori/architecture/evidence/opennori-self-ac-o-10-aligned.json
- npm run check
- pnpm build (opennori-site)

## Files

- Criterion source: criteria/AC-O-10/criterion.json
- Status projection: criteria/AC-O-10/status.json
- Evidence ledger: criteria/AC-O-10/evidence
- Artifacts: criteria/AC-O-10/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
