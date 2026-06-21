# AC-P-14 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我打开包含长 AC、长证据、多来源、reviewability 和 limitations 的 opennori report 后，仍然能顺畅阅读每条验收状态和证据依据，而不会被超长 Markdown 表格行破坏阅读体验。

Measurement: 生成一份包含长中文 AC、多个证据 sources、长 reviewability 和 limitations 的 OpenNori report，并用真实 AW 报告类场景检查 Acceptance Status 和后续详情排版。

Passing threshold: Acceptance Status 只保留短摘要列；长 user story、证据摘要、来源、reviewability 和 limitations 进入逐条 AC 详情块；常见 Markdown 渲染器中不会出现几千字符的证据表格行，sources 以列表形式可复查。

## Evidence

Latest: report-rendering-test - OpenNori report rendering now keeps the Acceptance Status table compact and moves long user stories, measurement, thresholds, evidence summary, multiple sources, reviewability, and limitations into per-criterion Acceptance Details blocks. The reporting test creates a long Chinese AC with command/path/url sources and asserts the old oversized table columns are gone, the compact table is present, sources render as a list, and no generated report line exceeds 240 characters.
Result: passing
Basis: tool-observation
Reviewability: Inspect src/core/report.ts for the compact Acceptance Status table and Acceptance Details renderer; inspect test/reporting.test.js for the long-report fixture and line-length assertion; rerun npm run test:reporting plus npm run test:quick, npm run test:cli, and npm run typecheck.
Limitations: This verifies Markdown report readability and evidence preservation for long report content. It does not prove every external Markdown viewer renders identically, and it does not replace human review of the generated report layout.

Sources:
- .opennori/architecture/evidence/opennori-self-ac-p-14-report-readability.json
- npm run test:reporting
- npm run test:quick
- npm run test:cli
- npm run typecheck
- src/core/report.ts
- test/reporting.test.js
- .opennori/architecture/evidence/opennori-self-ac-p-14-report-readability.json

## Files

- Criterion source: criteria/AC-P-14/criterion.json
- Status projection: criteria/AC-P-14/status.json
- Evidence ledger: criteria/AC-P-14/evidence
- Artifacts: criteria/AC-P-14/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
