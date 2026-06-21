# AC-2 Acceptance Dossier

Goal: 让 OpenNori 自身形成成熟开源库和官方 SDK 优先的 build-vs-buy 工程习惯：通用基础设施在实现前必须评估当前项目依赖、标准库、官方 SDK、成熟开源库；只有许可证、维护性、安全、包体积、性能或产品边界不满足时才允许最小自研。
Layer: acceptance
Status: passing
Confidence: reviewed
Required: yes
Risk: high

## Criterion

User story: 作为用户，我查看 OpenNori 自身的架构决策时，能复查每个通用产品基础能力是否优先评估了可复用方案，而不是把用户入口、项目状态、可编辑文档和安装升级卸载体验默认手写。

Measurement: 用户打开 .opennori/architecture/decisions 下的 build-vs-buy 决策，或查看 opennori architecture show / report 输出。

Passing threshold: 与通用产品基础能力相关的决策记录包含 current project、standard library、official SDK、open source candidates、recommendation；recommendation 为 self-build 时还必须说明许可证、维护性、安全、包体积、性能或产品边界理由。

## Evidence

Latest: review-result - OpenNori self architecture decisions now include active reusable-library decisions for citty, JSON Schema/Ajv, yaml frontmatter, and directory-based Skill Pack assets; obsolete parseArgs and JS-string Skill decisions are explicitly marked superseded rather than silently treated as current architecture.
Result: passing
Basis: artifact-review
Reviewability: Open architecture show output or the listed decision JSON files and verify current_project, standard_library, official_sdk, open_source, recommendation, status, superseded_by, and self_build_reason where applicable.
Limitations: Some active decisions intentionally keep OpenNori product-domain semantics local; the current CLI implementation is still an incremental migration, not a completed citty rewrite.

Sources:
- node ./bin/opennori.js architecture show --root . --json
- .opennori/architecture/decisions/cli-command-layer-adopt-citty-for-long-term-typescript-cli.json
- .opennori/architecture/decisions/skill-pack-directory-assets.json
- .opennori/architecture/decisions/protocol-state-validation-reuse-json-schema-validator-when-contracts-grow.json
- .opennori/architecture/decisions/editable-markdown-parsing-keep-json-authoritative-and-revisit-micromark.json
- .opennori/architecture/decisions/cli-argument-parsing-replace-growing-ad-hoc-option-scanning-with.json
- .opennori/architecture/decisions/skill-pack-将-opennori-skill-pack-从-cli-入口拆到独立产品面模块.json

## Files

- Criterion source: criteria/AC-2/criterion.json
- Status projection: criteria/AC-2/status.json
- Evidence ledger: criteria/AC-2/evidence
- Artifacts: criteria/AC-2/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
