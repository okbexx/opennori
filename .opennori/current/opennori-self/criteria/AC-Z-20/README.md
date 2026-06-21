# AC-Z-20 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我让 agent 从已完成目标的 candidate_goals 继续生成下一份 Nori Contract 草案时，看到的不是空泛候选包装，而是能指导我怎么验收的用户动作、结果和通过标准。

Measurement: 运行 opennori draft --from-next-candidate 生成 opennori-adoption-dogfood、real-user-validation 或 next-loop-usability 草案，并阅读每条 AC 的 measurement 和 threshold。

Passing threshold: 草案仍保持 draft/ACCEPTANCE-BASIS 待用户批准；每条 AC 的 measurement/threshold 说明用户入口、操作、报告/证据复查或摩擦点判断方式；不再出现“按这条候选方向检查新的目标结果、状态或报告”这类空泛模板。

## Evidence

Latest: behavior-test - Draft Nori Contracts now keep workflow status as draft until user approval; temporary project draft output and the Agent Workbench draft both show ledger.status=draft while AC rows remain unknown.
Result: passing
Basis: protocol-check
Reviewability: Inspect the listed files and rerun the targeted vitest command or create a temporary draft contract.
Limitations: This evidence covers draft workflow semantics, not the subjective quality of each drafted AC.

Sources:
- npx vitest run test/core.test.js -t 'draft requires user approval|next-loop candidates'
- tmp project: opennori draft reports ledger_status=draft and current_gap=ACCEPTANCE-BASIS
- src/core/contract.ts
- src/core/evidence.ts
- test/core.test.js

## Files

- Criterion source: criteria/AC-Z-20/criterion.json
- Status projection: criteria/AC-Z-20/status.json
- Evidence ledger: criteria/AC-Z-20/evidence
- Artifacts: criteria/AC-Z-20/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
