# AC-Z-17 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我第一次打开 README 或官网 Quick Start 时，能看到短到可以直接复制的 npx opennori 入口，而不是一串内部安装参数。

Measurement: 阅读 README Try It 和官网首屏 Quick Start / Start 区域。

Passing threshold: README 和官网第一眼 Quick Start 展示 npx opennori；更详细的 opennori bootstrap、install、dry-run、confirm 只作为 agent 或高级用户的底层安全路径出现。

## Evidence

Latest: review-result - README and website quickstart lead with short commands: try once with npx opennori, pin with npm install -D opennori, then use opennori as the project-local entry.
Result: passing
Basis: tool-observation
Reviewability: Open README and website source, or run the rg command, to verify the visible quickstart copy.
Limitations: This verifies local website source; public site deployment is a separate release step.

Sources:
- rg -n 'npx opennori|npm install -D opennori|opennori' README.md /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro
- README.md
- /Users/jarl/code/jarlone/opennori-site/src/pages/index.astro

## Files

- Criterion source: criteria/AC-Z-17/criterion.json
- Status projection: criteria/AC-Z-17/status.json
- Evidence ledger: criteria/AC-Z-17/evidence
- Artifacts: criteria/AC-Z-17/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
