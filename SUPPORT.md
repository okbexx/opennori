# Support

Use GitHub Issues for reproducible bugs and focused product requests. Include the
OpenNori version, Node version, platform adapter, smallest safe reproduction,
expected result, actual result, and the relevant structured error code.

Use GitHub Discussions for workflow questions and design proposals that are not
yet actionable defects. Security issues belong in private GitHub Security
Advisories as described in `SECURITY.md`.

Before reporting installation or upgrade failures, run:

```bash
opennori doctor --json
opennori update --dry-run --json
```

Remove credentials, private repository content, host transcripts, absolute home
paths, and `.opennori/.runtime/` data before sharing output.
