# AC-P-15 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为 OpenNori 维护者或用户，我查看测试体系时，能清楚区分自动化测试只保护客观协议、状态、CLI、schema、report 和资产结构，而 AC 质量、UI/CRUD/Dashboard 操作路径挖掘、Enhanced Discovery 和 Skill 判断效果留给 Skills、dogfood、eval prompts 与用户复核。

Measurement: 打开 docs/testing.md、AGENTS.md、test/ 目录、package.json 测试脚本和本机 nori-product-development Skill；再运行 quick 与对应领域测试脚本。

Passing threshold: test/core.test.js 只保留窄核心不变量；原 cli-commands 巨型测试被拆成 test/cli-*.test.js；acceptance/evidence/reporting/profile/lifecycle/architecture/docs-schema 等领域测试各自覆盖客观状态；文档和 Skill 明确禁止用自然语言词表或固定 prompt 断言来证明 agent 主观能力；npm run test:quick 和领域脚本可单独运行并通过。

## Evidence

Latest: test-system-refactor-review - OpenNori test coverage has been reorganized around objective protocol boundaries instead of one giant core/CLI suite. core.test.js now contains only narrow core invariants; the former CLI mega-suite is split into focused cli-domain files; acceptance, evidence, reporting, profile, lifecycle, architecture, docs-schema, and dashboard tests own their domains. docs/testing.md, AGENTS.md, and the local nori-product-development Skill state that automated tests must not prove subjective AC quality, UI/CRUD/Dashboard discovery quality, enhanced autogoal judgment, or exact prompt wording; those belong to Skills, dogfood, eval prompts, and user review.
Result: passing
Basis: tool-observation
Reviewability: Open docs/testing.md, AGENTS.md, package.json scripts, and the listed test files. Confirm core.test.js is narrow, there is no remaining test/cli-commands reference, the CLI suite is split by command domain, and the docs/Skill explicitly keep subjective agent ability out of automated tests. Rerun the listed lint/typecheck/domain commands.
Limitations: This proves the repository test architecture and current focused verification. It does not prove future Skills will always produce ideal ACs; that remains an agent Skill, dogfood, eval, and human review responsibility.

Sources:
- .opennori/architecture/evidence/opennori-self-ac-p-15-test-system-boundary.json
- npm run lint
- npm run typecheck
- npm run test:quick
- npm run test:docs
- npm run test:schema
- npm run test:reporting
- npm run test:cli
- rg -n 'cli-commands\.test|test/cli-commands' AGENTS.md docs test package.json /Users/jarl/code/jarlone/.agents/skills/nori-product-development/SKILL.md
- docs/testing.md
- AGENTS.md
- /Users/jarl/code/jarlone/.agents/skills/nori-product-development/SKILL.md
- test/core.test.js
- test/acceptance.test.js
- test/evidence.test.js
- test/reporting.test.js
- test/profile.test.js
- test/lifecycle.test.js
- test/architecture.test.js
- test/docs-schema.test.js
- test/cli-core.test.js
- test/cli-lifecycle.test.js
- test/cli-human-output.test.js
- test/cli-acceptance.test.js
- test/cli-reporting.test.js
- test/cli-architecture.test.js
- test/cli-profile.test.js
- test/cli-dashboard.test.js
- test/cli-evidence.test.js
- test/support/cli.js
- test/support/command-fixtures.js
- package.json

## Files

- Criterion source: criteria/AC-P-15/criterion.json
- Status projection: criteria/AC-P-15/status.json
- Evidence ledger: criteria/AC-P-15/evidence
- Artifacts: criteria/AC-P-15/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
