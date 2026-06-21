# AC-3 Acceptance Dossier

Goal: 让 OpenNori 自身形成成熟开源库和官方 SDK 优先的 build-vs-buy 工程习惯：通用基础设施在实现前必须评估当前项目依赖、标准库、官方 SDK、成熟开源库；只有许可证、维护性、安全、包体积、性能或产品边界不满足时才允许最小自研。
Layer: acceptance
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我查看 OpenNori 自身当前报告时，能判断它哪些地方已经复用了标准库或成熟库、哪些地方仍保留最小自研，以及这些自研是否属于 OpenNori 产品语义而不是通用基础设施。

Measurement: 用户查看 opennori report、architecture show、package.json 和相关 build-vs-buy evidence。

Passing threshold: 报告和证据能区分复用、最小自研和待处理风险；如果 schema、Markdown 或 CLI 仍手写过重但没有充分决策证据，目标不能被判断为 complete。

## Evidence

Latest: review-result - OpenNori report/status now let a user distinguish active reuse decisions, superseded historical decisions, and minimal self-build product glue; Skill Pack source of truth has moved to skills/*/SKILL.md, package dependencies now include citty/Ajv/yaml/Clack, and build-vs-buy health reports 9 active decisions plus 3 superseded decisions with no findings.
Result: passing
Basis: tool-observation
Reviewability: Run report and architecture show, then inspect package.json, src/skills.js, skills/*/SKILL.md, and the generated report to verify active/superseded/self-build distinctions.
Limitations: This slice fixes Skill Pack asset architecture and build-vs-buy reporting; the later TypeScript/citty command-module migration and public JSON Schema validation are still future implementation slices.

Sources:
- node ./bin/opennori.js report --root . --goal opennori-build-vs-buy-maturity --json
- node ./bin/opennori.js architecture show --root . --json
- node ./bin/opennori.js skill export --pack --json
- package.json
- src/skills.js
- skills/nori/SKILL.md
- skills/nori-build-vs-buy/SKILL.md
- .opennori/reports/opennori-build-vs-buy-maturity.report.md

## Files

- Criterion source: criteria/AC-3/criterion.json
- Status projection: criteria/AC-3/status.json
- Evidence ledger: criteria/AC-3/evidence
- Artifacts: criteria/AC-3/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
