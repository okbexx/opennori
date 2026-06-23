# AC-A-8 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我查看 OpenNori 自身 dogfood 状态时，能知道 Architecture Baseline 已建立，但后续架构修复是否真的完成不能被最小可运行结果误报。

Measurement: 查看 OpenNori 自身 status/report、Architecture Baseline、build-vs-buy decision、代码结构审查和后续架构修复证据。

Passing threshold: 报告能清楚显示 baseline 已建立、当前仍有哪些架构风险或未完成缺口；如果核心结构仍未完成修复，目标不能显示 complete。

## Evidence

Latest: completion-routing-boundary-verification - Completion answer, user intervention, review risk, and next recommendation routing were split into focused modules while keeping public reporting/status imports stable.
Result: passing
Basis: tool-observation
Reviewability: Inspect the new completion modules. Confirm completion-answer only computes completion/confidence/review risks, intervention only identifies user input needs, next-recommendation owns routing guidance, and completion.ts remains a compatibility export for existing status/report/check call sites.
Limitations: This is an internal boundary refactor. It does not change OpenNori subjective review policy, add new recommendation states, or alter Skill behavior.

Sources:
- .opennori/architecture/evidence/opennori-self-completion-routing-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:reporting
- npm run test:profile
- npm run test:architecture
- npm run lint
- src/core/completion.ts
- src/core/acceptance-basis.ts
- src/core/intervention.ts
- src/core/completion-risks.ts
- src/core/completion-answer.ts
- src/core/next-recommendation.ts
- src/core/report-render.ts
- src/agent-next.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
