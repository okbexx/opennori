# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Plugin sync lifecycle responsibilities will be split into type definitions, action builders, plan construction, and execution orchestration while preserving preview-first Codex Plugin cache refresh semantics.

## Fit

The confirmed TypeScript agent-state CLI baseline treats plugin sync as a lifecycle command over official Codex Plugin CLI commands and packaged Skill assets. It must not write project .opennori state, copy Skills into project directories, or become a second setup path.

## Implementation Focus

Refactor src/lifecycle/plugin-sync.ts into focused modules so local source Skill cache refresh and npm-installed plugin sync share clear action, plan, and execution boundaries.

## Evidence

Read src/lifecycle/plugin-sync.ts, setup lifecycle split, external-actions.ts, Codex plugin adapters, CLI plugin command, human output, and plugin sync tests; plugin-sync.ts currently mixes marketplace probing, action construction, plan building, command execution, and result assembly.

## Limitations

This architecture apply covers internal plugin-sync module boundaries only. It does not change opennori plugin sync CLI flags, Codex Plugin command strings, preview/confirm safety, or project state write boundaries.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
