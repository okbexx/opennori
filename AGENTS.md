# AGENTS Project Instructions

## OpenNori

OpenNori is a Plugin-first / Skill-driven / CLI-state-backed acceptance product.
It is one agent capability bundle, not three separate user paths. Keep these
layers separated by responsibility but coupled as one product:

- Codex Plugin / Skills: agent discovery and natural-language routing.
- `opennori` CLI: deterministic state reads/writes and JSON/report output.
- `.opennori/`: project-local contracts, evidence, profiles, architecture, and reports.
- `.opennori/events`, `.opennori/activity`, and `.opennori/snapshots`: local dashboard observation state only.

The user-facing install shape is:

- `npx opennori setup` for first-time machine setup of the complete bundle.
- `opennori init` for project-local `.opennori/` initialization after setup.
- `opennori plugin sync` for local development or recovery when the installed Codex Plugin cache is stale.
- `opennori plugin sync --local --confirm` for applying this source checkout's packaged Skills to the local Codex Plugin cache after a preview.

Do not present manual `codex plugin ...`, `npm install -g ...`, or
`opennori bootstrap` as parallel main user paths. They may exist only as
advanced recovery implementation details behind OpenNori lifecycle commands.

Do not implement project-local Skill copying, Skill Pack install/sync, or `.agents/skills` as product behavior. The product goal is for a user agent to get OpenNori through Codex Plugin/Skill discovery, then use the CLI only as the deterministic state layer. If Plugin discovery, packaged Skills, CLI access, or `.opennori` state is missing, route through doctor/project-health and recover the missing bundle part instead of continuing a half-installed workflow.

Local packaged Skill changes must reach this machine by refreshing the Codex Plugin cache, not by manually copying `plugins/opennori/skills/nori*` into `/Users/jarl/code/jarlone/.agents/skills`, a user project `.agents/skills`, or any other repo-local Skill directory. For source checkout development, preview with `opennori plugin sync --local`, apply with `opennori plugin sync --local --confirm`, then open a new Codex session so the synced Plugin Skills are loaded.

When changing packaged Skill behavior, update the frontmatter `description`,
not only the body. Codex decides whether to load a Skill from
name/description/path before the body exists in context. Critical trigger
language such as autogoal enhanced/self-grill, Acceptance Surface Modeling,
broad UI/CRUD/dashboard AC, AC Review Loop, and architecture/profile/evidence/
reporting bypass boundaries must appear on the relevant entry Skill or child
Skill description.

For agent routing, prefer CLI JSON `data.agent_next` over project-local prose files. `.opennori/agent-guide.md` may summarize project state, but it is not OpenNori's discovery mechanism and must not carry critical Skill behavior.

OpenNori CLI output must distinguish humans from agents: TTY usage without
`--json` should show short summaries for lifecycle, health, status, report,
dashboard, and plugin sync commands; `--json` and non-interactive use keep the
full deterministic payload for agents and automation.

`opennori dashboard` is a local visual observation surface over the acceptance loop. It must not become an agent runtime, process log, chat log, completion authority, or confirmation surface. Do not add dashboard controls that approve AC, confirm Architecture Baselines, waive risks, accept reports, or write Product AC/evidence/profile/architecture/report state. When user input is needed, the dashboard may show what decision is needed and should direct the user back to the agent conversation; the agent records the decision through OpenNori Skills and CLI. `opennori activity` only publishes live agent state for the dashboard; it is not Product AC evidence. When the dashboard is observed and a current goal/gap exists, Skills that draft, change, implement, verify, or record OpenNori state must publish activity: start before work, heartbeat only during longer work, and finish when the turn ends. Skills should prefer `data.agent_next.dashboard_activity` command templates when present, otherwise use low-parameter activity commands and let the CLI infer the unique current goal/gap. If no current goal/gap exists, do not bind activity to drafts or setup/init previews. If `.opennori/current` contains multiple goals, treat that as broken state and route to doctor/project-health instead of guessing.

Before implementing, first inspect OpenNori status and Architecture Requirement:

- `.opennori/current/*.acceptance.md`
- `.opennori/architecture/requirements/*.json` when present
- `opennori status --root . --json` or `opennori architecture show --root . --json`

Do not let CLI or file existence decide whether the goal is non-trivial. The
agent/user must record Architecture Requirement as `required`, `not_required`,
or `waived` with a reason. Only `required` makes Architecture Baseline review a
blocking architecture route. `not_required` returns to Product AC evidence, and
`waived` remains a review risk with a recorded reason.

Before implementing a goal whose Architecture Requirement is `required`, read:

- `.opennori/architecture/baseline.md`
- `.opennori/agent-guide.md`
- `plugins/opennori/skills/nori*/SKILL.md`
- `plugins/opennori/.codex-plugin/plugin.json`
- `.agents/plugins/marketplace.json`

Follow the Architecture Baseline while completing Product AC only when
Architecture Requirement is `required`.
If the baseline conflicts with project evidence, create an Architecture Challenge instead of silently replacing it.
An Architecture Baseline is incomplete if it only states product boundaries,
governance principles, or preferred libraries. For non-trivial implementation it
must also include a concrete Technical Architecture Baseline: runtime topology,
source-of-truth model, module/package boundaries, contract surfaces, data flows,
dependency decisions, reference mappings, and verification.

Keep architecture artifacts in their correct directories. Project Architecture
Profiles belong under `.opennori/architecture/profiles/<id>.json`; confirmed
baselines belong in `.opennori/architecture/baseline.*`; build-vs-buy records
belong under `.opennori/architecture/decisions/`; Architecture Challenges belong
under `.opennori/architecture/challenges/`; and `.opennori/architecture/evidence/`
is reserved only for architecture apply records produced by
`opennori architecture apply`. Do not put profile source JSON, profile drafts,
baseline previews, screenshots, logs, or Product AC evidence in
`.opennori/architecture/evidence/`. If doctor/check reports invalid
architecture evidence, route through `nori-project-health` and clean or replace
the misplaced file instead of continuing in a half-broken architecture state.

OpenNori has exactly one default current goal. Drafts live under `.opennori/drafts/` and are not executable until approved; completed and blocked goals are history. Legacy `.opennori/active/` is recovery input only and must not be used as the normal work context.

OpenNori product changes must preserve the original acceptance loop:

```text
user natural-language goal
  -> OpenNori Skill helps the agent draft and confirm human-centered AC
  -> CLI writes .opennori state and evidence
  -> agent works from current acceptance gaps
  -> user judges completion from status/report
```

Autogoal is only a Skill-driven way to reach the same standard Nori Contract Draft from a rough idea. Do not introduce an Autogoal Contract type or a separate output workflow. Autogoal must preserve the user's full idea, avoid MVP/first-version/prototype/phase/task-list framing, infer reasonable assumptions, ask only completion-changing questions, and then write a normal draft through the existing OpenNori draft state path.

Autogoal enhanced mode is not a CLI mode or new artifact. When the user asks for enhanced autogoal, self-grill, "agent grill yourself", or expects all usage scenarios from a rough idea such as a todolist, `nori-autogoal` must perform Enhanced Discovery first: internally expand scenarios, states, data rules, failures, recovery paths, UX expectations, persistence, review methods, assumptions, and out-of-scope boundaries; then show a compact `Enhanced Discovery checked` section and only critical questions that change completion meaning before producing the standard draft. The brief must persist `acceptance_basis.source = "autogoal"` and `acceptance_basis.mode = "enhanced"` plus `coverage_summary`, assumptions, open questions, and optional out-of-scope boundaries so draft/status/report can show the user this mode was actually used.

Complete product goals need a full acceptance surface by default. When the user asks for a complete product, complete feature loop, full app, full dashboard, full workbench, or explicitly says not MVP, OpenNori Skills must help the agent define enough human-facing AC for the user to judge the complete product closure: roles, entry/navigation, core workflows, state transitions, data rules, permissions and boundaries, failure/recovery, persistence, UI/UX when visible, and review/reporting method. Do not compress these goals into a small starter AC set unless the user explicitly chooses a prototype, MVP, first version, or narrower scope. Execution can still proceed one current gap at a time.

Complete product autogoal must also include coverage self-check before draft approval. Map the product surfaces to planned AC boundaries, then split independent user judgments. If a draft bundles project overview, assets, memory, capabilities, external knowledge, search, audit, UI states, persistence, and recovery into a few broad AC, treat it as a failed draft, not as something to approve. Revise or regenerate it through `nori-acceptance`.

Visible product goals need Acceptance Surface Modeling before draft approval,
confident evidence, or completion reporting. When a goal or AC mentions UI,
CRUD, Dashboard, list, table, form, settings, admin, desktop, CLI prompt, MCP
tool flow, preview, inspector, or a management surface, the responsible Skill
must model the human operation path: actor, entry, visible trigger, object,
action, interaction surface, required information, feedback, state change,
persistence, destructive boundary, and evidence shape. Do not accept "project
CRUD works", "manage items", "settings are editable", or "dashboard shows
state" as one broad outcome AC. Split add/view-select/edit/delete-unlink/
archive/cancel/recover/preview when their entry, control, fields, feedback,
persistence, or destructive boundary differs. Unknown items that change "done"
must become one completion-changing question or an explicit draft assumption
reviewed in the AC Review Loop. Keep this in Skill behavior and user review;
do not implement it as a CLI hard validator, fixed target-type word list, or
implementation plan.

Acceptance Surface Modeling is only successful when it changes the draft AC
text. Do not let agents satisfy the rule by writing a coverage note while the
criteria remain broad. For visible product surfaces, each related criterion
must carry the operation path in its own fields: `user_story` names the user's
role, entry, object, and operation or judgment; `measurement` names the entry,
visible trigger, interaction surface, object/action, and required information
or states; `threshold` names feedback, immediate state change, persistence or
destructive boundary, failure/recovery behavior, and evidence shape. If these
details exist only in agent prose, architecture notes, evidence notes, or a
future implementation plan, route back to `nori-acceptance` before approval,
confident evidence, architecture apply, or completion reporting.

If the user and agent have already discussed a goal, candidate AC, assumptions, or open questions, and the user asks OpenNori to take over that discussion, route to `nori-acceptance`, not `nori-autogoal`. Preserve the discussed material as a standard draft Nori Contract with `acceptance_basis.source: "conversation"`, keep it under `.opennori/drafts/`, and ask the user to approve or revise before implementation or evidence recording.

After any Nori Contract Draft is generated, do not ask for blind approval.
OpenNori Skills must run a one-AC-at-a-time AC Review Loop. Show a compact
contract overview first, then review only the current AC: user entry, user
action or judgment, visible result, non-passing cases, and likely evidence type.
The user confirms or revises that AC before the agent moves to the next one.
Only after every AC has been confirmed one by one should the agent ask for final
`approve`. This explanation must be specific to the AC: name the actual page,
route, command, object, field, state, message, boundary, failure example, and
evidence object where relevant. Generic phrases such as "open the relevant
page", "check the result", "handle failure", or "use a screenshot" are not
enough. This explanation is not an implementation plan, architecture decision,
file list, task list, or evidence claim. If the explanation adds a completion
condition, exposes a mismatch, or cannot be made concrete from the draft, the
agent must revise the AC or assumptions before continuing the review loop.
If the AC Review Loop explanation is more specific than the criterion text,
revise the draft so the new completion semantics are stored in
`user_story`, `measurement`, or `threshold`; do not leave them only in chat.
Revising a draft AC is not approval: use the draft revision path, keep the
acceptance basis as draft, and restart review for the changed AC. Do not let
profile, architecture, implementation, or evidence routing begin until final
approval happens after every AC is confirmed.
If the review loop discovers a missing acceptance boundary, add it with
`opennori criterion add --from-draft --goal <goal-id>` so the draft contract,
ledger, markdown, and manifest stay synchronized. Do not manually patch
`.acceptance.md`, `.evidence.json`, or manifest files for normal draft AC
additions.

Do not turn architecture choices, Skills, technology stacks, hooks, AW exports, or implementation tasks into user AC. They can influence Nori Profile, Architecture Baseline, evidence risk, or recovery guidance, but Product AC must remain human-visible operations or judgments.

For user-visible interface goals, OpenNori Skills must discover UI/UX acceptance, not only functional completion. Pages, apps, dashboards, desktop tools, workbenches, forms, settings screens, and admin consoles need user-facing checks for entry/navigation, information hierarchy, empty/loading/error/success states, operation feedback, readability, visual and interaction consistency, recovery paths, and UI boundaries. Keep this in Skill behavior and user confirmation; do not implement it as a CLI hard validator or fixed word-list test.

Evidence and reporting must preserve the same boundary. If a visible product AC
lacks the modeled operation path, `nori-evidence` should route back to
`nori-acceptance` instead of recording confident passing evidence, and
`nori-reporting` should say "objectively evidenced, not confidently acceptable
yet" when objective evidence exists but the user still cannot judge the actual
entry, trigger, fields, feedback, persistence, destructive boundary, or evidence
shape.

The same boundary applies to every OpenNori Skill, not only acceptance and
evidence. `nori-architecture-brainstorm` must not preview or confirm a baseline
to compensate for vague visible Product AC. `nori-architecture-apply` must not
implement or record apply evidence for broad CRUD/dashboard/settings AC.
`nori-architecture-challenge` must not turn missing user operation-path detail
into an architecture conflict. `nori-build-vs-buy` must not use library choices
to decide product-surface semantics. `nori-capability-profile` must not treat
Skill/stack compliance as proof of user-visible behavior. `nori-project-health`
must report ready state as bundle health only and route broad AC meaning back
to `nori-acceptance`.

Contract language preference is presentation metadata, not Product AC. New
Skill-prepared brainstorms, discoveries, drafts, reports, and next-loop briefs may infer
or explicitly preserve `presentation.language` (`zh-CN` or `en`) for
human-readable surfaces while keeping protocol field names stable English.
Existing current or approved contracts must not be silently translated during
status, report, evidence, or check writes; changing their presentation language
requires explicit revision and user approval.

Keep hard validation and subjective review separate:

- Code may hard-fail objective integrity problems: schema shape, protocol version, required fields, duplicate ids, contract/ledger mismatch, invalid enums, stale managed files, missing local artifacts, or destructive actions without explicit confirmation.
- Code must not hard-fail subjective product judgments such as "this AC feels like implementation detail", "this evidence may be weak", or "this architecture may not be ideal".
- Subjective AC quality belongs primarily in OpenNori Skills and the agent/user conversation, not in CLI validators or brittle unit tests.
- `acceptance_review` may exist as a compatibility/review surface, but do not build product logic that depends on fixed word lists, fixed gap ids, or exact discovery question text.
- The agent decides what AC questions to ask from the user's goal and project context; the user remains the final judge of whether the goal is accepted.

Do not add tests that assert a natural-language AC must trigger a specific
subjective quality gap such as missing fields, implementation detail, broad
overview, project memory, or result-change scope. Tests should verify objective
state behavior: drafts remain drafts until approval, check/report do not mutate
contracts, invalid schemas fail, evidence drives status, and Skills contain the
rules agents must follow.

When changing Skill behavior, update package-local `plugins/opennori/skills/nori*/SKILL.md`, `plugins/opennori/.codex-plugin/plugin.json`, and marketplace metadata first.
Do not add compatibility shims for old `adaw`, `nori`, `opennori skill export`, `install --skill`, or `refresh-skill` entry points.
