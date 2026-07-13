# Changelog

OpenNori follows Semantic Versioning. Until `1.0.0`, minor releases may change
public workflow or API contracts and must include a documented migration path.

## 0.2.0 - 2026-07-13

### Added

- Shell-free command Evidence execution with exact argv, cwd, exit code, stdout,
  stderr, timeout, output, and implementation-revision guards.
- Compact status JSON and selective, byte-budgeted context loading.
- Chinese human reports and journal labels for Chinese-language tasks.
- Git delivery planning and verification for commits and pull requests.
- Explicit, provenance-bearing delivery waivers for non-Git outcomes.
- State schema migration previews, rollback-safe application, and Doctor
  guidance.
- A supported ESM API from the `opennori` package.
- Stable `opennori/task`, `opennori/project`, `opennori/memory`, and
  `opennori/testing` entrypoints, including a schema-checked integration test
  kit.
- CI and provenance-bearing npm release automation.
- A fresh Codex Verify reviewer by default, with a recursion guard, an explicit
  same-agent fallback when unavailable, and a sequential Claude Code path.
- Offline release acceptance for projects created by the published
  `opennori@0.1.30` foundation.
- Preview-first `opennori platform add <platform>` support so an initialized
  project can use Codex and Claude Code without replacing either adapter.
- A user-scoped Claude Code Plugin and marketplace with SessionStart,
  UserPromptSubmit, and SubagentStart context hooks.

### Changed

- `contract.md` is now the complete human approval surface and is shared as a
  directly openable host-native file reference. Its body stays out of chat
  unless the user requests it or the host cannot open the file; a summary never
  substitutes for reviewing the document.
- Contract approval and Git delivery decisions are separate. Optional
  `design.md` and `plan.md` keep technical reasoning and execution progress
  human-readable without becoming canonical state or approval gates.
- Implement and Verify context manifests are optional loading hints and no
  longer block task start. Host-native workers are used directly without an
  additional OpenNori state layer.
- Initialized projects now expose OpenNori automatically in new agent
  conversations and require explicit user consent before creating a task.
- Status and Hook routing read host session pointers without taking write locks,
  so task-creation consent also works in read-only and Plan host modes.
- Doctor recovery can rebuild an archived task's `contract.md` projection
  without changing its completed canonical Contract.
- Claude Code project initialization now keeps Skills and Hooks in the host
  Plugin; managed update removes the previous project-local Skill copies.
- Task archive is the only Finish-time developer journal write path.
- Local checkout builds preserve the CLI executable bit for npm development installs.
- Finish now requires current-revision Outcome Evidence and a verified delivery.
- New tasks use state schema 2 and task schema `opennori/task-v2`.
- Human status, Doctor, Finish, archive, and final delivery output now leads
  with the agreed result, current gap, Git delivery, and next action.
- The Citty CLI composition root is split into domain command modules without
  changing command paths or JSON contracts.

### Fixed

- Public package and Plugin metadata links to the deployed OpenNori site.
- Codex setup reads the exact npm Plugin version from marketplace source
  metadata and honors an explicit `min-release-age-exclude=opennori` exception
  without relaxing the release-age policy for other packages.

### Migration

- Existing state schema 1 projects must preview `opennori update --dry-run` and
  apply the reviewed migration with `opennori update --confirm`.
- Existing completed tasks remain readable without retroactive delivery data.
- Existing active tasks require a delivery plan before implementation resumes.
- Projects created by `opennori@0.1.30` must preview and confirm the normal
  `opennori init` path. The old `.opennori` tree is preserved in a timestamped
  backup, and locally modified legacy hooks block cleanup instead of being
  overwritten.
