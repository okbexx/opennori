# OpenNori Skill Dogfood Evals

These evals are human-review scenarios for OpenNori packaged Skills. They are
not automated natural-language tests, not CLI validators, and not exact-answer
fixtures.

Use them when changing packaged Skills, autogoal behavior, Acceptance Surface
Modeling, AC Review Loop wording, Project Profile routing, architecture
handoffs, evidence confidence, reporting, or dashboard activity guidance.

## What This Evaluates

The evaluator checks whether an agent using OpenNori Skills:

- keeps the user focused on goal, AC, evidence, and completion judgment.
- produces a normal Nori Contract Draft, not a special workflow artifact.
- preserves complete product closure instead of downgrading to MVP or first
  version.
- writes concrete user operation paths into each relevant AC instead of hiding
  them in coverage notes or chat explanations.
- starts the one-AC-at-a-time AC Review Loop before final approval.
- keeps Project Profile, Architecture Baseline, build-vs-buy, evidence,
  dashboard, and MCP separate from Product AC.
- asks only completion-changing questions, or records explicit assumptions for
  the user to review.
- reports friction honestly instead of turning a rough draft into passing
  evidence.

## What This Does Not Evaluate

Do not use these scenarios as hard-coded assertions. They must not become:

- exact output snapshots.
- a list of words every Skill body must contain.
- tests that a prompt must produce a specific AC id, question, or sentence.
- evidence that a real product goal is complete.
- a substitute for the user's AC confirmation.

Automated tests may verify that this file exists and that packaged Skills have
frontmatter descriptions and required protocol sections. They should not grade
the subjective quality of the agent's generated AC.

## Run Protocol

1. Update the local OpenNori Plugin cache when testing local Skill changes:

   ```bash
   opennori plugin sync --local
   opennori plugin sync --local --confirm
   ```

2. Open a new Codex session so Skill discovery reloads packaged Skills.
3. In a non-OpenNori or scratch project, run `opennori init` if project state
   does not exist.
4. Paste one eval prompt into the agent conversation.
5. Record what the agent produced and where it got stuck:
   - draft path, if one was written.
   - whether `Enhanced Discovery checked` appeared when required.
   - whether `acceptance_basis.source` and `mode` were correct.
   - whether AC operation paths live in `user_story`, `measurement`, and
     `threshold`.
   - whether the agent started AC Review Loop with only the current AC.
   - whether architecture/profile/build-vs-buy stayed separate from Product AC.
   - first friction point: confusing instruction, repeated question, CLI-heavy
     output, missing Skill routing, weak AC, or hidden assumption.
6. Do not mark the scenario passing just because a draft file exists. The
   evaluator should be able to understand what the user can open, do, see, and
   judge.

## Rubric

Use this lightweight rubric after each scenario:

```text
Scenario:
Project:
Agent:
OpenNori version:
Plugin cache version:

Outcome:
- no draft / draft created / draft revised / approved / blocked

Strong signals:
- ...

Friction:
- ...

Acceptance issues:
- missing operation path:
- bundled unrelated surfaces:
- hidden assumption:
- generic AC interpretation:
- profile/architecture mistaken as Product AC:

Next OpenNori change:
- Skill wording / docs / CLI state surface / dashboard observation / no change
```

## Scenario 1: Enhanced Autogoal Todolist

Prompt:

```text
Use OpenNori autogoal enhanced mode.
Self-grill this rough idea before drafting AC:
I want a todolist app that actually feels complete for a personal user.
Do not give me an MVP or first version.
```

Expected user-visible behavior:

- The agent uses `nori-autogoal`, not a new CLI command or special autogoal
  artifact.
- The visible reply includes `Enhanced Discovery checked`.
- The draft basis records `source: autogoal`, `mode: enhanced`, coverage,
  assumptions, open questions, and out-of-scope boundaries.
- The draft covers task creation, list visibility, editing, completion,
  filtering or state views, invalid input, delete/recovery or destructive
  boundary, refresh/reopen persistence, empty/loading/error/success states,
  readable UI feedback, and explicit decisions around due dates/tags/priorities
  or sync.
- The agent asks only questions that change completion meaning.
- The agent starts AC Review Loop with AC-1 only, not a batch approval request.

Failure signals:

- The agent says "MVP", "first version", "prototype", phases, roadmap, or task
  plan as the final artifact.
- The draft contains a few broad AC such as "users can manage tasks" without
  entry, trigger, fields, feedback, persistence, and evidence shape.
- `Enhanced Discovery checked` appears only in chat while draft metadata lacks
  enhanced source/mode.

## Scenario 2: Project CRUD Operation Paths

Prompt:

```text
Use OpenNori for project CRUD in this workbench.
The user needs to add projects, select them, update project metadata, and remove
projects from the workbench when needed.
Before drafting, make sure the AC describe the actual user operation paths.
```

Expected user-visible behavior:

- The agent routes to `nori-acceptance` or uses autogoal only if the user asked
  for rough-idea convergence.
- It does not create one AC that says "project CRUD works" or "users can manage
  projects".
- It separates add, view/select, edit, and delete/unlink/archive when their
  controls, fields, persistence, or destructive boundaries differ.
- Each related AC names user entry, visible trigger, interaction surface,
  object/action, required fields or state labels, feedback, state change,
  persistence, destructive boundary, failure/recovery behavior, and evidence
  shape.
- Unknown completion-changing choices become one sharp question or explicit
  draft assumption, for example directory picker vs manual path, delete local
  directory vs unlink from registry, or required metadata fields.

Failure signals:

- Controls such as icon vs text button, modal vs system picker, or delete vs
  unlink are decided as hidden implementation assumptions.
- Operation path details only appear in the agent's explanation, not in
  `measurement` and `threshold`.
- Architecture/profile/build-vs-buy is used to compensate for vague Product AC.

## Scenario 3: Complete Project Workbench

Prompt:

```text
Use OpenNori autogoal enhanced mode:
This goal is a complete product.
Users should use AW to see every project's situation.
A project includes Markdown documents and many HTML prototypes. AW can preview
them, not edit them.
AW should understand project state and expose Skills, CLI, and MCP capabilities
for Codex to operate the project.
Each project needs memory. Look at the TK project for architecture ideas.
AW should connect to external knowledge bases. AW does not write knowledge by
itself; it tells Codex what Skill/CLI/MCP context to use.
Use a bright, high-contrast UI, prefer existing component libraries, and avoid
duplicate CSS.
The current implementation can be replaced if the TK-derived architecture and
the product logic require it.
```

Expected user-visible behavior:

- The draft does not compress the complete product into a small AC set.
- The agent first performs coverage self-check and maps separate surfaces:
  project list/switching, overview, Markdown asset list/detail/preview, HTML
  prototype list/detail/preview, read-only boundary, source/version/audit,
  memory, external knowledge candidates, Skills/CLI/MCP capability status,
  Codex context export, search/index state, timeline/audit, security boundary,
  persistence, failure recovery, UI/UX states, and final review/report.
- Stack preferences and "prefer existing component libraries / avoid duplicate
  CSS" become Project Profile or Architecture inputs, not Product AC.
- TK reference and build-vs-buy shape Architecture Baseline after Product AC
  approval; they do not replace user-facing AC.
- The agent starts one-AC-at-a-time review with concrete interpretation for
  AC-1.

Failure signals:

- AC count is small because the agent made an MVP or "first slice" contract.
- "Project overview", "assets", "memory", "knowledge", "capabilities", and
  "agent results" are bundled into one or two generic AC.
- UI/UX is missing or only says "looks good".
- Architecture decisions are presented as user Product AC.

## Scenario 4: Existing AC Adoption

Prompt:

```text
Use OpenNori to take over the AC we just discussed.
Turn the existing goal, candidate AC, assumptions, and open questions into a
Nori Contract Draft.
Do not autogoal from scratch.
Do not start implementation.
Start by confirming AC-1 with me.
```

Expected user-visible behavior:

- The agent uses `nori-acceptance`, not `nori-autogoal`.
- The draft basis records `source: conversation`.
- The result stays draft-only until user approval.
- No passing evidence, architecture baseline, or implementation activity is
  recorded from the conversation itself.
- The agent shows a compact overview, then reviews only AC-1 with concrete
  interpretation and asks for `confirm AC-1` or `revise AC-1: ...`.

Failure signals:

- The agent restarts discovery as if no discussion happened.
- The agent asks for blind approval after dumping every AC interpretation.
- The agent treats the prior discussion as evidence.

## Scenario 5: Evidence And Reporting Boundary

Prompt:

```text
This draft says "users can manage projects" and I have a screenshot that shows a
project table. Use OpenNori to record it as passing evidence and tell me whether
the goal is complete.
```

Expected user-visible behavior:

- The agent should not record confident passing evidence if the AC lacks
  operation path details.
- It should route to `nori-acceptance` and explain the missing acceptance
  surface: add/select/edit/delete entry, trigger, fields, feedback,
  persistence, destructive boundary, and evidence shape.
- If evidence is recorded as weak or provisional, reporting should say
  objectively evidenced but not confidently acceptable yet.

Failure signals:

- A screenshot plus broad AC becomes confident completion.
- Reporting hides the missing operation path behind "done".
- Dashboard activity, events, or snapshots are cited as Product AC evidence.

## Scenario 6: Project Profile And Architecture Separation

Prompt:

```text
For this UI goal, require design-taste-frontend first, prefer Radix UI, avoid
adding another UI framework, and use a TK-derived architecture. Also define the
user-facing AC.
```

Expected user-visible behavior:

- The agent records Skill/stack/tool constraints as Project Profile.
- Architecture preference routes to Architecture Requirement / Baseline after
  Product AC approval, or asks the user to confirm architecture first when that
  is the user's intent.
- Product AC still describes user entry, operation, visible result, feedback,
  persistence, failure/recovery, and evidence shape.
- The agent does not write "uses Radix UI" or "uses design-taste-frontend" as a
  user acceptance check.

Failure signals:

- Skill availability or stack compliance is treated as proof that the product
  behavior is complete.
- Architecture baseline becomes a work plan or Product AC list.
- Build-vs-buy is skipped before custom infrastructure.

