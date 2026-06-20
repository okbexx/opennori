# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-3
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Architecture profile import keeps managed project profiles under architecture/profiles and reserves architecture/evidence for architecture apply records.

## Fit

This preserves the confirmed OpenNori state model: profiles define reusable architecture inputs, while architecture evidence contains only apply records that document baseline alignment for an acceptance gap.

## Implementation Focus

Validate architecture evidence directory shape and prevent profile import from creating duplicate evidence/profile artifacts.

## Evidence

npm run check; test/cli-commands.test.js; test/core.test.js; doctor against /Users/jarl/code/jarlone/agent-workbench with misplaced profile JSON

## Limitations

This guards objective artifact boundaries; the quality of any Architecture Profile still remains an agent/user review decision.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

