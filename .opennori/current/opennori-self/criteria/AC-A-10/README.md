# AC-A-10 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我能在一个非 OpenNori 核心仓库里，按新的 Plugin-first 边界完整跑通自然语言目标、Product AC、Architecture Baseline、执行、证据、报告和完成判断。

Measurement: 选择一个非 OpenNori 核心仓库，使用当前 OpenNori 从目标到报告跑完；过程中只通过 Plugin Skills 和 .opennori 状态驱动 OpenNori 能力。

Passing threshold: 报告同时呈现产品完成状态、架构健康状态、Plugin package 能力、证据、未解决风险和是否需要用户确认；用户不需要记住 CLI 参数；doctor/check 不依赖项目内 Skill 资产副本。

## Evidence

Latest: dogfood-result - OpenNori was dogfooded in the separate opennori-site repo under the current Plugin-first boundary: a natural-language website goal became Product AC, an Astro Architecture Baseline and build-vs-buy decision were confirmed, homepage content was implemented, reviewable evidence was recorded, report/status completed, and the dogfood validated active-goal write locking.
Result: passing
Basis: tool-observation
Reviewability: Review opennori-site status/report/build output and listed .opennori artifacts; rerun the concurrent evidence test for state consistency.
Limitations: Dogfood covered a static Astro website repo and local CLI behavior; it did not validate a third-party production app or remote deployed website.

Sources:
- cd /Users/jarl/code/jarlone/opennori-site && node /Users/jarl/code/jarlone/opennori/bin/opennori.js status --root . --goal opennori-site-plugin-first --json
- cd /Users/jarl/code/jarlone/opennori-site && node /Users/jarl/code/jarlone/opennori/bin/opennori.js report --root . --goal opennori-site-plugin-first --json
- cd /Users/jarl/code/jarlone/opennori-site && npm run build
- cd /Users/jarl/code/jarlone/opennori && npx vitest run test/core.test.js -t 'concurrent evidence writes'
- /Users/jarl/code/jarlone/opennori-site/.opennori/active/opennori-site-plugin-first.acceptance.md
- /Users/jarl/code/jarlone/opennori-site/.opennori/active/opennori-site-plugin-first.evidence.json
- /Users/jarl/code/jarlone/opennori-site/.opennori/reports/opennori-site-plugin-first.report.md
- /Users/jarl/code/jarlone/opennori-site/.opennori/architecture/baseline.md
- src/cli/runtime.ts
- test/core.test.js

## Files

- Criterion source: criteria/AC-A-10/criterion.json
- Status projection: criteria/AC-A-10/status.json
- Evidence ledger: criteria/AC-A-10/evidence
- Artifacts: criteria/AC-A-10/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
