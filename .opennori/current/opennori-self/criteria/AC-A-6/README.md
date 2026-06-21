# AC-A-6 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我运行 doctor/check 时，能知道 Architecture Baseline 是否可用、Plugin Skills 是否随包可用、manifest 是否记录该能力，以及项目提示是否过期。

Measurement: 运行 opennori doctor/check，并查看缺失 baseline、缺失 Plugin assets、manifest stale 或项目提示过期时的输出。

Passing threshold: doctor/check 返回 ready、needs-action 或 broken，并显示用户能执行或交给 agent 执行的恢复建议；恢复建议不要求把 OpenNori Skills 复制进用户项目。

## Evidence

Latest: review-result - opennori check/report/context export are clean for opennori-self after architecture/build-vs-buy completion-risk wiring: architecture_check is clear, build_vs_buy is clear, evidence_health is clear, and completion is confident.
Result: passing
Basis: tool-observation
Reviewability: Rerun the listed commands and inspect report/context export for confident completion and clear architecture/build-vs-buy state.
Limitations: This records the current repository health; later managed-file or Skill asset changes should rerun doctor/check.

Sources:
- npm run check
- node ./bin/opennori.js check --root . --goal opennori-self --json
- node ./bin/opennori.js report --root . --goal opennori-self --json
- node ./bin/opennori.js context export --root . --goal opennori-self --output .opennori/reports/opennori-self.context.json --json
- .opennori/reports/opennori-self.report.md
- .opennori/reports/opennori-self.context.json

## Files

- Criterion source: criteria/AC-A-6/criterion.json
- Status projection: criteria/AC-A-6/status.json
- Evidence ledger: criteria/AC-A-6/evidence
- Artifacts: criteria/AC-A-6/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
