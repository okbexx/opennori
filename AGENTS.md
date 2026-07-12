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

  followed by a new agent conversation where the user describes the goal
  normally. OpenNori is available automatically and must obtain explicit user
  consent before creating a task.
- Host setup and project initialization are separate. Do not fold global npm
  installation or Plugin repair into `init`; do not add manual Skill copying,
  bootstrap, or project-local Skill synchronization as parallel onboarding
  routes.
- Add a second supported host with preview-first `opennori platform add`; do not
  rerun `init`, replace the existing adapter, or edit configured platforms by
  hand.
- `task.json` is the only task lifecycle authority. Plan/Implement/Verify/Finish
  is derived from task status; never add a second phase store.
- `contract.json` is the only approved Outcome authority.
  `evidence.jsonl` is append-only fact input. Outcome status, current gap, and
  completion are derived projections.
- `delivery.json` records the planned and objectively verified Git delivery. It
  never becomes a second lifecycle or Outcome authority.
- `contract.md` is the complete human approval surface. `design.md` and
  `plan.md` are optional agent-authored working documents; `report.md` is the
  human completion record. Never parse those Markdown files back into
  canonical state or make their presence a lifecycle gate.
- Skills own agent workflow and subjective Outcome quality. The CLI owns
  deterministic state transitions and objective validation. Neither surface
  takes human approval for itself.
- Context manifests are optional bounded loading hints. Missing, empty, stale,
  or changed context must not block Start or hide canonical Hook state.
- Host-native execution remains owned by the host. OpenNori persists only its
  own task state and CLI-validated Evidence.
- Do not reintroduce removed compatibility routes, stale copy, schemas, or
  fallback state into the foundation.
- Codex is the primary foundation adapter and Claude Code is the bounded second
  adapter. Do not add more platform adapters without an explicit user need.

## Workflow Contract

- **Before Plan** classifies a request when no task is selected and obtains
  explicit task-creation consent. A refusal skips small-task workflow for that
  session and never creates persistent skip state.
- **Plan** inspects specs, workspace memory, and relevant code; asks one
  completion-changing question at a time; creates the task after consent;
  creates optional `design.md`, `plan.md`, or bounded context only when useful;
  makes the complete `contract.md` directly openable for explicit approval;
  then separately plans commit, pull request, or explicit waiver delivery.
- **Implement** requires an approved Contract, reads available human documents
  and optional implementation context, keeps `plan.md` current when present,
  changes the project, and does not claim completion.
- **Verify** starts from the complete Contract and actual diff, uses optional
  check context when useful, runs project and user-visible checks, appends
  Evidence per Outcome, then records the verified implementation commit or pull
  request. A fresh host reviewer is preferred, not a completion authority.
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
- `.opennori/tasks/<id>/`: Task state, Contract, optional design/plan/context,
  Evidence, delivery, research, and report.
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
- `skills/nori-project-health/SKILL.md`: init/platform add/update/doctor/uninstall.
- `.codex-plugin/plugin.json`: discoverability and product summary.
- `.claude-plugin/plugin.json`: Claude Code Plugin package and host Hook entry.
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
- Constrain objective facts and irreversible transitions in code; keep planning,
  design, context selection, reviewer strategy, and knowledge quality in Skills
  and human-readable documents.
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
complete Contract review and approval, Implement with and without optional
context, Hook recovery from stale context, Verify with reviewer and sequential
fallback, blocked Finish without Evidence, proven Evidence, blocked Finish
without delivery, implementation commit or pull request, spec promotion,
journal update, archive, clean final checkpoint, state migration, managed
update conflict, and Doctor recovery including Contract Markdown parity.
