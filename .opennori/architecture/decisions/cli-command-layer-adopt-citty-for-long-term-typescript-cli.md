# cli-command-layer-adopt-citty-for-long-term-typescript-cli Build-vs-Buy Decision

Area: cli-command-layer
Need: Keep the growing OpenNori command surface maintainable with a TypeScript command layer
Recommendation: reuse
Status: active



## Summary

OpenNori uses citty command definitions in TypeScript modules while keeping deterministic JSON output and a thin opennori entrypoint.

## Command Boundary

Command modules are thin adapters over domain modules. New or touched command code should import narrow `core/<domain>.ts`, `lifecycle/<domain>.ts`, and `kernel/<domain>.ts` modules instead of broad `src/core.ts` or `src/lifecycle.ts` barrels. Existing wide barrels are migration compatibility surfaces, not the target architecture. Use module-boundary tests for objective import/authority regressions where a command area is easy to over-broaden; do not use those tests for subjective AC quality or agent judgment.

## Candidates Checked

- Current project: src/cli/command-tree.ts defines the citty command tree, src/cli/commands/** owns command modules, src/cli.ts is a thin entrypoint, evidence commands now demonstrate narrow domain imports, and tests cover command behavior through module calls, the real bin, and targeted module-boundary guards.
- Standard library: Node can expose process.argv but does not provide a maintainable nested command definition model for the growing CLI surface.
- Official SDK: No official OpenNori SDK applies; the relevant ecosystem choice is a mature CLI library.
- Open source: citty 0.2.2 MIT matches the confirmed baseline and is used by modern TypeScript tooling patterns; commander and cac remain fallback candidates only if concrete packaging or nested-command evidence challenges citty.

## Self-build Reason

<none>
