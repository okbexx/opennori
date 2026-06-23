# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Setup lifecycle responsibilities will be split into setup type definitions, action builders, plan construction, and execution orchestration while preserving preview-first bundle setup semantics.

## Fit

The confirmed TypeScript agent-state CLI baseline keeps lifecycle state deterministic: setup remains a CLI/core orchestration surface over official Codex and npm CLIs, project bootstrap, and doctor, with no project-local Skill copy path.

## Implementation Focus

Refactor src/lifecycle/setup.ts into focused lifecycle modules so future setup/plugin capability changes do not mix external command probes, action rendering, project initialization, and result assembly in one module.

## Evidence

Read src/lifecycle/setup.ts, plugin-sync.ts, external-actions.ts, lifecycle adapters, and lifecycle tests; setup.ts currently mixes action construction, plan building, command execution, bootstrap, doctor, and result assembly.

## Limitations

This architecture apply covers internal setup module boundaries only. It does not change first-time setup UX, Codex Plugin commands, npm install behavior, or project .opennori state semantics.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
