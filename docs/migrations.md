# Project State Migrations

OpenNori project state has an integer version in `.opennori/manifest.json`.
Managed templates use the package version; canonical Task, Contract, Evidence,
Spec, journal, and archive data use the state schema version.

## Upgrade Path

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
