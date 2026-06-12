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
- Preview safe existing-project refresh: `opennori install --root <repo> --skill --refresh-skill --merge-agent-route --dry-run --json`.
- Confirm safe existing-project refresh after user approval: `opennori install --root <repo> --skill --refresh-skill --merge-agent-route --confirm --json`.
- Preview manifest/protocol upgrade when entry assets are stale: `opennori upgrade --root <repo> --skill --merge-agent-route --dry-run --json`.
- Confirm manifest/protocol upgrade after user approval: `opennori upgrade --root <repo> --skill --merge-agent-route --confirm --json`.
- Preview destructive overwrite only when safe refresh is not enough: `opennori install --root <repo> --skill --force --dry-run --json`.
- Confirm destructive overwrite only after explicit user approval: `opennori install --root <repo> --skill --force --confirm --json`.
- Doctor: `opennori doctor --root <repo> --json`.
- Existing contract check after upgrade: `opennori check --root <repo> --json`.
- Preview uninstall: `opennori uninstall --root <repo> --dry-run --json`.
- Remove entry assets while preserving state: `opennori uninstall --root <repo> --confirm --json`.
- Remove all OpenNori state only after explicit user acceptance: `opennori uninstall --root <repo> --include-state --confirm --json`.

## Rules
Always show dry-run plans before destructive writes.
Use `--refresh-skill --merge-agent-route` for existing projects that need current OpenNori Skills or Architecture Baseline routes without overwriting project guidance.
Default uninstall preserves active goals, evidence, reports, archives, brainstorms, and architecture state.
Doctor output includes Architecture Baseline health and agent-readable surface checks.
`opennori check` output includes `acceptance_quality`, `architecture_check`, and `evidence_health`; resolve architecture warnings and review evidence-health findings before treating a goal as confidently complete.
Upgrade must preserve existing active contracts, evidence, and architecture baselines. After upgrade, run `opennori check` and route `acceptance_quality` warnings to `nori-acceptance`, `architecture_check` warnings to the architecture Skills, and `evidence_health` findings to `nori-evidence` for user-approved revision.
