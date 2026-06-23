# domain-type-boundaries-use-typescript-modules Build-vs-Buy Decision

Area: domain-type-boundaries
Need: Reduce central lifecycle/public type barrels without introducing a second schema registry or generated type pipeline.
Recommendation: self-build
Status: active



## Summary

OpenNori uses first-party TypeScript domain type modules for protocol/lifecycle/MCP/profile/context-export boundaries, while compatibility barrels remain re-export-only and internal imports are guarded by module-boundary tests.

## Candidates Checked

- Current project: OpenNori already has TypeScript source modules, strict typecheck, public JSON Schemas for persisted protocol validation, and module-boundary tests. The immediate risk was central type barrels such as src/types/lifecycle.ts becoming authority magnets for unrelated lifecycle domains.
- Standard library: TypeScript type-only exports/re-exports and NodeNext module resolution are sufficient for compile-time type boundaries; Node standard library has no runtime role here.
- Official SDK: No official SDK is needed for OpenNori's internal TypeScript type boundaries. Public protocol compatibility is handled by package schemas and CLI JSON outputs rather than an external type registry.
- Open source: Schema generators such as TypeBox, Zod-to-JSON-Schema, ts-json-schema-generator, or OpenAPI tooling are useful when OpenNori needs generated public protocol clients, but they would add a second authoring pipeline for this internal refactor. Ajv remains the selected runtime validator for public JSON schema surfaces.

## Self-build Reason

Self-build is limited to hand-authored TypeScript domain type modules and objective module-boundary tests. This does not implement validation, schema generation, client SDK generation, or protocol negotiation; those remain covered by existing JSON Schema/Ajv decisions or future build-vs-buy work.
