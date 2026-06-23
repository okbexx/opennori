# AC-P-15 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: high
Required: yes
Risk: medium

## Criterion

User story: 作为 OpenNori 维护者或用户，我查看测试体系时，能清楚区分自动化测试只保护客观协议、状态、CLI、schema、report 和资产结构，而 AC 质量、UI/CRUD/Dashboard 操作路径挖掘、Enhanced Discovery 和 Skill 判断效果留给 Skills、dogfood、eval prompts 与用户复核。

Measurement: 打开 docs/testing.md、AGENTS.md、test/ 目录、package.json 测试脚本和本机 nori-product-development Skill；再运行 quick 与对应领域测试脚本。

Passing threshold: test/core.test.js 只保留窄核心不变量；原 cli-commands 巨型测试被拆成 test/cli-*.test.js；acceptance/evidence/reporting/profile/lifecycle/architecture/docs-schema 等领域测试各自覆盖客观状态；文档和 Skill 明确禁止用自然语言词表或固定 prompt 断言来证明 agent 主观能力；npm run test:quick 和领域脚本可单独运行并通过。

## Evidence

Latest: test-boundary-verification - Test architecture now keeps subjective Skill judgment out of hard-coded word-list assertions: core tests are narrow, CLI source boundary lives in module-boundaries, and Skill description tests check discovery metadata shape rather than judging AC quality.
Result: passing
Basis: tool-observation
Reviewability: Review test/core.test.js, test/docs-schema.test.js, test/module-boundaries.test.js, docs/testing.md, and docs/skill-evals.md; rerun focused tests plus lint/typecheck/check.
Limitations: This verifies the automated test boundary. It does not evaluate whether a live agent will generate strong AC in a real user conversation; that remains covered by Skill dogfood evals.

Sources:
- .opennori/architecture/evidence/opennori-self-ac-p-15-subjective-test-boundary.json
- npx vitest run test/core.test.js test/docs-schema.test.js test/module-boundaries.test.js
- npm run lint
- npx tsc --noEmit --pretty false
- node ./bin/opennori.js check --root . --json
- test/core.test.js
- test/docs-schema.test.js
- test/module-boundaries.test.js
- docs/testing.md
- docs/skill-evals.md

## Files

- Criterion source: criteria/AC-P-15/criterion.json
- Status projection: criteria/AC-P-15/status.json
- Evidence ledger: criteria/AC-P-15/evidence
- Artifacts: criteria/AC-P-15/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
