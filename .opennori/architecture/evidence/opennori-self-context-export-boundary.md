# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Context export will be split into read-only state collection, review payload assembly, and explicit artifact writing so external review tools can inspect OpenNori context without becoming a second runtime or report authority.

## Fit

The change follows the TypeScript agent-state CLI baseline: .opennori JSON remains the source of truth, core modules compute objective state, and context export only projects reviewable data for external tools.

## Implementation Focus

Split context export boundaries while preserving the existing opennori context export schema and CLI behavior.

## Evidence

src/lifecycle/context-export.ts currently combines state loading, payload assembly, path projection, and agent_next routing in one function; MCP already consumes it as a read-only resource.

## Limitations

This apply record covers context export module boundaries; validation will still be needed after code changes.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
