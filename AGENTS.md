# OpenNori Maintainer Instructions

OpenNori is a repo-native Plan/Implement/Verify/Finish workflow for coding
agents. Its differentiator is outcome-driven completion.

## Hard Boundaries

- Do not use OpenNori to manage OpenNori source development. This repository
  must not track `.opennori/`; validate the product in a temporary repository.
- The normal user path is exactly:

  ```bash
  npx opennori setup
  opennori init --user <name>
  ```

  followed by a new Codex conversation: `Use OpenNori for this goal: <goal>`.
- Host setup and project initialization are separate. Do not fold global npm
  installation or Plugin repair into `init`; do not add manual Skill copying,
  bootstrap, or project-local Skill synchronization as parallel onboarding
  routes.
- `task.json` is the only task lifecycle authority. Plan/Implement/Verify/Finish
  is derived from task status; never add a second phase store.
- `contract.json` is the only approved Outcome authority.
  `evidence.jsonl` is append-only fact input. Outcome status, current gap, and
  completion are derived projections.
- `delivery.json` records the planned and objectively verified Git delivery. It
  never becomes a second lifecycle or Outcome authority.
- Markdown is for human review. Never parse generated `contract.md` or reports
  back into canonical state.
- Skills own agent workflow and subjective Outcome quality. The CLI owns
  deterministic state transitions and objective validation. Neither surface
  takes human approval for itself.
- Do not reintroduce removed compatibility routes, stale copy, schemas, or
  fallback state into the foundation.
- Codex is the primary foundation adapter and Claude Code is the bounded second
  adapter. Do not add more platform adapters without an explicit user need.

## Workflow Contract

- **Plan** inspects specs, workspace memory, and relevant code; asks one
  completion-changing question at a time; creates the task; curates separate
  implement/check context; plans commit, pull request, or explicit waiver
  delivery; and obtains explicit Contract approval.
- **Implement** requires an approved Contract, reads curated implementation
  context, changes the project, and does not claim completion.
- **Verify** independently reads check context, inspects the actual diff, runs
  project and user-visible checks, appends Evidence per Outcome, then records the
  verified implementation commit or pull request.
- **Finish** refuses incomplete evidence, promotes stable learning to specs,
  marks the task complete, archives it with the only developer journal entry, and
  refuses a user completion claim until the clean final Git checkpoint is
  verified.

Implementation details may change without adding product concepts outside this
contract.

## State Layout

- `.opennori/config.yaml`: developer, platform, and package roots.
- `.opennori/workflow.md`: generated canonical workflow protocol.
- `.opennori/manifest.json`: managed asset ownership and hashes.
- `.opennori/spec/`: stable project knowledge.
- `.opennori/tasks/<id>/`: task, Contract, delivery, context, evidence, and research.
- `.opennori/workspace/<developer>/`: durable developer journal.
- `.opennori/.runtime/`: ignored host-local session pointers.

Project content is not upgrade-owned. Managed lifecycle code must preserve
user-modified assets, reject unsafe paths, preview destructive changes, and
leave task/spec/workspace content intact on uninstall.
State migrations must be previewable, forward-only, rollback-safe, and covered
from every supported previous state schema.

## Authority Map

- `skills/nori/SKILL.md`: root state router only.
- `skills/nori-plan/SKILL.md`: Plan protocol.
- `skills/nori-implement/SKILL.md`: Implement protocol.
- `skills/nori-check/SKILL.md`: Verify protocol.
- `skills/nori-finish/SKILL.md`: Finish protocol.
- `skills/nori-update-spec/SKILL.md`: knowledge promotion.
- `skills/nori-project-health/SKILL.md`: init/update/doctor/uninstall.
- `.codex-plugin/plugin.json`: discoverability and product summary.
- `README.md`, `README.zh-CN.md`, `docs/product-reference.md`: user and operator documentation.
- `templates/`: generated workflow/platform assets; never duplicate canonical
  workflow rules in ad hoc source strings.

When workflow behavior changes, update the affected packaged Skills, their
frontmatter descriptions, Plugin metadata, generated templates, and user docs
in the same change.

## Engineering Rules

- Follow SOLID principles, but do not create an abstraction before a second
  implementation or meaningful duplication exists.
- Do not hand-write infrastructure. Use Citty for CLI routing, Ajv for JSON
  Schema validation, YAML for config, and Node standard library primitives for
  bounded filesystem, hashing, and JSONL operations.
- Keep platform differences outside the task/Contract/evidence core.
- Prefer deletion over compatibility shims during the foundation rewrite.
- Keep code, docstrings, errors, and recovery actions self-explanatory.
- For visible features, CLI human output, onboarding, README, or Skill/Plugin
  behavior, use `real-user-feature-development` before implementation.
- For infrastructure or build-vs-buy decisions, use
  `reference-first-architecture` and record evidence before custom work.

## Verification

Use the smallest complete verification:

```bash
npm run check
```

Then exercise the real path in a temporary Git repository: init, Plan,
Contract approval, Implement, Verify, blocked Finish without Evidence, proven
Evidence, blocked Finish without delivery, implementation commit or pull
request, spec promotion, journal update, archive, clean final checkpoint,
state migration, managed update conflict, and doctor recovery.
