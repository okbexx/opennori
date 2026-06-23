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

Latest: goal-dossier-markdown-boundary-verification - Goal dossier Markdown now remains a generated review surface only: the stale generated acceptance Markdown parser/helper was removed, core.ts no longer exports Markdown parsing, README files declare review-surface-only, and boundary tests prevent Markdown import/parser APIs from returning as state paths.
Result: passing
Basis: tool-observation
Reviewability: Inspect that src/core/generated-acceptance-markdown.ts no longer exists, src/core.ts no longer exports generated-acceptance-markdown, goal README files carry opennori/goal-dossier-readme-v1 review-surface-only, and module-boundary tests fail any Markdown import/parser state path.
Limitations: This intentionally removes editable Markdown parsing from OpenNori. Future Markdown-as-data support would require a new build-vs-buy decision and parser stack selection.

Sources:
- .opennori/architecture/evidence/opennori-self-goal-dossier-markdown-review-boundary.json
- npx vitest run test/acceptance.test.js test/docs-schema.test.js test/module-boundaries.test.js
- npx tsc --noEmit --pretty false
- src/core/dossier-render.ts
- src/core.ts
- src/types/evidence.ts
- test/module-boundaries.test.js
- test/acceptance.test.js
- test/docs-schema.test.js
- .opennori/architecture/decisions/editable-markdown-parsing-keep-json-authoritative-and-revisit-micromark.json

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
