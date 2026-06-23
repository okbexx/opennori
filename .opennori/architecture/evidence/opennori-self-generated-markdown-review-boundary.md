# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Generated acceptance Markdown is now an explicit review-surface-only helper rather than a contract state or import layer.

## Fit

The implementation keeps JSON/dossier files authoritative, moves Markdown parsing/rendering out of contract state construction, requires an OpenNori generated review marker before parsing, and returns authority/side-effect metadata for agent and tool consumers.

## Implementation Focus

Harden Markdown review-surface boundaries while preserving the TypeScript CLI/core source-of-truth architecture.

## Evidence

src/core/generated-acceptance-markdown.ts; src/core/contract.ts; src/core/dossier-render.ts; README.md; .opennori/protocol.md; npm run test:acceptance; npm run test:docs; npx tsc --noEmit --pretty false; npm run lint

## Limitations

This does not add editable Markdown import; future frontmatter or arbitrary Markdown import must go through a new build-vs-buy decision.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

