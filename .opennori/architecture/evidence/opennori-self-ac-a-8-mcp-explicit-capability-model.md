# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

MCP read-only context server now exposes a typed capability model for resources, transport, state authority, tool policy, and no-write boundary.

## Fit

The change keeps MCP as an interoperability read surface over existing context, doctor, and snapshot builders while avoiding CLI write commands, activity/event writers, refreshSnapshot, and wide write-capable barrels.

## Implementation Focus

Make MCP capability boundary explicit and testable without adding MCP tools or a second state layer.

## Evidence

Focused tests verify MCP metadata, empty tools, no snapshot writes, command registry routing, and source import boundaries.

## Limitations

This does not add MCP write tools; future tools require a separate architecture challenge and dry-run/confirm design.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
