# Release Process

Releases are explicit and immutable. Daily development and `opennori update`
never publish packages or create repository releases.

## Prerequisites

1. Configure the `npm` GitHub environment with required reviewers.
2. Configure npm trusted publishing for `okbexx/opennori` and the
   `.github/workflows/publish.yml` workflow.
3. Confirm the package, Plugin, and marketplace versions are identical.

## Release

```bash
npm ci
npm run release:check
git status --short
```

Update `CHANGELOG.md`, commit the release version, then publish a GitHub Release
whose tag is exactly `v<package-version>`. The release workflow reruns the full
check and publishes with npm provenance. A tag/version mismatch fails before
publication. SemVer prereleases publish to `alpha`, `beta`, or `next`; only a
stable version can update npm's `latest` tag.

After publication, verify the public package metadata, install the exact version
into an isolated npm prefix, run setup, initialize a temporary Git repository,
and exercise Plan, Implement, Verify, delivery, Finish, update, Doctor, and
uninstall.

Published versions are not overwritten. For a bad release, deprecate the
affected version with a recovery message, publish a corrected version, and add
the incident and migration guidance to the changelog.
