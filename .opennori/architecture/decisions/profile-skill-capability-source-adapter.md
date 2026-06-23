# profile-skill-capability-source-adapter Build-vs-Buy Decision

Area: profile-skill-capability
Need: Check Project Profile Skill requirements against Codex Plugin packaged Skills, Codex Plugin cache, and local user Skills without turning profile checks into a second Skill discovery system.
Recommendation: self-build
Status: active



## Summary

Use a narrow filesystem adapter for installed Skill asset discovery. It searches package-local OpenNori skills, Codex Plugin cache skills, and user-local Skill directories, then profile checks consume only the adapter result.

## Candidates Checked

- Current project: OpenNori already treats Codex Plugin packaged Skills as the primary distribution path, exposes package skills through src/skills.ts, and uses Project Profile checks as deterministic completion-risk evidence. Existing profile-checks.ts only probes ~/.agents/skills and ~/.codex/skills, which misses the current Plugin cache source used by Codex.
- Standard library: Node fs/path are sufficient for local Skill asset existence checks and recursive cache traversal. No parser is needed because profile check only needs SKILL.md presence as objective evidence.
- Official SDK: No stable in-process Codex Plugin Skill discovery SDK is available in this project boundary; Codex discovers Skills from installed Plugin cache, but OpenNori should not shell out to Codex for every profile check.
- Open source: Generic glob libraries could scan files, but Node recursive traversal is enough for a bounded local cache adapter. Reusing OpenNori package Skill metadata covers package-local assets.

## Self-build Reason

Self-build is limited to capability-source probing and source reporting. It does not implement Codex Skill selection, Plugin installation, agent routing, or subjective profile compliance; those remain Codex/Skills and user review responsibilities.
