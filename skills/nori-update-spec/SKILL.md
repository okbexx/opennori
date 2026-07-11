---
name: nori-update-spec
description: Promote stable project learning into OpenNori specs. Use during Finish, when a completed task changed durable conventions or boundaries, or when the user explicitly asks to update project knowledge. Distill verified reusable facts into the narrowest relevant spec, maintain spec routing, and keep task history, guesses, and temporary debugging notes out of shared project truth.
---

# OpenNori Update Spec

Keep `.opennori/spec/` useful to future tasks instead of turning it into an
archive of everything that happened.

## Select Learnings

Promote a learning only when it is:

- verified by the completed work or project source
- likely to affect future implementation or verification
- stable beyond the current task
- appropriate for shared project knowledge

Good candidates include package boundaries, durable architecture facts,
project conventions, recurring commands, verified integration behavior, and
important failure constraints.

Do not promote chat summaries, task chronology, temporary debugging steps,
speculation, implementation-only details, or Outcome Evidence that has no
future guidance value.

## Update

1. Read `.opennori/spec/index.md` and the narrowest relevant existing spec.
2. Check the repository source that supports the learning.
3. Update the existing scoped spec when possible; create a new spec only when
   it has a distinct durable audience or package scope.
4. Keep routing in `spec/index.md` accurate.
5. Link to source paths or commands when they make the rule verifiable.
6. Remove or revise stale guidance contradicted by the verified project.

Project specs are human-reviewable Markdown content. Do not create parallel
JSON spec state or a second approval system.

## Finish Handoff

Summarize which specs changed and why. If invoked by `nori-finish`, return to it
after the update so the journal and task archive can complete.
