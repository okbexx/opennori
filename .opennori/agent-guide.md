# OpenNori Agent Guide

This project uses OpenNori state under `.opennori/`.
Empty state directories are normal immediately after `opennori init`; they mean no Nori Contract has been started yet.

When the user gives a goal:

- If `.opennori/active/*.acceptance.md` is missing, do not implement yet. Use OpenNori to discover and draft a human-centered Nori Contract, then ask the user to confirm the acceptance checks.
- If an active Nori Contract exists, read `.opennori/active/*.acceptance.md` and the matching evidence JSON, resume the current acceptance gap, and work only toward reviewable evidence for that gap.
- Answer completion questions from OpenNori status/report: goal, current gap, evidence, user intervention, decision, and next action.

Architecture guidance:

- Read `.opennori/architecture/baseline.md` and `.opennori/architecture/baseline.json` only when they exist or when non-trivial work needs a confirmed Architecture Baseline.
- If non-trivial implementation has no confirmed baseline, establish one with the user before implementation instead of inventing stack or directory decisions silently.
- If the baseline conflicts with project evidence, create an Architecture Challenge and ask for confirmation.
- Do not silently replace technology stack, directory boundaries, dependency policy, or state model.

Build-vs-buy is required before custom infrastructure work: check current dependencies, standard libraries, official SDKs, mature open-source libraries, and documented reference projects before self-building.
