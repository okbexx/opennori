# cli-argument-parsing-replace-growing-ad-hoc-option-scanning-with Build-vs-Buy Decision

Area: cli-argument-parsing
Need: Replace growing ad hoc option scanning while preserving the existing opennori command surface
Recommendation: reuse
Status: superseded
Superseded by: cli-command-layer-adopt-citty-for-long-term-typescript-cli
Superseded reason: The parseArgs wrapper is now transitional compatibility work; the active long-term architecture is citty command modules in TypeScript.

## Summary

Historical decision retained for review: OpenNori previously reused node:util parseArgs for option lookup and repeated flags before confirming the TypeScript/citty baseline.

## Candidates Checked

- Current project: src/cli.js still contains compatibility helpers and tests; the migration path is to keep behavior stable while moving command definitions to citty modules.
- Standard library: node:util parseArgs handles tokens but does not define the long-term command architecture.
- Official SDK: No official OpenNori SDK applies.
- Open source: citty 0.2.2 MIT is the active baseline; commander and cac remain fallback candidates.

## Self-build Reason

<none>
