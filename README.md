# OpenNori

Human-acceptable delivery contracts for coding agents.

[![npm version](https://img.shields.io/npm/v/opennori.svg)](https://www.npmjs.com/package/opennori)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)

OpenNori helps coding agents deliver results that humans can actually accept and maintain. You
describe a goal and constraints in natural language. Nori turns that into a Nori Contract:
human-centered acceptance checks, Architecture Baseline, evidence, and a completion report.

The agent can still plan internally. OpenNori treats progress as proven only when the user's
acceptance checks have reviewable evidence.

## Why OpenNori Exists

AI agents often do a lot of work while leaving the user unsure whether the original goal is done.
OpenNori keeps the conversation centered on:

- what the user wants to achieve
- what architecture the agent should follow while achieving it
- what the user can open, run, see, or judge
- what evidence supports each acceptance check
- what is still blocked or missing
- whether the goal is complete

OpenNori is not a phase system, task planner, or process archive. It borrows productization ideas
from mature agent workflow kits, but the main storyline stays acceptance, evidence, and completion
judgment. For non-trivial work, OpenNori also keeps a sticky Architecture Baseline so agents do
not silently drift into short-term, hard-to-maintain implementations.

## Install

Choose one entry path.

### Try without installing

```bash
npx opennori
```

### Install globally

Use this if you want to type `opennori` directly in any project:

```bash
npm install -g opennori
opennori
```

### Pin OpenNori to a project

Use this when a repository should control the OpenNori version:

```bash
npm install -D opennori
npx opennori
```

After a project install, `npx opennori` runs the local project version from `node_modules/.bin`.

## Quick Start

Run OpenNori in a project:

```bash
npx opennori
```

OpenNori shows a short project setup preview and asks before writing `.opennori/`. The OpenNori
Skill Pack is installed or refreshed only when requested and confirmed. Agents and CI can add
`--json` for the deterministic machine-readable protocol.

Then talk to your agent:

```text
Use OpenNori for this project. Start from my goal, define a Nori Contract,
establish an Architecture Baseline for non-trivial work, and keep working only from
acceptance gaps until the report says whether it is complete.
```

For fuzzy goals, ask Nori to discover the real acceptance gaps first. It should ask about missing
field scope, validation rules, success signals, persistence, failure cases, and out-of-scope
boundaries before it turns the goal into a Nori Contract.

## What OpenNori Adds

OpenNori uses one project-local state directory:

```text
.opennori/
  manifest.json
  protocol.md
  agent-guide.md
  active/
    <goal>.acceptance.md
    <goal>.evidence.json
  completed/
  blocked/
  reports/
  brainstorms/
  architecture/
    baseline.json
    baseline.md
    profiles/
    challenges/
    decisions/
    evidence/
```

It does not create a `process/` directory as the main workflow surface.

## Core Concepts

### Nori Contract

A Nori Contract combines:

- the user's natural-language goal
- human-centered acceptance checks
- evidence state
- current gap
- completion judgment

Acceptance checks should describe user-visible operations and judgments, not implementation tasks.

### Architecture Baseline

For non-trivial work, Nori should establish an Architecture Baseline before implementation. The
baseline records the architecture profile, principles, boundaries, preferred and avoided choices,
build-vs-buy policy, and challenge rules that the agent must follow while completing Product AC.

Architecture Baseline is not a plan. It is sticky implementation guidance: if project evidence
conflicts with it, the agent creates an Architecture Challenge instead of silently changing the
technology stack, state model, dependency policy, or directory boundary.

OpenNori includes built-in profiles such as `agent-native-cli`, and projects can add their own
profiles under `.opennori/architecture/profiles/`.
`opennori architecture profiles --json` exposes each profile's suitable use cases, reference
sources, principles, checks, preferred libraries, avoid boundaries, and build-vs-buy policy so an
agent can show a reviewable architecture choice before asking the user to confirm a baseline.

### Acceptance Discovery

Nori should not accept vague criteria such as "modify fields" or "show an error". Before drafting a
contract, OpenNori can surface the missing questions that decide whether the user can accept the
result:

- which fields can be changed
- what validation rules apply
- what success feedback the user sees
- how persistence is verified after refresh or return
- what failed-save behavior looks like
- what is intentionally out of scope

### Evidence Record

Evidence can come from tests, screenshots, URLs, artifacts, logs, human confirmation, waivers, or
other reviewable sources. OpenNori keeps evidence flexible, but high-risk completion should not rely
only on an agent's self-summary.

### Nori Profile

Nori Profile records execution preferences such as required Skills, preferred stacks, avoided tools,
and install policy. These preferences influence completion risk and blocking status, but they are
not user acceptance checks.

## Example Uses

### Frontend feature

User prompt:

```text
Use OpenNori for a settings page where users edit profile details.
```

Nori should reject vague acceptance checks like "modify fields" and ask which fields, rules, save
feedback, persistence, and failure states matter. The final contract should describe what the user
opens, edits, saves, refreshes, and expects to see.

### Required Skill and stack preference

User prompt:

```text
Use design-taste-frontend first, build custom components with Radix UI,
and avoid adding another UI framework.
```

Nori records these as Profile items, not acceptance checks. A violated `must` or `avoid` item can
block completion unless the user waives it.

### Architecture baseline

User prompt:

```text
Use OpenNori with an agent-native CLI architecture. Prefer mature libraries before self-building.
```

Nori lists available architecture profiles, previews the baseline, and asks the user to confirm
before implementation. Status and report then show Product decision and Architecture decision
separately.

### Project architecture preference

User prompt:

```text
This repo has a preferred architecture profile. Use it as the baseline before implementing AC.
```

Nori records the project profile under `.opennori/architecture/profiles/`, previews a baseline from
that profile, and keeps it sticky unless the agent raises a reviewable Architecture Challenge.

### Existing OpenNori project

User prompt:

```text
This repo already uses OpenNori. Bring it up to date without losing active contracts.
```

OpenNori previews install or upgrade actions before writing. Active contracts, evidence, reports,
and brainstorms are preserved by default. `check` can flag vague older acceptance checks for
user-approved revision, surface Architecture Baseline health, and warn when completion relies on
stale, broad, or summary-only evidence.

For existing projects with older OpenNori Skills or missing Architecture Baseline routes, use the
safe refresh path:

```bash
opennori install --root . --skill --refresh-skill --merge-agent-route --dry-run
opennori install --root . --skill --refresh-skill --merge-agent-route --confirm
```

This refreshes OpenNori Skills and merges an OpenNori section into project agent guidance without
replacing existing `AGENTS.md` content.

## Core Commands

Users should not need to memorize these commands. The OpenNori Skill Pack lets an agent map natural
language requests to the deterministic CLI state layer.

```bash
opennori bootstrap
opennori doctor --root .
opennori architecture profiles --root . --json
opennori architecture profile --root . --from ./team-architecture.json
opennori architecture baseline --root . --goal "Ship a user-visible result"
opennori discover --goal "Ship a settings page" --root .
opennori brainstorm --idea "Explore this goal" --root .
opennori draft --goal "Ship a user-visible result" --root .
opennori approve --root . --summary "User approved the acceptance checks."
opennori status --root .
opennori evidence add --root . --criterion AC-1 --kind review-result --summary "..." --result passing
opennori report --root .
```

## Productized Boundaries

- `bootstrap` gives agents one short entry for readiness checks and first-time preview. Lower-level
  `install`, `upgrade`, and `uninstall` still support preview-first workflows; destructive writes
  require explicit confirmation.
- In a human terminal, `opennori` or `npx opennori` is interactive. With `--json` or non-interactive
  stdio it returns structured JSON for agents and automation.
- `discover` finds underspecified acceptance gaps before draft, so vague ACs such as "modify fields"
  or "show an error" become user questions instead of weak contracts.
- Existing projects keep their Nori Contracts and evidence during upgrade. After upgrading, `check`
  audits active contracts for vague ACs, surfaces architecture warnings, reports evidence health,
  and asks the user before any revision.
- Existing projects can refresh stale OpenNori Skills and merge Architecture Baseline routes with
  `--refresh-skill --merge-agent-route`, preserving project guidance instead of forcing overwrites.
- `doctor` reports whether project state is `ready`, `needs-action`, or `broken`, with recovery
  actions.
- Nori Profile records required Skills, preferred stacks, avoided tools, and install policy without
  turning those preferences into user acceptance checks.
- Architecture Baseline records architecture guidance, build-vs-buy policy, and challenge rules
  without turning architecture checks into Product AC.
- Project Architecture Profiles can extend the built-in profiles; confirmed baselines are sticky
  and must be challenged with evidence before changing.
- Evidence stays flexible: tests, screenshots, URLs, artifacts, logs, human confirmation, waivers,
  or other reviewable sources can support an acceptance check.
- Evidence health is separate from the evidence source taxonomy: `check`, `status`, and `report`
  warn about stale, broad, source-free, or non-reviewable evidence before confidently claiming
  completion.
- Context export can give review tools the current goal, checks, profile, Architecture Baseline,
  evidence, and report, but review tools do not take over the agent loop.

## Development

```bash
npm test
npm run check
```

## License

GPL-3.0-only
