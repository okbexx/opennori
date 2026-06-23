# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Activity CLI responses will become lightweight dashboard signal acknowledgements while the full dashboard snapshot remains available as the persisted snapshot projection.

## Fit

The confirmed baseline treats activity as live dashboard projection, not Product AC evidence, report output, or context export. Returning full snapshots from every activity command blurs this boundary and can flood agent context even though the source of truth already lives in .opennori and dashboard/MCP read models.

## Implementation Focus

Refactor activity command payloads to return activity, target, snapshot_summary, and snapshot_path instead of embedding the full snapshot; add concise human output for activity commands and keep dashboard snapshot persistence unchanged.

## Evidence

Read cli activity command, human-output, dashboard tests, agent_next dashboard_activity commands, and kernel snapshot persistence. The current activity command refreshes the full snapshot and embeds it in JSON output.

## Limitations

This architecture apply covers activity command response ergonomics only. It does not change event/activity schemas, dashboard APIs, snapshot file contents, MCP resources, or Product AC evidence semantics.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
