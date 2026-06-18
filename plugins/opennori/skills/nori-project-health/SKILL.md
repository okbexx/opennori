---
name: nori-project-health
description: "Diagnose, initialize, upgrade, uninstall, and recover the complete OpenNori capability bundle: Plugin discovery, packaged Skill health, opennori CLI access, project-local .opennori state, manifest, and current-goal integrity. Use when the user asks whether OpenNori is ready, wants setup, sees broken `.opennori` state, or needs safe lifecycle actions with preview and explicit confirmation."
---

## Mission

Keep OpenNori project state usable and recoverable without making lifecycle commands the user's workflow.

Health work protects `.opennori/` integrity, manifest freshness, packaged Plugin Skill visibility, and current-goal recoverability. It should not decide subjective product acceptance.

Treat OpenNori readiness as bundle readiness. Plugin discovery, packaged Skills, CLI access, and `.opennori` state are coupled product parts; if one is missing, recover it instead of telling the user to use the remaining pieces as a separate workflow.

When CLI JSON includes `data.agent_next`, use it as the state-layer routing instruction. Health work should not guess whether to draft, recover, or resume when `agent_next.state` already says `initialized_no_active_contract`, `health_needs_recovery`, `setup_preview_needs_confirmation`, or `ready_with_current_goal`.

If `agent_next.safe_next_command` is present, the agent may run that preview command before asking the user for confirmation. Use it to turn a noisy doctor result into a concrete preview such as project initialization. Never ask the user to choose from raw recovery actions when a safe preview command is available.

A fresh `opennori init` normally creates empty `.opennori/current`, `.opennori/drafts`, `.opennori/reports`, `.opennori/brainstorms`, and architecture subdirectories. Empty directories are not broken state; they mean no current Nori Contract has been approved yet. Route `initialized_no_active_contract` to `nori-acceptance` instead of trying to repair files.

## Start Here

1. Run `opennori doctor --root <repo> --json` when the project may already use OpenNori.
2. Run `opennori init --root <repo> --json` when the machine already has OpenNori and only project `.opennori` state is missing.
3. Run `npx opennori setup` for first-time machine setup, missing global CLI, missing Codex Plugin discovery, missing packaged Skills, or unclear bundle readiness.
4. Run `opennori plugin sync --json` when the installed Codex Plugin cache is stale but project `.opennori` state should not be touched; use `--local` only for source-checkout development.
5. If doctor/setup/init reports missing Plugin assets, packaged Skills, CLI access, manifest, damaged current state, or legacy `.opennori/active` state, present the missing bundle part and the recovery action. When safe_next_command exists, run that preview first.
6. If doctor/setup/init reports `agent_next.state: initialized_no_active_contract`, explain that the project is ready but has no approved current contract, then hand off to `nori-acceptance`.
7. For lifecycle writes, show preview first and ask for explicit confirmation when the action writes, overwrites, upgrades, uninstalls, syncs plugin cache, or deletes state.
8. After upgrade or repair, run `opennori check --root <repo> --json` and route soft review findings to the relevant Skill.
9. If a dashboard is being watched or `agent_next.dashboard_activity` is present and a current goal/gap exists, publish live health activity while diagnosing or recovering bundle readiness for that current state: start before health work, heartbeat only during longer work, and finish when the turn ends. Prefer the returned command template; otherwise use `opennori activity start --root <repo> --skill nori-project-health --state working --summary "..." --json`. Do not invent activity for setup/init preview, no-current-goal state, or drafts.

Useful state commands:

- `npx opennori setup`
- `npx opennori setup --confirm`
- `opennori plugin sync --json`
- `opennori plugin sync --confirm --json`
- `opennori plugin sync --local --confirm --json`
- `opennori init --root <repo> --json`
- `opennori init --root <repo> --confirm --json`
- `opennori install --root <repo> --dry-run --json`
- `opennori install --root <repo> --confirm --json`
- `opennori upgrade --root <repo> --dry-run --json`
- `opennori upgrade --root <repo> --confirm --json`
- `opennori uninstall --root <repo> --dry-run --json`
- `opennori uninstall --root <repo> --confirm --json`
- `opennori uninstall --root <repo> --include-state --confirm --json`
- `opennori doctor --root <repo> --json`
- `opennori check --root <repo> --json`
- `opennori activity start|heartbeat|finish --root <repo> --skill nori-project-health --state working --summary "..." --json` (required dashboard signal when the dashboard is observed and a current goal/gap exists; do not bind setup/init previews or drafts)

## Natural-Language Mapping

- "Install OpenNori" or "set up OpenNori on this machine" -> setup preview, then confirm only after the user approves.
- "Sync the local OpenNori plugin", "Codex Plugin cache is stale", or "local plugin should be latest" -> `opennori plugin sync --json`, then confirm only after the user approves. Use `--local` only when syncing from the current source checkout.
- "Initialize OpenNori in this project" -> init preview, then confirm only after the user approves.
- "Is OpenNori healthy" -> doctor and summarize ready, needs-action, or broken with recovery actions.
- "The CLI works but Plugin/Skills are missing" or "Plugin is installed but .opennori is missing" -> diagnose bundle readiness and recover the missing part instead of treating the remainder as a separate user path.
- "I ran init and .opennori directories are empty" -> explain that this is normal until a draft is approved as the current Nori Contract; route to acceptance discovery.
- "Upgrade this project" -> upgrade dry run, confirm if approved, then check.
- "Remove OpenNori" -> uninstall dry run; preserve `.opennori` state unless the user explicitly asks to delete it.
- "State is broken" -> doctor, identify hard integrity failures, and propose recovery actions.
- "Doctor shows review risks" -> route acceptance, evidence, profile, architecture, or build-vs-buy review to the responsible Skill.

## State Writes

May write manifest, protocol, agent guide, lifecycle-managed `.opennori/` assets, and uninstall removals after confirmation. It may not silently rewrite current Product AC, evidence, profile, architecture decisions, or reports as a side effect of health checks.

Must write live dashboard activity for health diagnosis or recovery when the dashboard is observed and a current goal/gap exists. Activity is not lifecycle confirmation, not recovery evidence, and not Product AC evidence. Do not ask the user to confirm setup, init, upgrade, uninstall, waiver, or recovery actions inside the dashboard; show the preview in conversation and record explicit approval through the CLI path.

## Handoffs

- `acceptance_review` -> `nori-acceptance`.
- `evidence_health` -> `nori-evidence`.
- `profile_review` -> `nori-capability-profile`.
- `architecture_check` or stale baseline surface -> `nori-architecture-brainstorm`, `nori-architecture-apply`, or `nori-architecture-challenge`.
- `build_vs_buy` findings -> `nori-build-vs-buy`.
- Healthy status or user-facing summary -> `nori-reporting`.

## User Reply Shape

For health responses, use:

```text
Status: ready / needs-action / broken
Problem: ...
Recovery: ...
Writes needed: none / previewed / needs confirmation
Next: ...
```

For previews, list create/skip/update/overwrite/remove and whether the action is destructive.

Do not paste raw doctor/setup/init JSON to the user. Compress it into a short human summary:

```text
Status: ...
Problem: ...
Preview: create/update/skip/remove counts, destructive yes/no
Writes needed: none / needs confirmation
Next: ...
```

For a fresh project, the ideal response is:

```text
This project has not been initialized for OpenNori yet.
Preview: OpenNori will create .opennori state for contracts, evidence, reports, brainstorms, and architecture. No existing files will be overwritten, and there are no destructive actions.
Confirm initialization?
```

## Misuse Guards

- Do not copy OpenNori Skills into the user project; packaged Plugin Skills are the agent discovery surface.
- Do not present Plugin, Skills, CLI, or `.opennori` state as separate install choices; recover bundle readiness.
- Do not continue in a half-installed state without surfacing the missing bundle part and a recovery action.
- Do not treat empty `.opennori/current` or `.opennori/drafts` as broken after fresh init; no current contract is an acceptance-start state, not a repair state.
- Do not perform destructive lifecycle writes without preview and explicit confirmation.
- Do not show repeated recovery_actions or full JSON unless the user explicitly asks for diagnostic detail.
- Do not treat soft review findings as hard protocol rejection.
- Do not reopen Product AC just because architecture, build-vs-buy, evidence health, or profile review needs user attention.
- Do not use health commands as a substitute for acceptance evidence.
- Do not treat dashboard activity, events, or snapshots as proof that the bundle is healthy.
