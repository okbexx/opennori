# OpenNori Testing Strategy

OpenNori tests must protect the deterministic protocol layer without turning agent judgment into brittle code.

## What Tests Own

Automated tests cover objective behavior:

- CLI command dispatch, human/JSON output shape, and side-effect boundaries.
- `.opennori` file layout, manifest, install, upgrade, uninstall, and doctor recovery semantics.
- Contract and evidence ledger consistency: ids, statuses, approval gates, stale evidence pruning, and archive movement.
- Public schema validation for persisted JSON state.
- Report, status, check, context export, and dashboard projection output shapes.
- Architecture requirement, baseline, apply records, challenges, and build-vs-buy state health.
- Packaged Skill asset structure: plugin manifest, expected Skill directories, frontmatter, required protocol sections, and absence of deprecated install/copy routes.
- Packaged Skill discovery metadata: frontmatter descriptions should expose the major user routing surfaces before Codex loads full Skill bodies, while avoiding tests that prove subjective judgment by matching long body word lists.

## What Tests Must Not Own

Automated tests must not pretend to prove subjective agent ability:

- Whether a natural-language AC is "good enough".
- Whether a UI/CRUD/dashboard goal has been fully discovered.
- Whether Enhanced Discovery or AC Review Loop improved the user's judgment in a real conversation.
- Whether a specific prompt must produce an exact wording, gap id, checklist, or question.
- Whether a particular word list appears inside every Skill body.
- Whether a Skill description's presence of a trigger category proves the agent will make the right subjective decision in a real conversation.

Those belong to packaged Skill behavior, user review, dogfood, and eval prompts. Code can expose review surfaces and store state; it should not become a hidden product manager.

Use `docs/skill-evals.md` for human-review dogfood scenarios when changing
packaged Skills. The scenarios are review prompts and rubrics, not fixtures for
automated exact-output tests.

## Test Layers

- `test/core.test.js`: narrow core invariants and command-layer smoke.
- `test/acceptance.test.js`: draft, approve, language, criterion add/update, brainstorm, discovery, and approval gates.
- `test/evidence.test.js`: evidence recording, pruning, concurrency, source flexibility, and evidence health.
- `test/reporting.test.js`: status/report/context/export/list/archive/readability behavior.
- `test/profile.test.js`: Nori Profile state and compliance evidence.
- `test/lifecycle.test.js`: package bin, setup/init/install/upgrade/uninstall/doctor.
- `test/architecture.test.js`: Architecture Requirement, Baseline, Challenge, apply records, project profiles, and build-vs-buy.
- `test/docs-schema.test.js`: public schemas and objective docs/Skill asset structure.
- `test/cli-*.test.js`: focused command-module integration tests grouped by command domain.
- `test/dashboard-selection.test.ts`: dashboard selection model.

Use Vitest tags to run focused checks. New tests should join an existing layer and tag instead of expanding `core.test.js`.
