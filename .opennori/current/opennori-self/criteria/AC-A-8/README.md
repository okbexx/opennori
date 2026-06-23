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

Latest: write-command-review-routing-boundary-refactor - State-mutating CLI commands now route post-write current_gap, next_recommendation, and agent_next through goalReviewState instead of assembling routing responses with ad hoc currentGap/nextRecommendation calls. Evidence, profile, acceptance approval/evaluate/criterion, and architecture requirement/baseline command responses now use the shared read model after deterministic writes.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed command files and confirm state writes remain command-local while response routing fields come from goalReviewState. Rerun the listed validation commands.
Limitations: This only centralizes response routing after deterministic writes. Inventory/probe surfaces such as manifest, doctor, list, changes, activity-target, and draft creation may still compute lightweight current_gap summaries because they are not completion routing authorities.

Sources:
- .opennori/architecture/evidence/opennori-self-write-command-review-routing-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:cli
- npm run test:evidence
- npm run test:profile
- npm run test:architecture
- npm run lint
- node ./bin/opennori.js check --root . --json
- node ./bin/opennori.js status --root . --json
- src/cli/commands/evidence/add.ts
- src/cli/commands/evidence/prune.ts
- src/cli/commands/profile/add.ts
- src/cli/commands/profile/check.ts
- src/cli/commands/profile/evidence.ts
- src/cli/commands/acceptance/approval.ts
- src/cli/commands/acceptance/criterion.ts
- src/cli/commands/acceptance/runtime-status.ts
- src/cli/commands/architecture/requirement.ts
- src/cli/commands/architecture/baseline.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
