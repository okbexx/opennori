# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-O-9
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-13T10:11:37.679Z

## Summary

Autogoal was implemented as packaged Skill-driven convergence into the existing Nori Contract Draft path, without adding a separate Autogoal Contract or MVP workflow.

## Fit

The change follows the confirmed TypeScript agent-state CLI baseline: package-local Codex Skills define subjective agent behavior, citty/TypeScript CLI remains the deterministic state layer, and .opennori keeps standard draft/evidence/report state.

## Implementation Focus

Teach agents to turn rough ideas into standard Nori Contract Drafts through nori-autogoal and draft --brief, render assumptions/open questions for review, and align README/site/protocol/AGENTS/test coverage.

## Evidence

npm run check passed; pnpm build passed for opennori-site; package Skills expose nori-autogoal; CLI draft --brief test verifies standard draft output.

## Limitations

This records architecture alignment for OpenNori's implementation slice; it is context for Product AC evidence and is not proof of user-visible completion by itself.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

