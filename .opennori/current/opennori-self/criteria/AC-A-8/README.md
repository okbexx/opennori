# AC-A-8 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: architecture
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我查看 OpenNori 自身 dogfood 状态时，能知道 Architecture Baseline 已建立，但后续架构修复是否真的完成不能被最小可运行结果误报。

Measurement: 查看 OpenNori 自身 status/report、Architecture Baseline、build-vs-buy decision、代码结构审查和后续架构修复证据。

Passing threshold: 报告能清楚显示 baseline 已建立、当前仍有哪些架构风险或未完成缺口；如果核心结构仍未完成修复，目标不能显示 complete。

## Evidence

Latest: architecture-refactor-verification - OpenNori CLI command infrastructure is now separated into registry, policies, resolver/help, runner/recovery, command types, and a compatibility command-tree barrel. The implementation still uses citty for defineCommand/subCommands/runCommand, while OpenNori-specific active-goal policy, write locking, no-current-goal recovery, and human/json output routing remain deterministic CLI concerns.
Result: passing
Basis: tool-observation
Reviewability: Inspect the listed CLI files: command-tree.ts should only re-export; registry.ts should own command grouping and citty defineCommand; policies.ts should own command policy metadata; resolver.ts should own command resolution and help/usage; runner.ts should own citty runCommand execution and active-goal recovery. Rerun the listed commands.
Limitations: This verifies the CLI command layer boundary and behavior. It does not claim every command module is fully domain-thin; later slices should audit lifecycle/setup and individual command modules.

Sources:
- .opennori/architecture/evidence/opennori-self-cli-command-layer-boundary.json
- npx ctx7@latest library citty 'citty command framework defineCommand runCommand subcommands command args help'
- npx ctx7@latest docs /unjs/citty 'citty command framework defineCommand runCommand subcommands command args help'
- npm run test:core
- npm run test:cli
- npx tsc --noEmit --pretty false
- npm run check
- node ./bin/opennori.js --help
- node ./bin/opennori.js doctor --root . --json
- node ./bin/opennori.js status --root . --json
- git diff --check
- src/cli/registry.ts
- src/cli/policies.ts
- src/cli/resolver.ts
- src/cli/runner.ts
- src/cli/command-types.ts
- src/cli/command-tree.ts
- test/core.test.js

## Files

- Criterion source: criteria/AC-A-8/criterion.json
- Status projection: criteria/AC-A-8/status.json
- Evidence ledger: criteria/AC-A-8/evidence
- Artifacts: criteria/AC-A-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
