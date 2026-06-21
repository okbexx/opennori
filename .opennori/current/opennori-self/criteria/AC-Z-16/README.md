# AC-Z-16 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: high
Required: yes
Risk: high

## Criterion

User story: 作为用户，我通过 npm 获取 OpenNori 后，能用 opennori 或 npx opennori 这个短入口开始，而不需要理解 install、root、dry-run、confirm 或内部 Skill 参数。

Measurement: 在全新临时项目中运行 opennori 或 npx opennori 等价入口，再确认 bootstrap 后运行 opennori doctor。

Passing threshold: npm 包只提供 opennori 这个 bin；短入口默认展示首次接入 preview 且不写入项目；显式确认后只创建 .opennori 状态；不会向项目写入 package Skill assets；doctor 为 ready。

## Evidence

Latest: local-global-bin-link-fix - Dogfood found npm link created a global opennori command pointing at dist/bin/opennori.js, but the compiled dist file was not executable, so zsh reported permission denied. OpenNori package bin now points to the executable bin/opennori.js wrapper, which supports source checkouts and published packages; npm link now creates a PATH command that runs opennori init preview correctly.
Result: passing
Basis: tool-observation
Reviewability: Inspect package bin metadata and the refreshed npm link symlink; rerun opennori init --json from any temporary project to confirm preview works without writing.
Limitations: This verifies the local npm link development path on the current Node v22.19.0 environment; published npm behavior will be covered when the next package version is packed or published.

Sources:
- opennori init --json in a temporary directory
- npm run check
- package.json
- package-lock.json
- test/core.test.js

## Files

- Criterion source: criteria/AC-Z-16/criterion.json
- Status projection: criteria/AC-Z-16/status.json
- Evidence ledger: criteria/AC-Z-16/evidence
- Artifacts: criteria/AC-Z-16/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
