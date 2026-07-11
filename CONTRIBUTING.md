# Contributing

OpenNori accepts focused changes that preserve one Task lifecycle, one approved
Contract authority, and Evidence-derived completion.

## Development

```bash
npm ci
npm run check
```

Exercise workflow changes in a temporary Git repository. Do not initialize
OpenNori inside this source repository and do not commit `.opennori/` here.

User-visible changes must update the affected CLI output, packaged Skills,
generated workflow template, Plugin metadata, and user documentation together.
State changes require a forward migration, rollback coverage, and Doctor
recovery guidance.

Pull requests should explain the user path, failure behavior, completion proof,
and verification commands. Keep unrelated refactors separate.
