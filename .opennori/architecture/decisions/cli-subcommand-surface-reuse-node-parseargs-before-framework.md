# cli-subcommand-surface-reuse-node-parseargs-before-framework Build-vs-Buy Decision

Area: cli-subcommand-surface
Need: Keep the growing opennori command surface understandable while preserving deterministic JSON output for agents
Recommendation: reuse
Status: superseded
Superseded by: cli-command-layer-adopt-citty-for-long-term-typescript-cli
Superseded reason: The confirmed TypeScript agent state CLI baseline now chooses citty as the long-term command layer instead of treating parseArgs as sufficient for the subcommand surface.

## Summary

Historical decision retained for review: OpenNori previously kept node:util parseArgs and a small wrapper before the long-term TypeScript/citty baseline was confirmed.

## Candidates Checked

- Current project: Current project still contains the legacy src/cli.js surface, but package.json now includes citty and the confirmed baseline requires incremental TypeScript command modules.
- Standard library: node:util parseArgs remains useful for transitional token compatibility but is no longer the preferred long-term subcommand architecture.
- Official SDK: No official OpenNori SDK applies.
- Open source: citty 0.2.2 MIT is now the active baseline choice; commander and cac remain fallback candidates if citty integration is blocked.

## Self-build Reason

<none>
