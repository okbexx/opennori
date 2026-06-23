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

Latest: architecture-profile-boundary-verification - Architecture Profile boundaries were split so src/architecture/profile.ts only resolves, lists, and writes profiles; builtin profile content lives in src/architecture/builtin-profiles.ts; objective descriptor, normalization, and validation live in src/architecture/profile-model.ts; shared technical baseline shape helpers live in src/architecture/technical-baseline.ts and are reused by baseline validation. Architecture profiles, doctor/status, focused CLI tests, architecture tests, typecheck, and diff checks passed.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed architecture files to confirm content, model validation, shared technical baseline helpers, and storage facade are separate. Rerun the listed focused verification commands.
Limitations: This proves the Architecture Profile boundary split and objective validation reuse for this slice. It does not prove subjective architecture quality for every future project profile; that remains packaged Skill and user review.

Sources:
- .opennori/architecture/evidence/opennori-self-architecture-profile-boundary.json
- npx tsc --noEmit --pretty false
- npm run test:architecture
- npm run test:cli -- --run test/cli-architecture.test.js test/cli-core.test.js
- node ./bin/opennori.js architecture profiles --root . --json
- node ./bin/opennori.js doctor --root . --json
- node ./bin/opennori.js status --root . --json
- git diff --check
- src/architecture/profile.ts
- src/architecture/builtin-profiles.ts
- src/architecture/profile-model.ts
- src/architecture/technical-baseline.ts
- src/architecture/baseline.ts

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
