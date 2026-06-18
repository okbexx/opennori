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

Do not present manual `codex plugin ...`, `npm install -g ...`, or
`opennori bootstrap` as parallel main user paths. They may exist only as
advanced recovery implementation details behind OpenNori lifecycle commands.

Do not implement project-local Skill copying, Skill Pack install/sync, or `.agents/skills` as product behavior. The product goal is for a user agent to get OpenNori through Codex Plugin/Skill discovery, then use the CLI only as the deterministic state layer. If Plugin discovery, packaged Skills, CLI access, or `.opennori` state is missing, route through doctor/project-health and recover the missing bundle part instead of continuing a half-installed workflow.

For agent routing, prefer CLI JSON `data.agent_next` over project-local prose files. `.opennori/agent-guide.md` may summarize project state, but it is not OpenNori's discovery mechanism and must not carry critical Skill behavior.

OpenNori CLI output must distinguish humans from agents: TTY usage without
`--json` should show short summaries for lifecycle, health, status, report,
dashboard, and plugin sync commands; `--json` and non-interactive use keep the
full deterministic payload for agents and automation.

`opennori dashboard` is a local visual observation surface over the acceptance loop. It must not become an agent runtime, process log, chat log, completion authority, or confirmation surface. Do not add dashboard controls that approve AC, confirm Architecture Baselines, waive risks, accept reports, or write Product AC/evidence/profile/architecture/report state. When user input is needed, the dashboard may show what decision is needed and should direct the user back to the agent conversation; the agent records the decision through OpenNori Skills and CLI. `opennori activity` only publishes live agent state for the dashboard; it is not Product AC evidence. When the dashboard is observed and a current goal/gap exists, Skills that draft, change, implement, verify, or record OpenNori state must publish activity: start before work, heartbeat only during longer work, and finish when the turn ends. Skills should prefer `data.agent_next.dashboard_activity` command templates when present, otherwise use low-parameter activity commands and let the CLI infer the unique current goal/gap. If no current goal/gap exists, do not bind activity to drafts or setup/init previews. If `.opennori/current` contains multiple goals, treat that as broken state and route to doctor/project-health instead of guessing.

Before implementing a non-trivial change, read:

- `.opennori/current/*.acceptance.md`
- `.opennori/architecture/baseline.md`
- `.opennori/agent-guide.md`
- `plugins/opennori/skills/nori*/SKILL.md`
- `plugins/opennori/.codex-plugin/plugin.json`
- `.agents/plugins/marketplace.json`

Follow the Architecture Baseline while completing Product AC.
If the baseline conflicts with project evidence, create an Architecture Challenge instead of silently replacing it.

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

If the user and agent have already discussed a goal, candidate AC, assumptions, or open questions, and the user asks OpenNori to take over that discussion, route to `nori-acceptance`, not `nori-autogoal`. Preserve the discussed material as a standard draft Nori Contract with `acceptance_basis.source: "conversation"`, keep it under `.opennori/drafts/`, and ask the user to approve or revise before implementation or evidence recording.

Do not turn architecture choices, Skills, technology stacks, hooks, AW exports, or implementation tasks into user AC. They can influence Nori Profile, Architecture Baseline, evidence risk, or recovery guidance, but Product AC must remain human-visible operations or judgments.

Contract language preference is presentation metadata, not Product AC. New
brainstorms, discoveries, drafts, reports, and next-loop candidates may infer
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
