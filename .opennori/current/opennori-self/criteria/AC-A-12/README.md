# AC-A-12 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我让 agent 用 OpenNori 起草、追问、记录证据或继续下一轮目标时，CLI 不会用内置自然语言模板、词表或候选目标替我判断主观产品语义；这些判断由 packaged Skills、agent 和用户确认完成。

Measurement: 用户或评审者检查 opennori draft/discover/brainstorm/status/report/context export、CLI 源码、测试和 OpenNori Skills。

Passing threshold: CLI 只校验和保存 contract/evidence/profile/architecture/report 的客观结构、状态一致性和 review risk；不再内置默认 Product AC、固定 discovery gap 词表、固定 brainstorm 候选、完成后自动生成下一轮产品目标，或把高风险证据强弱直接硬改为主观完成裁判；Skills 明确负责生成/复核 AC、候选目标和证据充分性。

## Evidence

Latest: review-result - OpenNori validation is split into layered Vitest tags and npm scripts: npm test/test:quick runs a true fast smoke subset, domain scripts run acceptance/architecture/dashboard/docs/evidence/lifecycle/profile/reporting/schema tests, and check:full remains the release-grade full gate. Test-internal duplicate npm run build calls were removed from built-dist package tests so full validation does not rebuild twice inside Vitest.
Result: passing
Basis: tool-observation
Reviewability: Review package scripts, Vitest tag config, test tags, README/AGENTS verification instructions, and rerun the listed commands.
Limitations: Quick tests are intentionally a smoke subset; domain scripts and check:full remain required for broader changes, lifecycle/package boundaries, and release validation.

Sources:
- command:npm run check
- command:npm run test:acceptance
- command:npm run test:schema
- command:npm run test:dashboard
- command:npm run test:package
- command:npm run test:architecture
- command:npm run check:full
- command:git diff --check
- artifact:package.json
- artifact:vitest.config.ts
- artifact:test/core.test.js
- artifact:test/cli-commands.test.js
- artifact:README.md
- artifact:AGENTS.md

## Files

- Criterion source: criteria/AC-A-12/criterion.json
- Status projection: criteria/AC-A-12/status.json
- Evidence ledger: criteria/AC-A-12/evidence
- Artifacts: criteria/AC-A-12/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
