# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Split the CLI command layer into registry, policy, resolver, runner, and compatibility barrel modules while keeping citty as the command framework.

## Fit

The TypeScript agent-state CLI baseline says CLI command definitions should be thin citty modules that delegate state and product semantics to domain modules. This slice keeps citty defineCommand/runCommand/subCommands as framework infrastructure and separates OpenNori execution policy and recovery.

## Implementation Focus

Reduce src/cli/command-tree.ts from a mixed registry/resolver/help/runner/recovery file into explicit command layer modules without changing commands, args, human help, or JSON payload semantics.

## Evidence

Context7 /unjs/citty docs confirm defineCommand, subCommands, and runCommand are the framework surface; npm run test:core, npm run test:cli, npx tsc --noEmit, npm run check, doctor/status, help output, and git diff --check passed.

## Limitations

This slice separates CLI command layer infrastructure. It does not yet refactor individual command modules, lifecycle setup orchestration, or active-goal runtime locking.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

