# AC-A-9 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我打开 README 或官网时，能理解 OpenNori 同时提供产品验收、架构基线、Plugin Skills、证据和完成判断，而不是过程模板工具。

Measurement: 阅读 README、官网首页、protocol 和 OpenNori Skills。

Passing threshold: 用户能看到 Architecture Baseline、Architecture Challenge、build-vs-buy、Plugin Skills、项目 profile 和 Product AC 分离的说明与用例。

## Evidence

Latest: artifact-review - README, protocol, package Skills, and website describe OpenNori as Product AC plus Architecture Baseline plus Plugin Skills plus flexible evidence and completion judgment, with natural-language examples for users.
Result: passing
Basis: tool-observation
Reviewability: Read README/protocol/Skills and website source, then run the rg command to verify current product language.
Limitations: Website source is local; public deployment verification is separate.

Sources:
- rg -n 'Product AC|Architecture Baseline|Plugin Skills|evidence|completion|npx opennori' README.md .opennori/protocol.md plugins/opennori/skills /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro
- README.md
- .opennori/protocol.md
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-architecture-brainstorm/SKILL.md
- /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro

## Files

- Criterion source: criteria/AC-A-9/criterion.json
- Status projection: criteria/AC-A-9/status.json
- Evidence ledger: criteria/AC-A-9/evidence
- Artifacts: criteria/AC-A-9/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
