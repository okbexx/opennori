# Project State Migrations

OpenNori project state has an integer version in `.opennori/manifest.json`.
Managed templates use the package version; canonical Task, Contract, Evidence,
Spec, journal, and archive data use the state schema version.

## Published 0.1.30 Foundation Upgrade

The published `opennori@0.1.30` package used a different project foundation.
After installing the current host package, migrate that project through the
normal initialization entry:

```bash
npx opennori setup
opennori init --user <name> --dry-run
opennori init --user <name> --confirm
opennori doctor
```

The preview identifies the old manifest, shows the complete `.opennori` backup
target, and lists removal of unmodified project-local generated hooks. Hook
cleanup requires the ownership hash recorded by the old manifest; a missing
hash or local edit blocks migration and leaves the file unchanged.

Confirmation copies the complete old `.opennori` tree to a timestamped sibling
before replacing it. Historical goals, evidence, reports, preferences, and
other user content remain byte-for-byte available in that backup instead of
being guessed into the current Task model. If any later write fails, the old
tree, external generated hooks, host files, and file modes are restored. A
fresh preview can then be confirmed again.

Release checks use a sanitized offline fixture captured from the published
package shape and pin npm integrity
`sha512-O2tqCgAKORiK9iG0koDmBqA900Jjg2zfZ3W4lNGfN82bQ4kXwgRZJlpLMvyOY76IOc347nYI288F4n3ycvRxkg==`.
The test suite therefore does not contact npm.

## Current Foundation Upgrade Path

```bash
npx opennori setup
opennori update --dry-run
opennori update --confirm
opennori doctor
```

The preview lists every state migration and managed asset change. Confirmation
first migrates canonical state under the project lock, then refreshes managed
assets. A successful state migration is retained if a later managed asset has a
review conflict; rerunning the same update converges from that partial success.

Each state migration validates all inputs before writing, snapshots every
canonical file it will change, writes atomically, updates the manifest last, and
restores the original bytes and file modes if any migration step fails.

An older CLI never downgrades a project created by a newer state schema. Doctor
keeps the state readable, reports the supported CLI version boundary, and
requires installation of a project-compatible OpenNori version.

## Schema 1 To 2

Schema 2 adds the Git delivery boundary:

- active tasks require a delivery plan before implementation can continue
- Finish requires delivery bound to the current implementation revision
- completed and archived schema 1 tasks remain readable without manufactured
  historical delivery data or retroactive Git finalization

No Contract, Evidence, Spec, journal, research, or archive content is discarded.

## Build-vs-Buy

Need: migrate a repository-owned file tree and generated host hooks across the
published foundation boundary with preview, ownership checks, rollback, and
recovery.

Current project: the lifecycle engine already provides managed asset ownership,
atomic writes, tree hashing, exclusive project locks, byte snapshots, rollback,
and Doctor checks. Ajv validates current canonical schemas.

User references: the published `opennori@0.1.30` tarball and a project created by
its real `init --confirm` path.

TK references: managed installer research confirms that content hashes,
previewed destructive actions, protected project data, and manifest-bound
cleanup are the relevant safety boundaries.

Official SDK / standard library: Node.js `fs`, `crypto`, and path primitives
cover the bounded local file transaction; no remote service protocol is
involved.

Mature OSS: general migration runners primarily sequence database or application
migrations. They do not replace OpenNori's project-root path safety, managed
section ownership, or canonical Task schema validation.

Decision: adapt the existing lifecycle and Doctor implementation. Keep Ajv,
the existing lock adapter, and atomic I/O rather than adding a second migration
framework.

Risk: a historical generated file without matching ownership proof may contain
user changes. Such a file blocks migration and is never deleted automatically.

Verification: the pinned offline fixture covers side-effect-free preview,
ownership-gated hook cleanup, injected mid-migration rollback, byte and mode
restoration, retry convergence, backup preservation, and Doctor recovery.
