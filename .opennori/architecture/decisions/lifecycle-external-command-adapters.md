# lifecycle-external-command-adapters Build-vs-Buy Decision

Area: lifecycle-external-command-adapters
Need: Keep OpenNori setup and plugin-sync lifecycle orchestration from owning Codex CLI and npm stdout parsing while preserving preview/confirm safety.
Recommendation: self-build
Status: active

## Summary

Use narrow OpenNori lifecycle adapters for Codex Plugin and npm-global probes; setup and plugin-sync consume probe results and remain plan orchestration layers.

## Candidates Checked

- Current project: OpenNori already has lifecycle/external-actions for command execution, setup/plugin-sync plan builders, mock command runners in tests, and package/plugin state helpers. The missing boundary was stdout parsing living inside setup.ts and plugin-sync.ts.
- Standard library: Node child_process stays behind ExternalCommandRunner and path.resolve is sufficient for local marketplace path comparison. JSON.parse is enough for npm ls --json because npm already produces structured package data.
- Official SDK: Codex Plugin and npm operations remain delegated to their official CLIs. There is no stable in-process Codex Plugin SDK or npm global package inspection SDK in this project boundary.
- Open source: Shell parser libraries or process managers would not replace the product-specific probes. execa/cross-spawn could improve process ergonomics later, but the current code already has a small runner facade and tests only need deterministic stdout fixtures.

## Self-build Reason

The self-built code is intentionally limited to adapter glue around known official CLI outputs and npm JSON output. It does not implement package management, plugin installation, command routing, retry, shell parsing, or state authority.
