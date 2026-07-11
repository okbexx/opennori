# Security Policy

## Supported Versions

Security fixes are provided for the latest published minor release and its
current prerelease line.

## Reporting

Report vulnerabilities privately through GitHub Security Advisories for the
`okbexx/opennori` repository. Do not include credentials, private repository
content, host transcripts, or `.opennori/.runtime/` data in a public issue.

OpenNori treats project files, host session history, Git remotes, and command
output as untrusted input. A report should include the affected version,
reproduction boundary, observed impact, and the smallest non-sensitive fixture
that demonstrates the issue.

`opennori task evidence run` starts the requested executable directly without a
shell, but it still runs with the current user's environment, filesystem access,
and permissions. Review each child command rather than approving the OpenNori
prefix broadly. Commands used as Evidence must not print credentials, tokens,
private keys, or other secrets because captured stdout and stderr become durable
project state.
