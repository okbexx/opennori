---
name: nori-project-health
description: Install, uninstall, diagnose, and recover project-local OpenNori assets, manifest, and Skill Pack sync.
---

## When to use
Use when the user asks to install OpenNori, uninstall OpenNori, check whether OpenNori is ready, diagnose broken OpenNori state, inspect manifest, or sync project Skills.

## Commands
- Short readiness / first-time preview: `opennori bootstrap --root <repo> --json`.
- Confirm first-time setup after user approval: `opennori bootstrap --root <repo> --confirm --json`.
- Preview install: `opennori install --root <repo> --dry-run --json`.
- Install Skill Pack: `opennori install --root <repo> --skill --json`.
- Preview upgrade: `opennori upgrade --root <repo> --skill --dry-run --json`.
- Confirm upgrade after user approval: `opennori upgrade --root <repo> --skill --confirm --json`.
- Preview destructive install: `opennori install --root <repo> --skill --force --dry-run --json`.
- Confirm destructive install: `opennori install --root <repo> --skill --force --confirm --json`.
- Doctor: `opennori doctor --root <repo> --json`.
- Existing contract check after upgrade: `opennori check --root <repo> --json`.
- Preview uninstall: `opennori uninstall --root <repo> --dry-run --json`.
- Remove entry assets while preserving state: `opennori uninstall --root <repo> --confirm --json`.
- Remove all OpenNori state only after explicit user acceptance: `opennori uninstall --root <repo> --include-state --confirm --json`.

## Rules
Always show dry-run plans before destructive writes.
Default uninstall preserves active goals, evidence, reports, archives, and brainstorms.
Upgrade must preserve existing active contracts and evidence. After upgrade, run `opennori check` and route any `acceptance_quality` warnings to `nori-acceptance` for user-approved revision.
