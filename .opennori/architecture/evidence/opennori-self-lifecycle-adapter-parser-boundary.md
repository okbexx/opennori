# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Lifecycle external command stdout parsing stays inside narrow adapters instead of setup or plugin-sync orchestration.

## Fit

The Codex Plugin adapter now absorbs minor Codex CLI plugin-list output drift while setup.ts and plugin-sync.ts continue to consume inspectCodexMarketplace/inspectCodexPlugin probes rather than parsing stdout directly.

## Implementation Focus

Keep setup/plugin-sync as preview-confirm orchestration layers and keep external command probing/parsing behind lifecycle adapters.

## Evidence

src/lifecycle/adapters/codex-plugin.ts; src/lifecycle/setup.ts; src/lifecycle/plugin-sync.ts; test/lifecycle-adapters.test.ts; npx vitest run test/lifecycle-adapters.test.ts; npm run test:lifecycle; npx tsc --noEmit --pretty false; npm run lint

## Limitations

This hardens current Codex CLI text output parsing only. If Codex exposes structured JSON output or an SDK later, OpenNori should prefer that over continued text parsing.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

