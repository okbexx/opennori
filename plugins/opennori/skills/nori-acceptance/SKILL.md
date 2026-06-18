---
name: nori-acceptance
description: Discover, draft, approve, and revise human-centered OpenNori acceptance criteria from natural-language goals, fuzzy ideas, brainstorm candidates, or user corrections. Use when completion meaning is unclear, AC quality is being discussed, or candidate goals need to become a Nori Contract.
---

## Mission

Help the agent and user define what "done" means from the human user's point of view.

Good AC says what entry the user uses, what operation or judgment they perform, what result they see, and how they can decide it is acceptable. It does not describe the agent's implementation path.

When the root `nori` Skill or CLI JSON reports `data.agent_next.state: initialized_no_active_contract`, treat that as the normal starting point for this Skill. The project is ready; it needs a human-centered Nori Contract, not lifecycle repair. If the user already stated a goal earlier in the same conversation, use that goal instead of asking them to repeat it.

## Start Here

1. Read current OpenNori state with doctor/list/resume/status when a goal may already exist, and follow `data.agent_next` when present.
2. If `agent_next.state` is `initialized_no_active_contract`, use the user's natural-language goal from the current conversation when present; ask for the goal only when it is missing; then begin discovery/draft.
3. If the user is still exploring an idea, create brainstorm candidates before drafting a contract.
4. If the user has a goal but the completion surface is vague, run discovery before draft.
5. If a draft or current contract exists, inspect `acceptance_review` before claiming the AC is good enough.
6. If `acceptance_review` reports `criterion_id: ACCEPTANCE-BASIS`, show those discovery questions before asking for approval; the draft is still a generic starting point.
7. If `agent_next.state` is `completion_needs_review` and `agent_next.recommended_skill` is `nori-acceptance`, treat existing passing evidence as provisional: show the concrete `acceptance_review.findings`, ask only the missing questions that affect user judgment, then revise criteria or record explicit user-approved assumptions. Do not ask the user to simply accept risk before making the missing acceptance surface understandable.
8. If the user has approved or revised AC, persist that decision before implementation continues.
9. After `opennori approve`, read the returned `data.agent_next`. If it says `architecture_needs_review`, hand off to `nori-architecture-brainstorm` before implementation or evidence work.
10. If `agent_next.state` is `ready_for_next_loop` and the user asked to continue, select or refine one `agent_next.candidate_goals` item, then create a draft from it; prefer the candidate's `draft_args` or `draft_command` when present instead of reconstructing CLI flags. Do not ask the user to invent the next prompt from scratch. After drafting, show concrete measurement and passing thresholds for approval; do not show a candidate-direction wrapper as if it were enough.
11. If a dashboard is being watched or `agent_next.dashboard_activity` is present and a current goal/gap exists, publish live acceptance activity while drafting or revising: start before acceptance work, heartbeat only during longer work, and finish when the turn ends. Prefer the returned command template; otherwise use `opennori activity start --root <repo> --skill nori-acceptance --state thinking --summary "..." --json` and let the CLI infer the unique current goal/gap.
12. Preserve the user's Contract language preference. Infer it from the goal and conversation by default; if the user explicitly asks for Chinese, Simplified Chinese, English, or similar wording, pass `--language zh-CN` or `--language en` to brainstorm/discover/draft. Do not ask the user to remember this CLI flag.
13. Do not silently translate an already approved or current Nori Contract. If the user explicitly asks to change its presentation language, revise the visible contract as needed and record the user's approval with `opennori approve --no-from-draft --language zh-CN|en --summary "<approval>" --root <repo> --json`.

Useful state commands:

- `opennori brainstorm --idea "<idea>" --root <repo> --json`
- `opennori discover --goal "<goal>" --root <repo> --json`
- `opennori draft --from-discovery <id> --answers <answers.json> --root <repo> --json`
- `opennori draft --goal "<goal>" --root <repo> --json`
- `opennori draft --from-brainstorm <id> --candidate <candidate> --root <repo> --json`
- `opennori draft --from-next-candidate <candidate-id> --source-goal <completed-goal-id> --root <repo> --json`
- `opennori approve --root <repo> --summary "<approval>" --json`
- `opennori approve --no-from-draft --language zh-CN|en --root <repo> --summary "<approval>" --json`
- `opennori criterion update --root <repo> --criterion <id> --user-story "..." --measurement "..." --threshold "..." --json`
- `opennori activity start|heartbeat|finish --root <repo> --skill nori-acceptance --state thinking --summary "..." --json` (required dashboard signal when the dashboard is observed and a current goal/gap exists)

## Natural-Language Mapping

- "I want to build X" -> discover missing acceptance details, then draft Product AC.
- "Use Chinese AC", "验收标准用中文", "write this contract in English" -> keep the user-visible goal, discovery questions, AC, and next-candidate draft in that language by passing the matching `--language`; protocol field names remain stable English.
- "Change this existing contract to Chinese/English" -> explain that existing approved/current contracts are not silently translated; revise any visible wording that needs translation, then ask for approval and use `approve --no-from-draft --language ...`.
- "Brainstorm this idea" -> produce selectable acceptance directions; ask which direction should become the contract.
- "This AC is too vague" -> ask only questions that change completion judgment.
- User answers discovery questions -> summarize the answers into a JSON object keyed by discovery gap id, run `draft --from-discovery`, then show the concrete Product AC for approval.
- "Approve these AC" -> write approval, read `agent_next`, and route to architecture review, evidence, or reporting from that returned state.
- "Change AC-2 to mean..." -> update that criterion and treat older evidence for it as stale.
- Complete goal with `agent_next.candidate_goals` -> choose or refine the strongest human-facing candidate, use its `draft_args` or `draft_command` when present, then show the draft for user approval with concrete Measure / Passes when text.
- Generic `draft --goal` output with `acceptance_review` findings -> show the missing acceptance questions first; do not ask for blind approval.
- `completion_needs_review` with `recommended_skill: nori-acceptance` -> explain that the contract is objectively evidenced but not confidently acceptable yet; group findings by AC, ask the concrete missing questions, and revise AC before reporting confident completion.

Discovery answer shape for agent-created temporary files:

```json
{
  "missing-user-entry": "...",
  "missing-field-scope": "...",
  "missing-validation-rule": "...",
  "missing-success-signal": "...",
  "missing-persistence-scope": "...",
  "missing-failure-case": "...",
  "missing-out-of-scope-boundary": "...",
  "missing-review-method": "..."
}
```

The user should never need to memorize this structure; the Skill prepares it from the conversation.

Language preference is also prepared by the Skill. If the user writes the goal in one language but answers discovery questions in another, prefer the user's explicit language request; when there is no explicit request, use the language that makes the final AC easiest for the user to review.

## Discovery Questions

Ask questions that affect user acceptance:

- Scope: which user role, screen, command, data object, or workflow is included.
- Operation: what exact user action or judgment happens.
- Field or input rules: editable fields, validation, defaults, limits, and excluded fields.
- Success signal: what the user sees after success.
- Persistence: what should still be true after refresh, restart, rerun, or reopening.
- Failure behavior: what the user sees when the operation cannot complete.
- Boundaries: what is intentionally out of scope.
- Review method: how the user or reviewer can verify the behavior.
- Abstract product surfaces: if an AC says overview, long-term assets, memory, knowledge candidates, capabilities, or result changes, ask what exact visible objects, fields, states, source links, failure states, and boundaries the user must see.

Do not turn these questions into implementation tasks or evidence.

## State Writes

May write brainstorms, draft contracts, approved acceptance basis, and criterion revisions under `.opennori/`. Do not write evidence, profile, architecture decisions, or reports except through the responsible Skill.

Must write live dashboard activity while acceptance work is happening and the dashboard is observed with a current goal/gap. Activity is not a Nori Contract, not approval, and not completion evidence.

## Handoffs

- After AC approval for non-trivial work, hand off to `nori-architecture-brainstorm`.
- After implementation needs evidence, hand off to `nori-evidence`.
- If the user states required Skills, stacks, or avoided tools while defining AC, hand off that part to `nori-capability-profile`.
- If `acceptance_review` remains after required AC are objectively passing, stay in `nori-acceptance` while the user is clarifying or revising AC. Hand off to `nori-reporting` only after the user explicitly accepts the remaining review risk or the AC findings are resolved.

## User Reply Shape

Show the draft as a compact list of user-facing checks:

```text
Goal: ...
Acceptance checks:
- AC-1: As a user, ...
  Measure: ...
  Passes when: ...
Open questions:
- ...
```

Ask for approval or specific revision. Do not include implementation steps unless the user explicitly asks for implementation detail.

Match the reply language to the Nori Contract presentation language when it is known. For `presentation.language: zh-CN`, show `目标`, `验收标准`, `衡量方式`, and `通过条件` in Chinese; for `en`, use the English shape above.

## Misuse Guards

- Do not accept generic criteria such as "modify fields" or "show an error" until field scope, validation, success, persistence, failure, and review method are clear enough for the user to judge.
- Do not accept abstract criteria such as "overall situation", "long-term assets", "project memory", "knowledge candidates", "capabilities", or "result changes" until the exact visible objects, states, source links, failure/recovery behavior, and boundaries are clear enough for the user to judge.
- Do not make tests, modules, files, commands, Skills, libraries, architecture, or build-vs-buy decisions into Product AC.
- Do not treat brainstorm output, discovery questions, candidate goals, or agent assumptions as a Nori Contract.
- Do not accept a draft from a candidate if its measurement or threshold only says to follow the candidate direction; revise it into user actions, visible results, report/evidence review, or friction judgment before asking for approval.
- Do not use `draft --from-next-candidate` unless the source goal is already `ready-for-next-loop`; if the command returns completion or evidence review risk, handle that risk before continuing.
- Do not claim completion from AC quality alone; completion still requires reviewable evidence.
- Do not treat dashboard activity, events, or snapshots as acceptance approval or evidence.
- Do not silently translate an already approved or current Nori Contract. Revise and ask for approval if the user wants the contract presentation language changed.
