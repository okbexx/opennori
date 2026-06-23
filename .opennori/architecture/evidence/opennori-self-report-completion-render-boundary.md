# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Split OpenNori completion/routing decisions from Markdown report rendering while preserving src/core/report.ts as the public compatibility export.

## Fit

The TypeScript agent-state CLI baseline keeps deterministic completion, intervention, recommendation, and report rendering in separate domain modules: src/core/completion.ts owns objective state decisions; src/core/report-render.ts owns human-readable Markdown; src/core/report.ts remains a stable barrel.

## Implementation Focus

Reduce core report module responsibility without changing user-facing report/status behavior or moving subjective AC quality into hard validators.

## Evidence

npm run test:reporting; npm run test:core; npx tsc --noEmit --pretty false; node ./bin/opennori.js doctor --root . --json; node ./bin/opennori.js status --root . --json; git diff --check

## Limitations

This refactor preserves current behavior and module boundaries. It does not redesign report content, evidence health semantics, or subjective acceptance review; those remain separate future product decisions.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

