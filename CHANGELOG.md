# Changelog

OpenNori follows Semantic Versioning. Until `1.0.0`, minor releases may change
public workflow or API contracts and must include a documented migration path.

## Unreleased

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
- A fresh Codex Verify reviewer by default, with a recursion guard and an
  explicit sequential Claude Code path.
- Offline release acceptance for projects created by the published
  `opennori@0.1.30` foundation.

### Changed

- Task archive is the only Finish-time developer journal write path.
- Local checkout builds preserve the CLI executable bit for npm development installs.
- Finish now requires current-revision Outcome Evidence and a verified delivery.
- New tasks use state schema 2 and task schema `opennori/task-v2`.
- Human status, Doctor, Finish, archive, and final delivery output now leads
  with the agreed result, current gap, Git delivery, and next action.
- The Citty CLI composition root is split into domain command modules without
  changing command paths or JSON contracts.

### Migration

- Existing state schema 1 projects must preview `opennori update --dry-run` and
  apply the reviewed migration with `opennori update --confirm`.
- Existing completed tasks remain readable without retroactive delivery data.
- Existing active tasks require a delivery plan before implementation resumes.
- Projects created by `opennori@0.1.30` must preview and confirm the normal
  `opennori init` path. The old `.opennori` tree is preserved in a timestamped
  backup, and locally modified legacy hooks block cleanup instead of being
  overwritten.
