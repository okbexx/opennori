# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Lifecycle setup/plugin-sync orchestration now imports only narrow result helpers and module-boundary tests keep Codex/npm stdout parsing plus process execution inside lifecycle adapters.

## Fit

The confirmed TypeScript agent-state CLI baseline keeps install/setup/plugin-sync as preview/confirm orchestration while official Codex/npm CLIs and narrow adapters own external command execution and output parsing.

## Implementation Focus

Prevent setup/plugin-sync plan/action/execution modules from parsing stdout, importing child_process, or relying on the wide core barrel.

## Evidence

npx vitest run test/lifecycle-adapters.test.ts test/module-boundaries.test.js test/cli-lifecycle.test.js passed; npx tsc --noEmit --pretty false passed.

## Limitations

This slice does not replace the Codex or npm CLI integration; it only tightens adapter boundaries around existing official CLI delegation.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
