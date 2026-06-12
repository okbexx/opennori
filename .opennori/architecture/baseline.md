# OpenNori Architecture Baseline

Status: active
Profile: agent-native-cli
Sticky: yes
Requires challenge to change: yes

## Goal

让 OpenNori 以 agent-native-cli Architecture Baseline 完成 Architecture Baseline Loop 产品化能力和后续架构修复

## Summary

Use a thin deterministic CLI, domain-first modules, schema-backed project state, manifest-managed lifecycle actions, agent-readable Skills, and build-vs-buy checks before custom infrastructure.

## Principles

- thin-cli-entry
- domain-first-modules
- schema-backed-opennori-state
- manifest-managed-install-upgrade-uninstall
- skill-driven-natural-language-usage
- agent-readable-baseline-surface
- build-vs-buy-before-custom-infrastructure

## Architecture Checks

- ARCH-1 (maintainer): Opening the CLI entry should make it clear that command parsing, dispatch, and output are separate from domain decisions.
- ARCH-2 (maintainer): Changing Product AC discovery should not require editing installer, Skill Pack, manifest, or report rendering logic.
- ARCH-3 (maintainer): Install, upgrade, uninstall, managed files, and doctor recovery are lifecycle concerns with dry-run preview and explicit confirmation boundaries.
- ARCH-4 (agent): Before custom infrastructure work, check current project dependencies, standard libraries, official SDKs, mature open-source libraries, and documented reference projects.
- ARCH-5 (agent): Do not replace this baseline silently. Raise an Architecture Challenge when project evidence conflicts with it.

## Build-vs-Buy Policy

1. current-project-dependency
2. standard-library
3. official-sdk
4. mature-open-source-library
5. small-local-implementation

## Prefer

- cli: Prefer a mature CLI parser or current project convention over growing custom argument parsing.
- schema: Prefer schema validation libraries or JSON Schema over long-term handwritten schema validation.
- markdown: Prefer established markdown/frontmatter libraries when parsing becomes non-trivial; keep OpenNori-specific rendering local when it is product domain logic.

## Avoid

- process/ as OpenNori's workflow mainline
- phase/task-list state as product completion state
- agent self-summary as the only high-risk completion evidence
- silent architecture replacement
- custom infrastructure without build-vs-buy evidence

## Agent Rule

Before implementing a non-trivial acceptance gap, read this baseline and keep the implementation aligned with it.
If project evidence conflicts with this baseline, create an Architecture Challenge instead of silently replacing it.
