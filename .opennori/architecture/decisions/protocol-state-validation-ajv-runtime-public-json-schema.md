# protocol-state-validation-ajv-runtime-public-json-schema Build-vs-Buy Decision

Area: protocol-state-validation
Need: Validate OpenNori persisted state with public JSON Schema and runtime Ajv checks
Recommendation: reuse
Status: active



## Summary

Use package-local schemas/*.schema.json as public protocol structure and Ajv 2020 runtime validation for manifest, active evidence payloads, Architecture Baseline, and build-vs-buy decisions; keep OpenNori semantic rules in domain validators.

## Candidates Checked

- Current project: OpenNori already writes JSON state under .opennori and has validateContract, architecture health, doctor, and build-vs-buy semantic checks; this slice adds structural validation without replacing those domain rules.
- Standard library: JSON.parse validates syntax only and cannot express required object shape, enum values, or array item structure.
- Official SDK: No official OpenNori SDK exists; JSON Schema is the relevant open standard for shareable protocol structure.
- Open source: Ajv is already selected in package.json and supports JSON Schema 2020-12; Zod/Valibot remain alternatives for TypeScript-first authoring but are not the public protocol format.

## Self-build Reason

<none>
