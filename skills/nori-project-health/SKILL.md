---
name: nori-project-health
description: Initialize, diagnose, update, or uninstall OpenNori project assets. Use whenever OpenNori is missing, init is requested, doctor reports broken or stale state, managed files conflict, a registered agent adapter is unavailable, or the user asks to update or remove OpenNori. Keep lifecycle actions preview-first, preserve user project content, and return the user to a new agent conversation after successful initialization.
---

# OpenNori Project Health

Maintain the repo-native workflow and registered agent adapter without taking over task
or project content.

## Initialize

On a machine without OpenNori, run setup once. Then initialize each project
with the persistent CLI:

```bash
npx opennori setup
opennori init --user <name>
```

Initialization must:

- run from the intended project root
- check that machine-level setup is ready before project writes
- stop with a setup recovery action when the persistent CLI or configured agent
  platform is unavailable
- preview destructive or conflicting actions
- create the canonical workflow, specs, workspace, task root, manifest, and the
  configured platform route
- record only assets OpenNori actually writes
- leave the project ready for a new conversation in the configured agent host

Codex requires trust review for new or changed command hooks. Tell the user to
inspect and approve the bundled hooks with `/hooks` when prompted. Declining
trust leaves the CLI workflow available but disables automatic turn context and
worker observations; do not add a parallel project-local bootstrap route.

Host CLI installation, marketplace registration, and Plugin installation or
enablement belong only to `npx opennori setup`. Project initialization must not
perform those machine-level actions.

Codex is the default. For Claude Code, use the explicit platform on both host
setup and project initialization:

```bash
npx opennori setup --platform claude
opennori init --user <name> --platform claude
```

Claude project Skills are lifecycle-owned adapter assets; do not copy or
synchronize them manually.

After success, tell the user to open a new conversation in the configured agent
host and say:

```text
Use OpenNori for this goal: <goal>
```

Do not start a task as a hidden side effect of initialization.

## Diagnose

Run `opennori doctor --json` before recovery. Report the smallest actionable
problem:

- missing initialization
- invalid config or canonical state
- an older state schema that needs a reviewed migration
- missing, unsafe, or aliased registered package directories
- missing or modified managed asset
- unavailable configured agent CLI
- for Codex, a missing, conflicting, disabled, or wrong-version Plugin
- unsupported or unavailable configured project adapter
- unsafe path or ownership conflict

Do not present unrelated internal health catalogs. Health is project workflow,
state, ownership, and platform readiness only.

## Update

Use preview then confirmation:

```bash
opennori update --dry-run
opennori update --confirm
```

Preserve user-modified managed files and report conflicts. Never overwrite
specs, tasks, Contracts, evidence, research, or workspace journals as generated
assets.

The same update preview includes state migrations. Before confirmation, name the
source and target schema versions and affected task count. Migration validates
all canonical inputs first, updates the manifest last, and restores original
bytes and file modes on failure. After confirmation, rerun Doctor. Do not bypass
a migration by editing `state_schema_version` or task JSON manually.

When doctor reports a missing or unreadable ownership manifest, use the
dedicated repair path instead of init or an ordinary update:

```bash
opennori update --repair-manifest --dry-run
opennori update --repair-manifest --confirm
```

Repair may adopt only hash-proven generated assets. Review preserved and
unowned paths before confirmation.

## Uninstall

Use preview then confirmation:

```bash
opennori uninstall --dry-run
opennori uninstall --confirm
```

Remove only safely owned generated workflow/platform assets. Preserve project
content by default and name what remains. Never delete an ownership-unclear
file merely because it is under `.opennori/`.

Project uninstall does not remove the user-level OpenNori Plugin or marketplace;
another repository may still use them. It never modifies unrelated marketplace
or Plugin entries.

To reactivate preserved project content after uninstall, reconstruct only
hash-proven ownership, then restore managed assets through a reviewed update:

```bash
opennori update --repair-manifest --dry-run
opennori update --repair-manifest --confirm
opennori update --confirm
```

## Source Checkout Guard

When the current repository is the OpenNori source checkout itself, do not
initialize it or create tracked `.opennori/` state. Use product build checks and
a temporary repository for lifecycle verification.
