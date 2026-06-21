# AC-1 Acceptance Dossier

Goal: 让 OpenNori 自身形成成熟开源库和官方 SDK 优先的 build-vs-buy 工程习惯：通用基础设施在实现前必须评估当前项目依赖、标准库、官方 SDK、成熟开源库；只有许可证、维护性、安全、包体积、性能或产品边界不满足时才允许最小自研。
Layer: acceptance
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我让 agent 用 OpenNori 推进 OpenNori 自身的通用基础设施改动时，能在 status、check、doctor 或 report 中看到 build-vs-buy 健康状态，而不是只看到 agent 说已经考虑过复用。

Measurement: 用户让 agent 运行 opennori status、opennori check、opennori doctor 或 opennori report，并查看 Architecture / build-vs-buy 区域。

Passing threshold: 输出显示 build-vs-buy 是 clear、needs-action 或 broken；如果某个基础设施决策缺少当前项目、标准库、官方 SDK、成熟开源库或自研理由，用户能看到具体 decision、问题和恢复动作。

## Evidence

Latest: review-result - OpenNori status/check/doctor/report now expose build-vs-buy health as clear, needs-action, or broken; missing candidate fields and self-build reasons surface as build_vs_buy warnings and doctor recovery actions, while superseded historical decisions remain reviewable without counting as current health.
Result: passing
Basis: tool-observation
Reviewability: Run npm run check, then inspect architecture.build_vs_buy in status/check/report and doctor check build_vs_buy_health; the test suite includes missing-field and superseded-decision regressions.
Limitations: This verifies the build-vs-buy health surface and current OpenNori self decisions; it does not mean every future infrastructure area is already migrated.

Sources:
- npm run check
- node ./bin/opennori.js check --root . --goal opennori-build-vs-buy-maturity --json
- node ./bin/opennori.js doctor --root . --json
- node ./bin/opennori.js status --root . --goal opennori-build-vs-buy-maturity --json
- src/architecture.js
- src/cli.js
- src/lifecycle.js
- test/core.test.js

## Files

- Criterion source: criteria/AC-1/criterion.json
- Status projection: criteria/AC-1/status.json
- Evidence ledger: criteria/AC-1/evidence
- Artifacts: criteria/AC-1/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
