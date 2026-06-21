# AC-P-4 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: protocol
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我查看高风险 AC 的状态时，能看到 agent 自我总结或弱证据即使被记录为 passing，也不会让 OpenNori 给出无风险的确信完成结论。

Measurement: 给 high risk AC 添加只有 agent summary 的 passing 证据，再查看 status、check 或 report。

Passing threshold: 高风险 AC 的证据记录保持 agent 提交的客观 result，但 CLI 必须暴露 review risk、confidence 或 evidence_health 警告，让用户知道还需要可复查来源、人类确认、限制说明或 waiver；CLI 不用硬编码强弱词表直接替用户裁判主观充分性。

## Evidence

Latest: review-result - High-risk passing evidence now preserves the agent-submitted objective result while exposing review risk through confidence and evidence_health instead of hard-downgrading by a fixed strong/weak evidence list. Evidence health also treats non-context custom sources such as screenshot, diff, log, command, artifact, URL, label, and summary-bearing sources as reviewable, so agent evidence remains flexible while context-only architecture sources still cannot prove Product AC by themselves.
Result: passing
Basis: tool-observation
Reviewability: Run the listed typecheck, Vitest, and rg commands; inspect src/core/evidence.ts for objective risk-gate/evidence-health behavior and test/core.test.js for high-risk and custom source coverage.
Limitations: This verifies the CLI boundary and evidence-health state behavior in the local worktree. It does not prove future agents will choose strong enough evidence; Skills and user review still decide subjective sufficiency.

Sources:
- .opennori/architecture/evidence/ac-p-4-high-risk-review-risk-boundary.json
- npm run typecheck
- npx vitest run test/core.test.js
- npx vitest run test/core.test.js --testNamePattern 'evidence health|flexible reviewable sources|custom non-context source|high-risk agent observation'
- npx vitest run test/cli-commands.test.js --testNamePattern dashboard
- rg -n 'PRODUCT_EVIDENCE_SOURCE_TYPES|strong-evidence-required|DEFAULT_CRITERIA|DISCOVERY_GAPS|BRAINSTORM_CANDIDATES|draft --goal|--from-discovery|--from-brainstorm|--from-next-candidate' src test plugins/opennori/skills README.md .opennori/protocol.md AGENTS.md
- src/core/evidence.ts
- src/core/report.ts
- src/agent-next.ts
- test/core.test.js
- plugins/opennori/skills/nori-evidence/SKILL.md
- README.md
- .opennori/protocol.md

## Files

- Criterion source: criteria/AC-P-4/criterion.json
- Status projection: criteria/AC-P-4/status.json
- Evidence ledger: criteria/AC-P-4/evidence
- Artifacts: criteria/AC-P-4/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
