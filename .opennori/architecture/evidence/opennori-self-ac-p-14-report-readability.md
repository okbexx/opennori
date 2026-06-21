# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-P-14
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Report readability work stays inside the confirmed TypeScript agent-state CLI baseline: src/core/report.ts owns human report rendering, tests stay in reporting/domain suites, and .opennori remains the evidence source of truth.

## Fit

The change modifies only the report renderer and tests around reporting output shape; it does not change the CLI command framework, state model, plugin distribution, dashboard write boundary, or evidence ledger semantics.

## Implementation Focus

Make long AC/evidence/source/reviewability/limitations content readable by moving full details out of the Markdown status table into per-criterion detail blocks.

## Evidence

src/core/report.ts, test/reporting.test.js, npm run test:reporting, npm run test:quick

## Limitations

This architecture apply record proves baseline alignment for the report renderer change; Product AC evidence still needs report output and test verification.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.
