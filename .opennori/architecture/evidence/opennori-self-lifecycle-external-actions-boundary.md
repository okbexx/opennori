# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Extracted shared lifecycle external-command action infrastructure used by setup and plugin sync while preserving setup/plugin-sync preview and confirm semantics.

## Fit

OpenNori's confirmed baseline treats lifecycle commands as deterministic capability-bundle state orchestration. The shared external-actions module keeps command runner, command display, preview action, summary, and apply-result behavior in one infrastructure boundary, while setup.ts and plugin-sync.ts keep their product-specific bundle logic.

## Implementation Focus

Lifecycle setup/plugin-sync external command planning and execution boundary.

## Evidence

git diff --check

## Limitations

This verifies setup/plugin-sync shared lifecycle infrastructure. It does not yet refactor install/upgrade/uninstall managed-file planning or lifecycle doctor internals.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

