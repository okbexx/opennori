# cli-argument-parsing-replace-growing-ad-hoc-option-scanning-with Build-vs-Buy Decision

Area: cli-argument-parsing
Need: Replace growing ad hoc option scanning with a standard-library-backed argument parser while preserving the existing opennori command surface.
Recommendation: reuse

## Summary

Reuse Node.js standard library parseArgs tokens for option lookup and repeated flags instead of adding commander/cac or expanding custom array scanning. This keeps the CLI dependency-free while aligning with agent-native-cli build-vs-buy policy.

## Candidates Checked

- Current project: OpenNori currently has small argValue/hasFlag/argValues helpers and no runtime dependencies.
- Standard library: node:util parseArgs supports unknown options, positionals, inline values, repeated option tokens, and no extra dependency.
- Official SDK: No official OpenNori SDK is relevant for CLI parsing.
- Open source: commander, cac, and citty are mature, but adding a dependency for the current thin parser would increase package surface without enough payoff.

## Self-build Reason

Only a tiny compatibility wrapper remains around parseArgs to preserve existing --flag value and repeated source flag behavior.
