# cli-command-layer-adopt-citty-for-long-term-typescript-cli Build-vs-Buy Decision

Area: cli-command-layer
Need: Move the growing OpenNori command surface from hand-routed JavaScript toward a maintainable TypeScript command layer
Recommendation: reuse
Status: active



## Summary

Adopt citty for long-term command definitions during the TypeScript migration while preserving deterministic JSON output and the current opennori command surface through incremental slices.

## Candidates Checked

- Current project: OpenNori currently has a large src/cli.js with tests covering command behavior and newly added TypeScript build gates; migration must be incremental rather than a big-bang rewrite.
- Standard library: node:util parseArgs can tokenize flags but does not provide a maintainable nested command definition model for the growing CLI surface.
- Official SDK: No official OpenNori SDK applies; the relevant ecosystem choice is a mature CLI library.
- Open source: citty 0.2.2 MIT matches the confirmed baseline and is used by modern TypeScript tooling patterns; commander/cac remain fallback candidates if packaging or compatibility evidence blocks citty.

## Self-build Reason

<none>
