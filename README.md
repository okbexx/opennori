# OpenNori

Human-acceptable delivery contracts for coding agents. / 面向 AI 编码代理的人类可接受交付契约层。

---

> **[English](#english)** | **[简体中文](#简体中文)**

---

<a name="english"></a>

# OpenNori (English)

Human-acceptable delivery contracts for coding agents.

[![npm version](https://img.shields.io/npm/v/opennori.svg)](https://www.npmjs.com/package/opennori)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)

OpenNori helps coding agents turn natural-language goals into Nori Contracts:
human-centered acceptance checks, architecture baseline, reviewable evidence,
and completion reports.

OpenNori is not a phase system, plan template, or process archive. The agent can
plan internally, but the user-facing loop stays centered on what the user wants,
what acceptance checks define done, what evidence supports each check, and
whether the goal is complete.

## Install

First-time setup installs OpenNori with preview and explicit confirmation:

```bash
npx opennori setup
```

After setup, initialize each project from that project directory:

```bash
opennori init
```

Then open a new Codex session and say:

```text
Use OpenNori for this goal.
```

OpenNori's normal user path is conversation first. The CLI remains available as
the deterministic state layer for initialization, status, reports, dashboard,
doctor, and automation. In an interactive terminal it prints short human
summaries; pass `--json` when an agent, script, or CI job needs the full payload.

For recovery, run `opennori doctor`. For local OpenNori development from a
source checkout, see [Advanced Commands](#advanced-commands).

## Quick Start

If OpenNori is already installed on this machine, run the project initializer:

```bash
opennori init
```

The initializer previews the `.opennori/` state it would create and asks before
writing. Agents and CI can use `--json` for deterministic machine-readable
output.

Then talk to your agent:

```text
Use OpenNori for this goal. Discover the real acceptance criteria first,
confirm the Nori Contract with me, establish an Architecture Baseline for
non-trivial work, and keep working from acceptance gaps until the report can
say whether it is complete.
```

For a rough idea where you want fewer clarification rounds, ask for autogoal:

```text
Use OpenNori autogoal to turn this rough idea into a Nori Contract: ...
```

Autogoal is not a new artifact type. It is a packaged Skill behavior that
reads project context, preserves the full idea, infers reasonable assumptions,
asks only questions that change completion meaning, and writes the same
standard Nori Contract Draft that a manual OpenNori discussion would produce.
It must not shrink broad ideas into MVP, first version, prototype, phase list,
or task list wording.

For a very rough idea, you can ask for enhanced autogoal:

```text
Use OpenNori autogoal enhanced mode. Self-grill this todolist idea, then turn it into a Nori Contract.
```

Enhanced Discovery is still Skill behavior, not a new CLI command. The agent
first expands scenarios, states, data rules, failure and recovery behavior,
UX expectations, persistence, review methods, assumptions, and out-of-scope
boundaries. It then shows a compact coverage summary and asks only the critical
questions that change completion meaning before drafting the same standard
Nori Contract.

For visible products, enhanced mode must turn that discovery into concrete AC
text. A draft is not good enough if it says "coverage checked" while the AC
still reads like "users can manage projects" or "the dashboard shows state".
The AC measurement and threshold should expose the actual user entry, trigger,
interaction surface, fields or states, feedback, persistence or destructive
boundary, failure/recovery behavior, and reviewable evidence shape.

You can tell enhanced mode was used because the agent reply includes
`Enhanced Discovery checked`, explains what coverage was reviewed, and later
status/report output can show the discovery coverage summary. If those signals
are missing, ask the agent to revise the draft before approval.

After any draft is generated, the agent should not ask for blind approval. It
should show a compact overview, then review the contract one AC at a time. For
the current AC only, the agent explains where the user enters, what the user
does or judges, what result should be visible, what would not count as passing,
and what type of evidence would support it. The user confirms or revises that AC
before the agent moves to the next one. Approve only after every AC has been
confirmed one by one. This explanation must be concrete: it should name the
actual screen, route, command, object, field, state, message, boundary, failure
example, or evidence object for that AC. Generic wording such as "open the
relevant page", "check the result", or "use a screenshot" is not enough.

When the goal is a complete product, complete feature loop, full app, full
dashboard, full workbench, or explicitly "not MVP", OpenNori should define the
full acceptance surface before implementation. The Nori Contract can contain
more AC when the product has more user-judgable surfaces: roles,
entry/navigation, core workflows, state transitions, data rules, permissions,
failure/recovery, persistence, UI/UX, reporting or review method, and explicit
boundaries. Execution still moves one current gap at a time; the agent should
not narrow the completion definition unless the user explicitly asks for a
prototype, MVP, first version, or smaller scope.

For complete-product autogoal, the agent should run a coverage self-check
before writing the draft. It maps user-visible surfaces to planned AC boundaries
and splits unrelated judgments instead of bundling overview, assets, memory,
capabilities, external knowledge, search, audit, UI states, persistence, and
recovery into a few broad checks.

If you and the agent have already discussed the goal and candidate AC before
starting OpenNori, ask the agent to adopt the discussion:

```text
Use OpenNori to take over the AC we just discussed. Turn it into a Nori Contract Draft.
Do not start implementation; show it to me for confirmation first.
```

This writes the same standard draft Nori Contract under `.opennori/drafts/`.
It preserves the discussed AC, assumptions, and open questions, but it does not
approve the contract, start implementation, or treat conversation notes as
evidence.

The adoption reply should still start the one-AC-at-a-time AC Review Loop before
approval. Conversation notes are not enough; the user must be able to catch
whether the agent understood the current AC before moving to the next one.

Users do not need to memorize CLI flags or Skill names. The bundled Skills map
natural language to the deterministic `opennori` state layer.

When you want the agent to continue instead of stopping at "next step", ask:

```text
Use OpenNori Loop Engineer. Keep advancing the current gap and tell me only when you need my decision.
```

Loop Engineer is a packaged Skill behavior, not a new CLI command. To the user,
it should look like the agent keeps working from the current acceptance gap and
stops only when a human decision is needed. A healthy reply leads with Goal,
Current gap, Action taken, Evidence, Decision, Need user, and Next. Internally,
the Skill reads OpenNori state and chooses the focused OpenNori capability for
that loop.

OpenNori keeps protocol field names stable in English, but the human-readable
Contract presentation can be English or Simplified Chinese. By default the
Skills infer the Contract language from the user's goal and conversation; when
the user says "write the AC in Chinese" or "keep this contract in English", the
Skill records that preference in the draft so later status, report, and next
candidate surfaces can preserve it.

The same rule applies to user-reviewable Project Profile assets. Project Profile
item names, purposes, scopes, and compliance evidence summaries, plus
agent-created project Architecture Profile titles, summaries, checks, technical
baseline decisions, dependency reasons, and build-vs-buy explanations should
follow the user's language or the current Nori Contract `presentation.language`.
JSON keys, stable ids, and enum-like values stay stable in English. Built-in
package Architecture Profiles may remain as shipped; project assets created for
a Chinese goal should not default to English unless the user asks for it.

Each current or draft goal is one user-facing Nori Contract stored as a goal
dossier. Users can read the generated README files and reports to judge the
result. Agents and tools use the JSON files as the source of truth, but should
present the state as one contract, not as a pile of internal files.

Generated Markdown files are review surfaces only. OpenNori-owned goal and AC
`README.md` files may include a generated review marker so agents and tools can
read them as summaries, but they are not import files and cannot approve,
revise, or update a Nori Contract. Contract state comes from `contract.json`,
`ledger.json`, `criteria/<AC-id>/criterion.json`, `status.json`, and evidence
records. If OpenNori ever adds editable Markdown import, that is a new
architecture decision and must re-evaluate mature Markdown/frontmatter parsers
instead of expanding the local generated-review helper.

## What It Creates

OpenNori uses one project-local state directory:

```text
.opennori/
  manifest.json
  protocol.md
  agent-guide.md
  current/
    <goal>/
      contract.json
      ledger.json
      README.md
      criteria/
        <AC-id>/
          criterion.json
          status.json
          README.md
          evidence/
          artifacts/
  drafts/
    <goal>/
      contract.json
      ledger.json
      README.md
      criteria/
  completed/
  blocked/
  reports/
  brainstorms/
  events/
    events.jsonl
  activity/
    current.json
  snapshots/
    current.json
  architecture/
    baseline.json
    baseline.md
    profiles/            # reusable project Architecture Profiles
    challenges/          # Architecture Challenges
    decisions/           # build-vs-buy and architecture decisions
    evidence/            # architecture apply records only
```

It does not create `process/` as the workflow surface, and it does not copy
OpenNori Skills into each user project.

## Local Dashboard

OpenNori can start a local visual dashboard:

```bash
opennori dashboard --root .
```

The dashboard shows agent activity, goal, current gap, user intervention,
architecture decision, and completion decision. When user input is needed, it
shows what to reply in the agent conversation. It does not provide confirm,
reject, waive, or accept buttons, and it does not write Product AC, evidence,
profile, architecture, or report state. It observes `.opennori/` state; it is
not an agent runtime, process log, or replacement for `status` and `report`.
The command prints a local URL and does not open a browser automatically. Use
`opennori dashboard --root . --open` only when you want the CLI to open the
default browser.

When the dashboard is being watched and a current goal/gap exists, OpenNori
Skills can publish live activity while working. Users do not need to memorize the
activity command. Draft contracts are not observed, setup/init previews do not
invent activity, and multiple current contracts are treated as broken state
rather than a normal dashboard choice.

Activity is not acceptance evidence. Completion still comes from Product AC,
evidence, profile, architecture, and report state.

## Read-Only MCP Context

OpenNori can expose the same project state to MCP clients:

```bash
opennori mcp --root .
```

The MCP server uses stdio and registers read-only JSON resources:

- `opennori://project/context`: current Nori Contract, AC status, evidence
  health, Project Profile, architecture state, report paths, and `agent_next`.
- `opennori://project/snapshot`: dashboard-aligned state projection without
  writing `.opennori/snapshots/current.json`.
- `opennori://project/doctor`: project health and recovery actions.

MCP does not replace the CLI or Skills. It registers no write tools, does not
approve AC, record evidence, confirm architecture, waive risks, or drive the
dashboard. State changes still go through OpenNori Skills and the deterministic
CLI state layer.

## Core Concepts

### Nori Contract

A Nori Contract combines:

- the user's natural-language goal
- human-centered acceptance checks
- evidence state
- current acceptance gap
- completion judgment

Acceptance checks should describe user-visible operations and judgments, not
implementation files, modules, tests, Skills, or technology choices. OpenNori
surfaces likely mistakes as review questions for the agent and user; it does
not reject a contract just because a heuristic sees a technical word.

### Acceptance Discovery

Nori should review vague criteria such as "modify fields" or "show an error"
with the user instead of silently treating them as done. This is an agent Skill
responsibility, not a CLI word-list validator. Before drafting or claiming
confident completion, the agent asks the questions that decide whether the user
can accept the result:

- which fields can be changed
- what validation rules apply
- what success feedback the user sees
- how persistence is verified after refresh or return
- what failed-save behavior looks like
- what is intentionally out of scope

### Acceptance Surface Modeling

For visible product work, Nori should model the user's operation path before it
drafts AC, records confident passing evidence, or reports confident completion.
This applies to UI, CRUD, dashboards, lists, tables, forms, settings, admin
consoles, desktop windows, CLI prompts, previews, inspectors, and similar
surfaces.

A healthy Acceptance Surface Model names:

- actor
- entry
- visible trigger
- object
- action
- interaction surface
- required information
- feedback
- state change
- persistence
- destructive boundary
- evidence shape

"Project CRUD works" is not a reviewable acceptance criterion. Nori should ask
or infer whether adding a project starts from an icon button, text button,
empty-state action, command, or menu item; whether the user picks a system
directory or fills a modal; which fields are required or read-only; what success
and failure feedback appears; whether edit happens inline or in a dialog; and
whether delete removes a local directory, unlinks a registry entry, archives the
project, or is intentionally out of scope. If one of those decisions changes
what "done" means, the agent should ask one completion-changing question or put
a clear assumption into the draft and AC Review Loop.

This is not an implementation plan and not a CLI word-list validator. It is
Skill behavior plus user review. Evidence and reports should also respect it:
if a broad visible-surface AC has objective evidence but no modeled operation
path, OpenNori should say it is objectively evidenced but not confidently
acceptable yet, then route the agent back to acceptance revision.

The model must also be visible in the Nori Contract itself. A coverage summary
that says the agent considered project CRUD or dashboard paths is not enough.
For visible product surfaces, the AC should carry the path in its own fields:

- `user_story`: the user's role, entry, object, and operation or judgment
- `measurement`: the entry, visible trigger, interaction surface, object/action,
  and required information or states the user checks
- `threshold`: the feedback, state change, persistence or destructive boundary,
  failure/recovery behavior, and evidence shape that make the AC pass

If those details only appear in the agent's explanation, architecture notes,
evidence notes, or future implementation plan, the draft is not ready for
approval.

The same boundary applies across the full Skill pack. Architecture review,
architecture apply, architecture challenge, build-vs-buy, capability profile,
and project health cannot fill in missing product-surface semantics. They may
choose technical boundaries, record preferences, or recover state only after
the Product AC is concrete enough for the user to operate and judge.

The same review applies to broader product surfaces. If a criterion only says
"overall picture", "long-term assets", "project memory", "knowledge
candidates", "capabilities", or "result changes", the OpenNori Skills should
make the agent ask which visible objects, fields, lifecycle states, source
links, recovery paths, and boundaries the user must see. Passing evidence can
still be provisional until those questions are resolved or explicitly accepted
as remaining review risk.

For user-visible interfaces, Nori should also discover experience acceptance.
If the goal includes a page, app, Dashboard, Desktop, workbench, form, settings
screen, or admin console, the agent should not stop at data or happy-path
function checks. It should ask or infer how the user enters and navigates,
which information appears first, how empty/loading/error/success states look,
what feedback follows actions, whether the interface is readable and
consistent, how the user recovers from failure, and what the UI must not expose.
These UX checks stay as human-facing AC and user confirmation, not CLI
hard-fail rules.

For complete product work, Nori should expand the full acceptance surface rather
than hide important dimensions inside a few broad criteria. A complete product
contract may legitimately have many AC when each one describes something the
user can open, do, see, review, or decide. The user can remove, defer, or narrow
checks, but the agent should not silently downgrade the target into a starter
slice.

If a complete-product draft feels too small, do not approve it. Ask the agent to
run coverage review and revise the draft. A healthy draft can show the coverage
map first, then separate AC for the independent surfaces the user must judge.

### AC Review Loop

A draft Nori Contract is not ready for approval until the agent walks the user
through a one-AC-at-a-time review. The agent may show a compact overview of all
checks, but confirmation happens on the current AC only. For that current AC,
the explanation should stay at the human acceptance level and be specific to the
AC:

- exact screen, route, menu, command, or object list the user starts from
- exact object, field, filter, button, state, or report the user acts on or judges
- exact visible data, label, status, message, preview, persisted value, or report result
- concrete wrong, missing, stale, failed, inaccessible, confusing, or out-of-scope cases
- specific screenshot, browser run, command output, saved state, report, artifact path, or human confirmation that would prove the AC

The user replies `confirm AC-1` to continue or `revise AC-1: ...` to correct
that AC. Final `approve` should only happen after every AC has been confirmed in
the loop.

When a draft AC is revised, the draft stays unapproved. The agent should use the
draft revision path, restart review for the changed AC, and avoid treating the
revision as final approval or implementation evidence.

When review reveals a missing acceptance boundary, the agent should add it
through the draft criterion add path:

```bash
opennori criterion add --root <repo> --from-draft --goal <goal-id> --id AC-... \
  --user-story "..." --measurement "..." --threshold "..."
```

This keeps `acceptance_basis.status` as `draft` while synchronizing the draft
contract, evidence ledger, goal README, per-criterion dossier, and manifest.
Agents should not patch `contract.json`, `ledger.json`, criterion dossier files,
or manifest files by hand for normal draft AC additions.

This is not an implementation plan, file list, architecture decision, or
evidence claim. If the interpretation adds a new completion condition, the
agent should revise the AC or assumptions before continuing the review. If the
same interpretation could be copied unchanged to another AC or product, it is
too generic.

### Contract Language Preference

Contract language is a presentation preference, not a Product AC. OpenNori
stores it as `presentation.language` on brainstorms, discoveries, and Nori
Contracts so generated goals, acceptance checks, discovery questions, and next
loop candidates stay in the language the user expects.

Examples:

```text
Use OpenNori for this goal. Write the acceptance checks in Chinese.
```

```text
用 OpenNori 跑这个目标，验收标准用中文。
```

Existing approved contracts are not silently translated. If the user wants to
change the presentation language of an existing contract, the agent should
revise any visible wording that needs to change, then ask the user to approve
the updated Nori Contract. The CLI only stores the approved presentation
preference; it does not pretend an old contract was translated as a side effect
of `status`, `report`, `check`, or evidence writes.

### Architecture Baseline

For each goal, Nori first records whether Architecture Baseline review is
needed. This requirement decision is made by the agent/user, not inferred by the
CLI from the existence of a goal:

- `unknown`: the agent/user has not decided yet.
- `required`: non-trivial implementation needs Architecture Baseline review.
- `not_required`: the goal can continue with Product AC evidence without architecture review.
- `waived`: the user accepts the architecture review risk for this goal.

For `required` work, Nori should establish an Architecture Baseline before
implementation. The baseline has two layers: an Architecture Charter for
product boundaries and agent behavior, and a Technical Architecture Baseline
for runtime topology, source of truth, module/package boundaries, contract
surfaces, data flows, dependency decisions, reference mappings, and
verification.

Architecture Baseline is not a plan. It is sticky implementation guidance: if
project evidence conflicts with it, the agent creates an Architecture Challenge
instead of silently changing the technology stack, state model, dependency
policy, contract surface, module boundary, or directory boundary.

If requirement is `unknown`, completion reports `architecture_requirement`
review risk. If requirement is `required` and baseline state is missing,
challenged, invalid, or stale, completion reports `architecture_review`. If the
user waived architecture review, completion reports `architecture_waived` with
the recorded reason.

### Evidence Record

Evidence can come from tests, screenshots, URLs, artifacts, logs, human
confirmation, waivers, or other reviewable sources. OpenNori keeps evidence
flexible, but high-risk completion should not rely only on an agent's
self-summary.

Architecture apply records live under `.opennori/architecture/evidence/` and
can be attached to Product AC evidence as context, so a report can show that the
proof was produced under the confirmed baseline. They do not prove Product AC by
themselves; passing evidence still needs a user-visible verification source.
Do not put Architecture Profile source JSON, baseline previews, screenshots,
logs, or Product AC evidence in `.opennori/architecture/evidence/`; profiles
belong under `.opennori/architecture/profiles/`, and Product AC proof belongs in
the normal evidence ledger.

### Next Loop Handoff

When a goal is confidently complete, `resume`, `status`, `next`, `report`, and
context export return `agent_next.state: ready_for_next_loop`. OpenNori does not
invent product candidate goals in the CLI. If the user asks to continue, the
Loop Engineer Skill uses the completed context and the user's intent to route
through `nori-acceptance`, prepare the next human-facing NoriBrief, then stores
it with `opennori draft --brief`.

Next-loop suggestions are not phases, task lists, approved acceptance checks, or
completion evidence. A new loop starts only after the Skill creates a standard
draft Nori Contract and the user approves or revises it.

### Project Profile

Project Profile records project-level execution preferences such as required
Skills, preferred stacks, avoided tools, and install policy. It lives under
`.opennori/profile/` and is not copied into a goal. Current goals can record
compliance evidence against that Project Profile, and status/report/dashboard
show whether the current goal satisfies it. These preferences influence
completion risk and blocking status, but they are not user acceptance checks.

Build-vs-buy findings work the same way. They are architecture review risks,
not Product AC. If self-built infrastructure lacks reuse research or a
self-build reason, status/report say `build_vs_buy` review is required before
claiming mature completion.

## Example Uses

### Autogoal From Rough Idea

User prompt:

```text
Use OpenNori autogoal to turn this rough idea into a Nori Contract:
I want this agent tool to help teams understand whether a delivery is truly done.
```

Nori should converge the rough idea into a standard draft Nori Contract, not an
autogoal-specific report. The draft should preserve the full intended user
closure, include user-facing AC with concrete measurement and passing
thresholds, list assumptions, and ask only questions that change the completion
definition. It should not downgrade the idea to an MVP, first version,
prototype, phase list, or task list.

If the user asks for enhanced mode or self-grill, Nori first expands the rough
idea internally before drafting. For a todolist, it should cover task creation,
list visibility, editable fields, completion state, filtering, invalid input,
delete/recovery behavior, refresh persistence, UX states, assumptions, and
whether due dates, tags, priorities, sync, or multi-user use are in scope. The
user sees a compact coverage summary and only the critical questions that
change completion meaning, not an exhaustive private reasoning transcript.

Before asking for approval, Nori should explain how it understands each AC. The
user approves the Nori Contract only after the written checks and the agent's
interpretation both match the intended completion meaning.

### Complete Product Or Dashboard

User prompt:

```text
Use OpenNori to define the full Nori Contract for a complete project dashboard,
not an MVP.
```

Nori should not return a small starter checklist. The draft should cover the
full user acceptance surface: who uses the dashboard, how they enter and
navigate, what objects and state labels they inspect, which workflows close the
loop, how empty/loading/error/success states behave, what permissions and
boundaries apply, how data persists across sessions, how failures recover, what
UI/UX quality the user can judge, and how the final report or review proves the
product is acceptable. The user may then explicitly narrow scope before
approval.

If the draft only has a few broad checks, Nori should treat that as failed
coverage review and revise it before approval. The agent should show what
surfaces were checked and split independent judgments such as project selection,
asset previews, memory, capability status, knowledge candidates, search/index,
audit, security boundary, state feedback, persistence, and recovery.

### Frontend Feature

User prompt:

```text
Use OpenNori for a settings page where users edit profile details.
```

Nori should not accept vague checks like "modify fields". The Skill should make
the agent ask which fields, validation rules, save feedback, persistence
behavior, failed-save states, and out-of-scope boundaries matter. The final
contract should describe what the user opens, edits, saves, refreshes, and
expects to see.

Before approval, the agent should restate its interpretation of each settings
page AC so the user can catch mistakes such as the wrong editable fields,
missing validation rules, or misunderstood failure behavior.

### Project CRUD Or Management Surface

User prompt:

```text
Use OpenNori for project CRUD in this workbench.
```

Nori should not create one AC that says "users can manage projects". It should
model separate user operations when their path differs:

- add a project: where the user starts, which add control is visible, whether a
  system directory picker or manual form appears, required fields, validation,
  success feedback, and persistence after reopening
- view or select a project: list/table/card entry, visible status labels,
  selected state, empty state, and unavailable project behavior
- edit project information: edit trigger, modal/drawer/inline surface,
  editable versus read-only fields, save/cancel feedback, and persistence
- delete, unlink, or archive: exact destructive wording, confirmation surface,
  what is removed or preserved, recovery path, and failure feedback

Only after those operation paths are concrete should the agent draft AC or
record confident passing evidence.

### Adopt An Existing AC Discussion

User prompt:

```text
Use OpenNori to take over the AC we just discussed. Turn it into a Nori Contract Draft.
Do not start implementation; show it to me for confirmation first.
```

Nori should preserve the goal, candidate AC, assumptions, and unresolved
questions already discussed in the conversation. It writes a standard draft
Nori Contract with `source: conversation`, asks the user to approve or revise
it, and does not route the material through autogoal, start implementation, or
record passing evidence.

The agent should also say what each adopted AC means in its own words before
approval. If that interpretation differs from the conversation, the draft must
be revised instead of approved.

### Product Workbench

User prompt:

```text
Use OpenNori for a project workbench where users inspect project state,
assets, memory, knowledge candidates, capabilities, and agent results.
```

Nori should not accept broad checks like "show the overall situation" or "show
project memory" as confidently complete just because evidence is passing. It
should ask what exact objects, fields, states, source links, recovery actions,
and out-of-scope boundaries the user must see before the workbench can be
accepted.

### Skill And Stack Preference

User prompt:

```text
Use design-taste-frontend first, build custom components with Radix UI,
and avoid adding another UI framework.
```

Nori records these as Profile items, not acceptance checks. A violated `must` or
`avoid` item can block completion unless the user waives it. An unknown or
violated `prefer` item becomes `profile_review`: objectively complete work can
still require user or agent review before it is reported as confidently complete.

### Architecture Baseline

User prompt:

```text
Use OpenNori with an agent-native CLI architecture. Prefer mature libraries
before self-building infrastructure.
```

Nori lists available architecture profiles, previews the baseline, and asks the
user to confirm before implementation. Status and report then show Product
decision and Architecture decision separately.

If all Product ACs pass while the Architecture Baseline is missing, challenged,
or build-vs-buy is unhealthy, status/report answer: objectively complete with
review risk, not confidently complete.

### Existing OpenNori Project

User prompt:

```text
This repo already uses OpenNori. Bring it up to date without losing current, draft, or archived contracts.
```

OpenNori previews upgrade actions before writing. Active contracts, evidence,
reports, brainstorms, and architecture state are preserved by default. `check`
can flag vague older acceptance checks for user-approved revision, surface
Architecture Baseline health, and warn when completion relies on stale, broad,
or summary-only evidence.

## Advanced Commands

Users normally start through natural language in an agent conversation. These
commands are useful when a human wants to inspect state directly:

```bash
opennori setup
opennori init
opennori doctor --root .
opennori check --root .
opennori status --root .
opennori dashboard --root .
opennori report --root .
```

Agent/automation integrations use the same CLI with `--json` for deterministic
state writes and reads:

```bash
opennori plugin sync
opennori plugin sync --local --confirm
opennori architecture profiles --root . --json
opennori architecture baseline --root . --goal "Ship a user-visible result"
opennori discover --goal "Ship a settings page" --questions '<skill-prepared-questions>' --root . --json
opennori brainstorm --idea "Explore this goal" --candidates '<skill-prepared-candidates>' --root . --json
opennori draft --brief <skill-prepared-brief.json> --root . --json
opennori approve --root . --summary "User approved the acceptance checks." --json
opennori evidence add --root . --criterion AC-1 --kind review-result --summary "..." --result passing --json
opennori evidence prune --root . --criterion AC-1 --reason "Evidence no longer proves the current AC" --json
```

## Product Boundaries

- `setup` is the first-time machine installer for the complete capability
  bundle: Codex Plugin, packaged Skills, global CLI, project state, and doctor.
- `plugin sync` refreshes the installed Codex Plugin cache for local
  development or recovery without writing project `.opennori/` state.
- Local packaged Skill updates are applied through `opennori plugin sync`
  (`--local --confirm` for this source checkout), not by copying OpenNori
  Skills into `.agents/skills`.
- `init` prepares or refreshes `.opennori/` state in the current project.
- `install`, `upgrade`, and `uninstall` support preview-first workflows;
  destructive writes require explicit confirmation.
- OpenNori Plugin Skills are package behavior protocols for agents. Install and
  upgrade write project state, not project-local copies of OpenNori Skills.
- In a human terminal, `opennori setup` and `opennori init` are interactive.
  With `--json` or non-interactive stdio they return structured JSON.
- Lifecycle, health, status, report, dashboard, and plugin sync commands print
  short human summaries in a TTY by default. `--json` preserves the full
  machine-readable state for agents and automation.
- `autogoal` is Skill-driven convergence from a rough idea to a standard Nori
  Contract Draft. The CLI stores the normal draft state, often through
  `opennori draft --brief`; it does not create a separate Autogoal Contract or
  decide subjective AC quality through hard validators.
- Loop Engineer is Skill-driven continuation from `agent_next`. It is not a CLI
  command, plan mode, or task runner; it routes one current acceptance loop to
  the correct focused Skill and stops at user decision boundaries.
- Enhanced autogoal is `nori-autogoal` behavior, not a new CLI command or
  artifact. The agent self-expands rough product scenarios, assumptions,
  critical questions, and boundaries before writing the same standard draft.
- Complete product goals are not compressed into a small default AC set by the
  CLI. Packaged Skills expand the full acceptance surface and ask the user to
  approve, revise, or intentionally narrow it. This remains Skill/user review
  behavior, not a hard-coded natural-language validator.
- Complete-product autogoal performs coverage self-check before draft approval.
  If a draft bundles unrelated surfaces into a few broad AC, Skills route it
  back to acceptance revision instead of asking for approval.
- Conversation adoption is a `nori-acceptance` behavior for AC discussions that
  already happened. It uses the same draft state path with
  `acceptance_basis.source: "conversation"` and remains draft-only until user
  approval.
- `discover` can store a Skill-prepared question source before draft, but AC quality remains
  the agent Skill's responsibility and the user's final decision.
- `doctor` reports whether project state is `ready`, `needs-action`, or
  `broken`, with recovery actions.
- Project Profile records required Skills, preferred stacks, avoided tools, and
  install policy as project-level preferences; current goals only record
  compliance evidence against those preferences.
- Architecture Baseline records architecture guidance, build-vs-buy policy, and
  challenge rules without turning architecture checks into Product AC.
- Evidence stays flexible: tests, screenshots, URLs, artifacts, logs, human
  confirmation, waivers, or other reviewable sources can support an acceptance
  check.
- `dashboard` starts a loopback visual observation surface backed by events,
  activity, and snapshots. It does not execute agent work, certify completion,
  or host confirmation controls; user decisions stay in the agent conversation
  and are recorded through OpenNori Skills and CLI.
- `mcp` starts a stdio MCP server that exposes read-only `context`,
  `snapshot`, and `doctor` resources for agent/review clients. It registers no
  write tools and does not replace Skills, CLI state writes, reports, or the
  dashboard.
- `activity` commands publish live agent state for the dashboard. Activity is a
  signal, not evidence. When the dashboard is observed and a current goal/gap
  exists, Skills start activity before work, heartbeat only during longer work,
  and finish when the turn ends. Skills prefer `agent_next.dashboard_activity`
  command templates when present; otherwise the CLI can infer the unique current
  goal/gap and refuses ambiguous multi-goal activity.
- Architecture apply records may be attached as evidence context, but they do
  not count as Product AC proof without a user-visible verification source.
- Context export can give review tools the current goal, checks, profile,
  Architecture Baseline, evidence, report, and `agent_next` routing state, but
  review tools do not take over the agent loop.
- Complete goals expose `ready_for_next_loop`; the Skill prepares the next
  human-facing NoriBrief from context and user intent, then creates a draft
  Nori Contract with `opennori draft --brief`.

## Development

```bash
npm test                 # quick tagged Vitest subset for day-to-day edits
npm run test:acceptance  # run one domain, also: architecture/dashboard/docs/evidence/lifecycle/profile/reporting/schema
npm run check            # lint, typecheck, build, quick tests, doctor
npm run check:full       # full pre-release/pre-push guard
```

When changing packaged Skills, also run the human-review scenarios in
[`docs/skill-evals.md`](docs/skill-evals.md). Those scenarios check real
agent behavior and friction; they are not exact-output unit tests.

## License

GPL-3.0-only

---

<a name="简体中文"></a>

# OpenNori (简体中文)

面向 AI 编码代理（Coding Agents）的人类可接受交付契约层。

[![npm version](https://img.shields.io/npm/v/opennori.svg)](https://www.npmjs.com/package/opennori)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)

OpenNori 帮助 AI 编码代理将自然语言目标（Goals）转化为 Nori 交付契约（Nori Contracts）：
包括以人类为中心的验收检查项（Acceptance Checks）、架构基线（Architecture Baseline）、可审查的证据链（Reviewable Evidence）以及最终的完成度报告（Completion Reports）。

OpenNori 既不是阶段式流程系统，也不是固化的计划模板，更不是过往过程的归档器。AI 代理可以在内部进行自主规划，但面向人类用户的迭代循环始终紧密围绕四个核心点：用户期望什么、什么样的验收检查算作完成、有什么样的真实证据支持各项检查，以及该目标最终是否确实已完成。

## 安装

首次在机器上安装时，使用以下命令进行一键预览和确认安装：

```bash
npx opennori setup
```

安装完成后，在任意项目根目录下执行初始化：

```bash
opennori init
```

安装能力包后，在新开启的 Codex 会话中只需对 AI 代理说：

```text
使用 OpenNori 来完成这个目标。
```

OpenNori 的正常使用路径是先安装、初始化项目，然后继续在 agent 对话里用自然语言推进。CLI 仍然作为确定性状态层存在，适合初始化、查看状态、生成报告、打开 dashboard、doctor 诊断和自动化集成。在交互式终端里它默认输出短摘要；当 agent、脚本或 CI 需要完整确定性状态时，再显式传入 `--json`。

排障恢复时，优先运行 `opennori doctor`。本地源码开发需要刷新插件缓存时，见下方[高级命令](#高级命令)。

## 快速开始

如果您的机器已经完成了初始化安装，请直接在项目目录下运行初始化命令：

```bash
opennori init
```

初始化工具会预览它即将创建的 `.opennori/` 状态目录，并在实际写入前请求您的确认。AI 代理或 CI 流程可以带上 `--json` 参数以获取确定性的机器可读输出。

接下来，直接对您的开发代理输入：

```text
使用 OpenNori 来处理此目标。请先发现真实的验收标准，与我确认 Nori 契约；对于复杂的任务，请先确立架构基线，并针对验收差距不断迭代，直到最终报告可以明确判定是否已经彻底完成。
```

如果您只有一个粗略想法，并希望减少来回澄清，可以让代理使用 autogoal：

```text
用 OpenNori autogoal 把这个想法变成可验收的 Nori Contract：……
```

autogoal 不是新的产物类型。它是打包 Skill 的一种收敛行为：读取项目上下文、保留用户完整意图、推断合理假设、只询问会改变完成定义的问题，最后写出的仍然是和手动多轮讨论一致的标准 Nori Contract Draft。它不能把大目标降级成 MVP、第一版、原型、阶段清单或任务列表。

如果想让 agent 先自己把粗略想法彻底展开，可以要求增强模式：

```text
用 OpenNori autogoal 增强模式。先自己 grill 这个 todolist 想法，再把它变成 Nori Contract。
```

Enhanced Discovery 仍然只是 Skill 行为，不是新的 CLI 命令。agent 会先自我展开使用场景、状态、数据规则、失败和恢复、UX 预期、持久化、复查方式、假设和范围边界，然后只把会改变完成定义的关键问题交给用户确认，再写入同一类标准 Nori Contract Draft。

对于可见产品，增强模式还必须把这些发现落到具体 AC 文本里。draft 不能只写“覆盖面已检查”，但 AC 仍然是“用户可以管理项目”或“Dashboard 展示状态”。AC 的衡量方式和通过条件应暴露真实用户入口、触发控件、交互面、字段或状态、反馈、持久化或破坏边界、失败/恢复行为和可复查证据形态。

用户能从几个地方确认增强模式确实被使用：agent 回复里出现 `Enhanced Discovery checked`，说明覆盖了哪些场景，后续 status/report 能展示 discovery coverage summary。如果这些信号缺失，应要求 agent 先修正 draft，而不是直接 approve。

生成任何 draft 后，agent 不应直接要求用户盲目 approve。它应先给出简短概览，然后一次只确认一条 AC。对当前 AC，agent 要说明用户从哪里进入、做什么操作或判断、应该看到什么结果、什么情况不算通过、后续会用什么类型的证据证明；用户确认或修正这一条后，agent 才进入下一条。全部 AC 逐条确认后，才应该请求最终 approve。这个理解必须具体到该 AC 的实际页面、路由、命令、对象、字段、状态、提示、边界、失败样例或证据对象；“打开相关页面”“查看结果”“用截图证明”这类泛话不够。

当用户要求完整产品、完整功能闭环、完整应用、完整 Dashboard、完整工作台，或明确说“不要 MVP”时，OpenNori 应先定义完整验收面，而不是默认生成 3-5 条启动版 AC。完整验收面可以覆盖用户角色、入口与导航、核心工作流、状态转换、数据规则、权限与边界、失败与恢复、持久化、可见界面的 UI/UX、报告或审查方式。AC 数量可以随真实产品面增加；后续执行仍然按 current gap 一条条推进。只有用户明确选择原型、MVP、第一版或缩小范围，agent 才能缩小完成定义。

完整产品 autogoal 在写入 draft 前还应该做覆盖面自检：先把用户可验收面映射到 AC 边界，再把互不相关的用户判断拆开。不要把概览、资产、记忆、能力、外部知识库、检索、审计、UI 状态、持久化和恢复路径压进少量大 AC。

如果您已经和代理讨论过目标和候选 AC，再决定让 OpenNori 接管，请直接告诉代理：

```text
用 OpenNori 接管我们刚才讨论的 AC，整理成 Nori Contract Draft，不要开始实现，先给我确认。
```

这会把已有讨论整理为 `.opennori/drafts/` 下的标准 draft Nori Contract，保留已讨论的 AC、假设和开放问题；但不会批准契约、不会开始实现，也不会把聊天记录当作完成证据。

接管已有讨论时同样需要 AC 逐条确认循环。聊天记录不是批准依据；用户需要从 AC-1 开始确认 agent 对当前 AC 的理解是否正确，全部确认后再决定 approve。

用户无需死记硬背任何 CLI 命令行参数或 Skill 的具体名字。内置的技能（Skills）会自动将您的自然语言指示翻译为调用确定性 `opennori` 状态层的指令。

OpenNori 的协议字段名保持稳定英文，但人类可读的契约内容可以使用英文或简体中文。默认情况下，Skills 会从用户目标和对话语言中推断契约表达语言；当用户明确说“验收标准用中文”或“keep this contract in English”时，Skill 会把这个偏好记录进 draft，后续 status、report 和候选下一轮目标会沿用它。

## 生成的目录结构

OpenNori 在项目本地使用一个独立的状态目录进行所有信息持久化：

```text
.opennori/
  manifest.json          # 整体状态清单文件
  protocol.md            # Nori 契约协议规约说明
  agent-guide.md         # AI 代理行为指南
  current/               # 当前活跃中的契约目标
    <goal>/
      contract.json      # 目标级 Nori Contract 源数据
      ledger.json        # 聚合证据和状态账本
      README.md          # 目标级审阅面
      criteria/
        <AC-id>/
          criterion.json # 单条 AC 源数据
          status.json    # 可重建的状态投影
          README.md      # 单条 AC 审阅面
          evidence/      # 可审查证据记录
          artifacts/     # 截图、报告、命令摘要等审查资产
  drafts/                # 待用户确认的契约草案
  completed/             # 已完成的验收契约
  blocked/               # 处于阻塞状态的验收契约
  reports/               # 完成度判定的历史报告
  brainstorms/           # 头脑风暴与接力迭代提案
  events/                # dashboard 使用的事件账本
    events.jsonl
  activity/              # 当前 agent 活动信号
    current.json
  snapshots/             # 当前状态投影
    current.json
  architecture/          # 架构控制区
    baseline.json        # 架构基线数据
    baseline.md          # 架构基线人类可读规则 (Markdown)
    profiles/            # 项目技术画像
    challenges/          # 架构偏离挑战记录
    decisions/           # 架构决策记录
    evidence/            # 仅存架构 apply 记录
```

它不会在项目中创建如 `process/` 这样繁琐的工作流目录，也不会把 OpenNori 技能的实现源码复制到用户的项目内部。

## 本地 Dashboard

OpenNori 可以启动本地可视化 Dashboard：

```bash
opennori dashboard --root .
```

Dashboard 展示当前 agent 活动、目标、验收缺口、是否需要用户介入、架构判断和完成判断。需要用户介入时，它只提示用户应该回到 agent 对话里回复什么；不提供确认、拒绝、豁免或接受报告按钮，也不写入 Product AC、证据、profile、architecture 或 report 状态。它只是 `.opennori/` 状态上的观察面，不是 agent runtime、过程日志，也不能替代 `status` 和 `report`。
命令只打印本地 URL，不会自动打开浏览器；只有明确需要 CLI 自动打开默认浏览器时，才使用 `opennori dashboard --root . --open`。

OpenNori Skills 可以在工作时发布实时活动信号。用户不需要记住活动命令；当项目只有唯一当前目标/缺口时，CLI 会自动推断 goal/gap。draft contract 不会被观察；如果出现多个 current contract，这是需要 doctor 恢复的损坏状态，不是正常选择题。

活动信号不是验收证据。完成判断仍然只来自 Product AC、证据、Profile、Architecture 和报告状态。

## 核心概念

### Nori 交付契约 (Nori Contract)

一个 Nori 交付契约紧密结合了：

- 用户的自然语言目标
- 以人类为中心的验收检查项（Acceptance Checks）
- 证据链的就绪状态（Evidence State）
- 当前的验收差距缺口（Acceptance Gap）
- 最终的完成度判定结论（Completion Judgment）

验收检查项应当描述“用户可见的操作和判定逻辑”，而非具体的实现文件、代码模块、测试类、AI 技能或特定的底层技术选择。OpenNori 会自动检测容易混淆的描述并将其作为审查问题呈现给代理和用户；它绝不会仅仅因为发现了某些技术词汇而武断地驳回契约。

### 验收条件发现 (Acceptance Discovery)

Nori 倡导对于“修改字段”或“抛出错误提示”等含糊不清的验收指标进行主动的用户审查，而不是默默地将其糊弄为已完成。在起草契约或宣称信心交付之前，OpenNori 会引导 AI 代理主动向用户提出决定项目能否真正被接受的细节问题：

- 哪些字段允许编辑
- 输入数据应遵循什么校验规则
- 成功保存后用户能看到什么反馈
- 页面刷新或重入后，如何验证数据确实持久化了
- 保存失败时，界面的交互表现应当是什么样
- 哪些需求是故意被排除在本次交付范围之外的

如果目标包含页面、应用、Dashboard、Desktop、工作台、表单、设置页或管理台，Nori 还应当挖掘体验验收。代理不能只写数据或 happy-path 功能 AC，而要问清或合理推断：用户从哪里进入、如何导航、首屏先看到什么、空态/加载/错误/成功状态如何表达、操作后有什么反馈、界面是否可读且一致、失败后如何恢复，以及哪些 UI 边界不应暴露。这些属于人类视角 AC 和用户确认，不是 CLI 硬编码裁判。

### 可验收表面建模 (Acceptance Surface Modeling)

对于可见产品目标，Nori 在起草 AC、记录确信通过证据或报告确信完成前，应先建立用户操作路径模型。它适用于 UI、CRUD、Dashboard、列表、表格、表单、设置页、管理台、桌面窗口、CLI prompt、预览、检查器等用户通过具体入口、对象、操作、状态或反馈来判断完成的场景。

一个健康的可验收表面模型需要说清：

- actor：谁在操作或判断
- entry：用户从哪里进入
- visible trigger：用户点击哪个按钮、图标、菜单、快捷键、命令、行操作或自动提示
- object：操作对象是什么
- action：创建、查看、选择、编辑、删除、解绑、归档、预览、恢复等哪个动作
- interaction surface：弹窗、抽屉、页面、行内编辑、系统选择器、命令输出、表格行或 dashboard 面板
- required information：字段、选择项、默认值、只读值、校验规则和可选值
- feedback：成功、加载、空态、错误、取消、禁用、确认和恢复状态
- state change：操作后立刻可见的状态变化
- persistence：刷新、重启、重新进入后什么仍应成立
- destructive boundary：删除、解绑、隐藏、归档或明确不会删除什么
- evidence shape：什么截图、浏览器运行、命令输出、状态读回、报告、制品或人工确认能证明它

“项目 CRUD 能用”不是可复查的验收标准。Nori 应该问清或合理推断：新增项目是图标按钮、文字按钮、空态入口、命令还是菜单；是系统目录选择器还是弹框表单；需要填写哪些字段、哪些字段只读；成功和失败时如何反馈；编辑是在行内、弹窗还是详情页；删除到底是删除本地目录、解绑登记、归档项目，还是本轮不做。如果这些问题会改变“完成”的含义，agent 应只问一个最影响完成定义的问题，或把明确假设写进 draft 和 AC 逐条确认循环。

这不是实现计划，也不是 CLI 自然语言词表裁判；它是 Skill 行为和用户复核。证据和报告也要遵守它：如果一个宽泛可见产品 AC 有客观证据，但缺少操作路径模型，OpenNori 应报告“客观有证据，但还不能确信可验收”，并把 agent 路由回验收修订。

模型也必须进入 Nori Contract 本身。仅在覆盖面摘要里说 agent 考虑过项目 CRUD 或 Dashboard 路径是不够的。对于可见产品表面，AC 应在自己的字段里承载路径：`user_story` 写清用户角色、入口、对象和操作或判断；`measurement` 写清入口、可见触发、交互面、对象/动作以及必要字段或状态；`threshold` 写清反馈、状态变化、持久化或破坏边界、失败/恢复行为和证据形态。如果这些细节只存在于 agent 解释、架构笔记、证据说明或未来实现计划里，这份 draft 还不能 approve。

同样的边界适用于整个 Skill 包。架构审查、架构应用、架构质询、build-vs-buy、能力画像和项目健康检查都不能替用户补完产品表面语义。它们可以选择技术边界、记录偏好或恢复状态，但前提是 Product AC 已经具体到用户可以操作和判断。

### AC 逐条确认循环 (AC Review Loop)

Nori Contract Draft 生成后，agent 必须先给出简短概览，然后一次只确认一条 AC。对当前 AC 的解释应保持在人类验收层面，并且具体到该 AC：

- 用户从哪个具体页面、路由、菜单、命令或对象列表进入
- 用户操作或判断哪个具体对象、字段、筛选器、按钮、状态或报告
- 用户看到哪些具体数据、标签、状态、提示、预览、持久化结果或报告结论
- 哪些具体错误、缺失、过期、失败、不可访问、难以理解或越界情况不算通过
- 哪个具体截图、浏览器运行、命令输出、保存状态、报告、制品路径或人工确认能证明该 AC

用户回复 `confirm AC-1` 继续下一条，或回复 `revise AC-1: ...` 修正这一条。只有全部 AC 都逐条确认后，agent 才应该请求最终 `approve`。

draft AC 被修订后仍然是未批准草案。agent 应使用 draft 修订路径，并从被修改的 AC 重新开始确认；不能把这次修订当成最终 approval、实现证据或进入 profile/implementation 的信号。

如果逐条确认时发现缺了一条验收边界，agent 应使用 draft 新增 AC 路径：

```bash
opennori criterion add --root <repo> --from-draft --goal <goal-id> --id AC-... \
  --user-story "..." --measurement "..." --threshold "..."
```

这会保持 `acceptance_basis.status` 为 `draft`，同时同步 draft contract、evidence ledger、goal README、每条 AC 的 dossier 和 manifest。正常补 draft AC 时，agent 不应手工 patch `contract.json`、`ledger.json`、criterion dossier 或 manifest。

这不是实现计划、文件清单、架构决策或完成证据。如果解释里出现了新的完成条件，agent 应先修订 AC 或假设，再继续确认。如果同一段理解可以原封不动套到另一个 AC 或另一个项目，它就太泛。

### 契约语言偏好 (Contract Language Preference)

契约语言是表达偏好，不是 Product AC。OpenNori 会在 brainstorm、discovery 和 Nori Contract 上保存 `presentation.language`，让生成的 goal、验收标准、发现问题和下一轮候选目标保持用户期望的语言。

同样的规则也适用于用户需要阅读的 Project Profile 资产。Project Profile 的名称、目的、范围和合规证据摘要，以及 agent 为项目生成的 Architecture Profile 标题、摘要、检查项、技术基线决策、依赖理由和 build-vs-buy 说明，都应该跟随用户明确要求或当前 Nori Contract 的 `presentation.language`。JSON 字段名、稳定 id、`must` / `prefer` / `avoid` 这类协议值保持稳定英文。内置 Architecture Profile 可以保持包内语言；但为中文目标生成的项目资产不应该默认写成英文，除非用户明确要求英文。

每个 current 或 draft goal 对用户来说是一份 Nori Contract，物理上保存为 goal dossier。用户可以阅读生成的 README 和报告来判断结果；agent 和工具使用 JSON 文件作为状态源。agent 应把它表达为“一份草案契约”，而不是一堆并列文件。

生成的 Markdown 只用于审阅。OpenNori 自己生成的 goal / AC `README.md`
可以带有 generated review marker，方便 agent 和工具读取摘要，但它们不是导入文件，不能批准、修订或更新 Nori Contract。契约状态来自
`contract.json`、`ledger.json`、`criteria/<AC-id>/criterion.json`、`status.json`
和 evidence records。如果未来要支持可编辑 Markdown 导入，那是新的架构决策，必须重新评估成熟 Markdown/frontmatter parser，而不是扩展当前的 generated-review helper。

示例：

```text
用 OpenNori 跑这个目标，验收标准用中文。
```

```text
Use OpenNori for this goal. Write the acceptance checks in Chinese.
```

已经批准的契约不会被静默翻译。如果用户希望改变现有契约的表达语言，agent 应显式修订需要改变的可见文案，并重新请求用户批准更新后的 Nori Contract。CLI 只保存经过批准的表达偏好；不会在 `status`、`report`、`check` 或证据写入时假装旧契约已经被自动翻译。

### 架构基线 (Architecture Baseline)

每个目标都要先明确 Architecture Requirement：是否需要架构基线审查。这个判断由 agent/user 根据目标、项目证据和用户意图作出并记录，CLI 不能因为“存在 goal”或某些自然语言关键词就硬推断非平凡。

- `unknown`：还没有判断。
- `required`：非平凡技术实现需要先确立架构基线。
- `not_required`：当前目标足够简单，可直接回到 Product AC 证据闭环。
- `waived`：用户显式接受本目标的架构审查风险。

对于 `required` 的非平凡（复杂）技术实现，Nori 要求在动手敲代码前先建立架构基线。基线记录了当前项目的技术画像、设计原则、规范边界、首选及规避的工具技术、自研与复用策略，以及代理在实现产品验收条件（Product AC）时必须严格遵守的质询挑战规则。

架构基线分两层：Architecture Charter 约束产品边界和 agent 行为；Technical Architecture Baseline 约束运行拓扑、真相源、模块/包边界、CLI/MCP/API/IPC 契约面、数据流、依赖决策、参考项目映射和验证方式。只有原则、偏好或治理约束的 baseline 不足以指导非平凡实现。

架构基线绝不是开发计划，而是具有粘性的约束指南：如果项目实施证据与基线发生冲突，AI 代理必须显式发起一个架构质询（Architecture Challenge），而不是默默地更改技术栈、状态模型、依赖方针或目录结构。

如果 requirement 仍是 `unknown`，报告会显示 `architecture_requirement` 风险；如果 requirement 是 `required` 且基线缺失、被质询、无效或过期，报告会显示 `architecture_review` 风险；如果用户豁免了架构审查，报告会显示 `architecture_waived` 和豁免理由。产品功能本身可能已客观完成，但这些风险未被处理或接受前，OpenNori 不能出具“确信交付”的最终结论。

### 证据记录链 (Evidence Record)

证据可以来自于自动化测试结果、屏幕截图、可访问的 URL、打包生成的产物、运行日志、用户人工确认、授权豁免或其他可追溯的来源。OpenNori 保持证据的弹性灵活性，但面对高风险的交付，绝对不允许仅仅依赖代理的自我文字总结作为通过证据。

### 接力迭代交接 (Next Loop Handoff)

当一个目标被确信完成后，CLI 里的 `resume`、`status`、`next`、`report` 等命令和上下文导出数据会返回 `agent_next.state: ready_for_next_loop`。OpenNori CLI 不再自动发明下一轮产品候选目标。用户说“继续”时，Skill 基于已完成契约、当前项目上下文和用户意图准备下一份面向人的 NoriBrief，再用 `opennori draft --brief` 保存为标准草稿。

接力建议不是阶段、任务列表、已批准 AC 或完成证据。新的 loop 只有在 Skill 生成标准 Nori Contract Draft，并由用户 approve 或 revise 后才开始。

### Loop Engineer

当你不希望每轮都追问“下一步是什么”时，可以直接对 agent 说：

```text
用 OpenNori Loop Engineer 继续推进当前缺口；只有需要我做决定时再停下来告诉我。
```

Loop Engineer 是打包 Skill 行为，不是新的 CLI 命令。对用户来说，它应该表现为 agent 持续围绕当前验收缺口工作，并只在需要用户判断时停下。健康的回复应包含 Goal、Current gap、Action taken、Evidence、Decision、Need user 和 Next。内部如何读取状态、选择子能力，是 agent 能力包的事情，不应要求用户记住。

Loop Engineer 不能绕过用户决策边界。遇到 AC approval、逐条 AC 确认、架构基线确认、waiver、install confirmation、report acceptance 或其它需要用户判断的地方，agent 必须停下来让用户确认，而不是自动批准、自动豁免或继续实现。

### 项目画像 (Project Profile)

Project Profile 记录项目运行的全局偏好，如强制要求的 Skills、倾向的技术栈、规避的依赖包以及环境安装策略。它保存在 `.opennori/profile/`，属于项目级状态；current goal 只记录针对这份 Project Profile 的合规证据。这些偏好会影响交付风险评估和阻塞审查，但它们绝不会被混淆进面向用户的业务验收条件（AC）中。

自研与复用的研判也遵循相同的逻辑。它们属于架构审查风险（Architecture Review Risks），而不是产品业务的 AC。如果自研的基础设施缺乏复用研究或明确的自建理由，状态/报告里会直接声明需要进行 `build_vs_buy` 审查后方可 claimed 最终成熟完成。

## 典型使用示例

### 1. 从粗略想法自动收敛契约

用户 Prompt 输入：

```text
用 OpenNori autogoal 把这个想法变成可验收的 Nori Contract：我希望这个 agent 工具帮助团队判断一次交付是否真的完成。
```

Nori 会先自行读取项目上下文并补齐真实验收闭环，然后输出标准 Nori Contract Draft，而不是 autogoal 专用报告。该 draft 会保留完整目标意图，写出用户视角 AC、衡量方式、通过条件、假设和真正影响完成定义的开放问题；它不能把目标降级成 MVP、第一版、原型、阶段清单或任务列表。

如果用户要求增强模式或“agent 自己 grill 自己”，Nori 会先在内部展开粗略想法再起草。以 todolist 为例，它应覆盖任务创建、列表可见性、可编辑字段、完成状态、筛选、非法输入、删除/恢复、刷新持久化、UX 状态、假设，以及 due date、tag、priority、同步或多人是否在范围内。用户看到的是简洁覆盖面摘要和会改变完成定义的关键问题，而不是完整内部推理记录。

请求 approve 前，Nori 应先给出概览，再从 AC-1 开始逐条确认自己的理解。用户回复 `confirm AC-1` 后才进入 AC-2；如果理解不对，用户回复 `revise AC-1: ...`。用户最终批准的是已经逐条确认过的 Nori Contract，而不是只批准一组看起来像 AC 的句子。

### 2. 完整产品或完整 Dashboard

用户 Prompt 输入：

```text
用 OpenNori 为完整项目 Dashboard 定义 Nori Contract，不要 MVP。
```

Nori 不应只输出少量启动版清单。它需要先覆盖完整用户验收面：谁使用、如何进入和导航、要查看哪些对象和状态标签、哪些核心工作流必须闭环、空态/加载/错误/成功如何呈现、权限和边界是什么、跨会话如何持久化、失败如何恢复、UI/UX 如何判断，以及最终报告或审查如何证明产品可接受。用户可以在 approve 前显式删减、延期或缩小范围。

如果 draft 看起来只有少量粗 AC，用户不应 approve。Nori 应把它视为覆盖面复查失败，展示缺失的验收面，并重新拆成可独立判断的 AC，例如项目选择、资产列表、Markdown/HTML 只读预览、项目记忆、能力状态、外部知识候选、检索索引、时间线审计、安全边界、状态反馈、持久化和失败恢复。

### 3. 接管已经讨论过的 AC

用户 Prompt 输入：

```text
用 OpenNori 接管我们刚才讨论的 AC，整理成 Nori Contract Draft，不要开始实现，先给我确认。
```

Nori 会保留对话里已经讨论过的目标、候选 AC、假设和未决问题，将它们整理为 `source: conversation` 的标准 draft Nori Contract，并要求用户 approve 或 revise。它不会把这段材料重新送进 autogoal，不会直接进入实现，也不会把讨论记录当作 passing evidence。

接管已有 AC 讨论后，agent 仍应逐条说明“我的理解”。如果理解和之前讨论不一致，必须 revise draft，不能直接 approve。

### 4. 开发前端页面

用户 Prompt 输入：

```text
使用 OpenNori 来做个人设置页面，用户在此编辑个人档案。
```

Nori 不应该接受类似“修改字段”等含糊不清的叙述。OpenNori Skill 会要求 agent 先向用户明确哪些字段可变、校验规则是什么、保存成功反馈、刷新持久化、保存失败响应以及超出范围的边界。最终起草的契约会准确描述用户怎么打开、怎么编辑、怎么保存和刷新、以及应当看到什么。

### 5. 开发项目 CRUD 或管理台

用户 Prompt 输入：

```text
使用 OpenNori 来做项目工作台里的项目 CRUD。
```

Nori 不应该只写一条“用户可以管理项目”。它应该在 AC 前拆清不同用户操作：

- 新增项目：用户从哪里进入，点击什么新增控件，是系统目录选择器还是手动表单，需要哪些字段，如何校验，成功后看到什么，重新打开后如何保持。
- 查看或选择项目：列表/表格/卡片入口、可见状态标签、选中态、空态、不可用项目如何显示。
- 编辑项目信息：编辑触发方式，弹窗/抽屉/行内/详情页等交互面，可编辑和只读字段，保存/取消反馈，持久化结果。
- 删除、解绑或归档：破坏性文案、确认界面、到底移除或保留什么、是否有恢复路径、失败时如何反馈。

只有这些操作路径足够具体后，agent 才应该起草 AC 或记录确信通过证据。

### 6. 开发项目工作台

用户 Prompt 输入：

```text
使用 OpenNori 来做项目工作台，用户要查看项目状态、资产、记忆、知识候选、能力和 agent 操作结果。
```

Nori 不应该因为证据显示 passing，就把“整体情况”“长期资产”“项目记忆”“知识候选”“能力”“结果变化”等抽象 AC 当成可信完成。OpenNori Skill 必须让 agent 追问用户必须看到哪些具体对象、字段、状态、来源链接、失败恢复方式和范围边界；这不是 CLI 词表能替用户决定的事情。

### 7. 声明技能与技术栈偏好

用户 Prompt 输入：

```text
优先采用 design-taste-frontend 规范，基于 Radix UI 开发自定义组件，且不要引入其他的 UI 框架。
```

Nori 会将这些规则记录在 Profile 画像中，而非验收条件（AC）里。当发生强约束 `must`（必须）或 `avoid`（避免）规则的违背时会直接阻塞流程，除非获得用户显式豁免；而推荐 `prefer`（首选）规则的偏离会被标记为 `profile_review`：此时功能上可能已经客观完成，但仍需要用户或代理进行画像合规审查。

### 8. 确立架构基线

用户 Prompt 输入：

```text
使用 OpenNori 针对代理原生 CLI 架构开展工作。在自研基础设施前，优先使用成熟类库。
```

Nori 会先记录 Architecture Requirement；当判断为 `required` 时，再列出可用的架构 Profile，预览基线内容，并请求用户确认。随后，状态和报告中会清晰地将“产品业务 AC”与“架构基线合规”分开并行评估。

如果产品功能 AC 全部通过，但 Architecture Requirement 未判断、required 的架构基线未确立、存在质询冲突或 `build_vs_buy` 健康状态低下，报告会回答：“客观功能已完成，但存在架构风险”，拒绝输出“确信交付”。

### 9. 迭代已采用 OpenNori 的项目

用户 Prompt 输入：

```text
这个仓库已经在使用 OpenNori 了。请将它升级到最新状态，且不要弄丢我正在活跃的合同。
```

OpenNori 在写入前会进行升级影响预览。活跃中的契约、证据、报告、脑风暴和架构信息默认会被完整保护。`check` 命令只检查契约结构、架构基线、Profile 和证据健康这类客观状态；历史遗留的含糊 AC 由 OpenNori Skills 引导 agent 与用户复核，而不是交给 CLI 词表裁决。`check` 也会在依靠过期/过于宽泛/代理自吹自擂的自我总结做证据时给出明确警告。

## 高级命令

用户通常从 agent 对话开始。下面这些命令适合人类直接查看或恢复项目状态：

```bash
opennori setup
opennori init
opennori doctor --root .
opennori check --root .
opennori status --root .
opennori dashboard --root .
opennori report --root .
```

agent、脚本或 CI 需要确定性状态读写时使用 `--json`：

```bash
opennori plugin sync
opennori plugin sync --local --confirm
opennori architecture profiles --root . --json
opennori architecture baseline --root . --goal "交付某功能"
opennori discover --goal "Ship a settings page" --questions '<skill-prepared-questions>' --root . --json
opennori brainstorm --idea "探索当前业务目标" --candidates '<skill-prepared-candidates>' --root . --json
opennori draft --brief <skill-prepared-brief.json> --root . --json
opennori approve --root . --summary "用户同意了当前验收标准" --json
opennori evidence add --root . --criterion AC-1 --kind review-result --summary "..." --result passing --json
opennori evidence prune --root . --criterion AC-1 --reason "证据过期" --json
```

## 产品与设计边界

- `setup` 是首次在机器上部署的完整大礼包：包含 Codex 插件安装、打包 Skills 分发、全局 CLI 工具和 doctor 检查。
- `plugin sync` 只刷新已安装的 Codex Plugin 缓存，用于本地开发或恢复，不写入项目 `.opennori/` 状态。
- 本机 packaged Skills 更新必须通过 `opennori plugin sync` 生效；源码 checkout 开发使用 `--local --confirm`，不要把 OpenNori Skills 复制到 `.agents/skills`。
- `init` 仅在本地初始化或重构 `.opennori/` 状态文件夹。
- `install`、`upgrade`、`uninstall` 采用预览优先工作流，任何破坏性写入均需人类显式同意。
- 插件技能（Skills）作为代理行为控制规约进行整体打包升级，项目本地仅保存状态，绝不复制 Skills 源码到用户目录。
- 在人机终端下，`setup` 与 `init` 是友好的人机交互；在非交互 stdio 或传入 `--json` 时会自动返回确定性、结构化的 JSON。
- 生命周期、健康诊断、状态、报告、dashboard 和插件同步命令在 TTY 下默认显示短摘要；`--json` 保留完整机器可读 payload。
- `autogoal` 是从粗略想法收敛到标准 Nori Contract Draft 的 Skill 行为。CLI 只保存普通 draft 状态，常见路径是 `opennori draft --brief`；它不会创建单独的 Autogoal Contract，也不会用硬编码 validator 替用户判断主观 AC 质量。
- Loop Engineer 是基于 `agent_next` 继续推进当前缺口的 Skill 行为。它不是 CLI 命令、plan mode 或任务 runner，只推进一轮验收闭环，并在 AC approval、架构确认、waiver、安装确认、报告接受等用户决策边界停下。
- 增强 autogoal 是 `nori-autogoal` 行为，不是新的 CLI 命令或产物。agent 会先自我展开粗略产品场景、假设、关键问题和范围边界，再写入同一类标准 draft。
- 增强 autogoal 必须留下用户可见确认面：回复中显示 `Enhanced Discovery checked`，contract metadata 持久化 `acceptance_basis.source = "autogoal"` 和 `acceptance_basis.mode = "enhanced"`，status/report 可展示 coverage summary。缺少这些信号时不应请求 approve。
- 完整产品类目标不会被 CLI 压缩成固定少量 AC。打包 Skills 会展开完整验收面，并让用户 approve、revise 或显式缩小范围；这仍然是 Skill/用户复核行为，不是自然语言 hard validator。
- 完整产品 autogoal 会先做覆盖面自检；如果 draft 把互不相关的验收面压进少量大 AC，Skills 会要求修订，而不是让用户直接 approve。
- 已讨论 AC 接管属于 `nori-acceptance` 行为：当对话里已经存在目标、候选 AC、假设和开放问题时，Skill 用同一条 draft 状态路径保存 `acceptance_basis.source: "conversation"`，并在用户 approve 前保持 draft-only。
- `discover` 在 draft 正式立项前生成问题来源；问题是否足够、该问哪些追问，由 OpenNori Skill 结合用户目标和项目上下文判断。
- `doctor` 以极简指示标输出当前仓库状态是 `ready`、`needs-action` 还是 `broken`，并给出精准的恢复路线。
- Project Profile 记录项目级 Skills、工具链、包控制等偏好倾向；goal 只记录合规证据，与业务验收 AC 彻底解耦。
- Architecture Baseline 确立原则、首选技术、自研政策和质询规范，与业务验收 AC 彻底解耦。
- 证据链保持无限弹性：可以是测试套件、图片证据、外部链接、编译日志或豁免权，但不接受代理空头总结。
- `dashboard` 启动 loopback 本地视觉观察面，读取事件、活动和状态投影。它不执行 agent 工作，不认证完成，也不承载确认控件；用户决策仍然发生在 agent 对话里，再由 OpenNori Skill/CLI 记录。
- `mcp` 启动 stdio MCP 服务，只暴露 `context`、`snapshot`、`doctor` 这三个只读 JSON 资源，供 agent 或审查客户端读取当前契约、状态投影和健康恢复建议。它不注册写工具，不批准 AC，不记录证据，不确认架构，也不替代 dashboard 或 CLI 状态写入。
- `activity` 命令只发布 agent 实时活动信号。活动信号不是证据。dashboard 被观察且存在 current goal/gap 时，Skill 在开始处理当前缺口前发布 start，长时间工作才 heartbeat，本轮结束发布 finish。Skill 优先使用 `agent_next.dashboard_activity` 里的命令模板；否则 CLI 可以推断唯一当前 goal/gap；无 current 时不绑定 draft 或 setup/init preview，多个 current 时拒绝误绑定并交给 doctor 恢复。
- 上下文导出仅为其他审查和报告工具提供当前的契约画像、状态数据和 `agent_next` 路由面，审查工具不可反向干预代理的自治运行。
- 已完成的目标只返回 `ready_for_next_loop` 路由；下一轮目标由 Skill 基于上下文和用户意图准备成 NoriBrief，再保存为 draft 契约并等待用户确认。

## 开发

```bash
npm test                                                              # 运行 quick 标签的日常 Vitest 子集
npm run test:acceptance                                               # 按领域运行，也可用 architecture/dashboard/docs/evidence/lifecycle/profile/reporting/schema
npm run check                                                         # lint、typecheck、build、quick tests 和 doctor
npm run check:full                                                    # 发布或大改前运行完整门禁
```

修改 packaged Skills 时，还应按
[`docs/skill-evals.md`](docs/skill-evals.md) 运行人工复核场景。它们用于观察真实
agent 行为和摩擦点，不是精确输出单元测试。

## 许可证

GPL-3.0-only
