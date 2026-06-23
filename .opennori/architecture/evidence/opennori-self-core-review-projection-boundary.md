# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-8
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-23T06:28:29.131Z

## Summary

Report rendering and lifecycle status should consume the same core review projection instead of each path recomputing current gap, completion, evidence health, profile compliance, intervention, and recommendation.

## Fit

The TypeScript agent-state CLI baseline supports a lower-level core read model because it derives deterministic state from contract, ledger, Project Profile, and ArchitectureState without writing .opennori and without importing lifecycle or kernel.

## Implementation Focus

Introduce a core review projection for outcome calculations, route goalReviewState and report rendering through it, and keep agent_next as lifecycle-only routing metadata.

## Evidence

src/core/report-render.ts currently recomputes the same outcome fields as src/lifecycle/goal-review-state.ts. Directly importing lifecycle into core would invert module boundaries, so the projection must live below both.

## Limitations

This is a read-model refactor only; it does not change report Markdown schema, context export payload names, dashboard UI, or subjective acceptance-quality behavior.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
