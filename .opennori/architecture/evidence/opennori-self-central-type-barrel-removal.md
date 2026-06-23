# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Removed the central src/types.ts barrel so OpenNori source and tests import owned domain type modules directly.

## Fit

This follows the TypeScript agent-state CLI baseline by keeping type ownership in domain modules such as types/common, types/lifecycle, mcp/types, cli/command-types, and lifecycle setup/plugin-sync types instead of a repo-wide catch-all barrel.

## Implementation Focus

Type boundary收口：删除中心类型桶，保留领域类型模块和现有 public command/resource surfaces。

## Evidence

src/types.ts removed; test/mcp.test.ts imports JsonObject and NoriResult from domain type modules; test/module-boundaries.test.js asserts the central barrel is absent; npx tsc --noEmit --pretty false; npx vitest run test/module-boundaries.test.js test/mcp.test.ts

## Limitations

This is an internal type-boundary refactor. It does not redesign all domain types or add runtime behavior.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
