# OpenNori Architecture Apply Record

Status: aligned
Goal: opennori-self
Criterion: AC-A-3
Baseline: typescript-agent-state-cli
Accepted at: 2026-06-18T09:43:44.184Z

## Summary

Architecture Profile and Baseline now require concrete technical architecture sections while keeping subjective architecture quality in Skills and user review.

## Fit

The implementation extends Architecture Profile/Baseline as a two-layer model: charter plus technical baseline. Code hard-checks objective section presence, while Skills instruct agents to judge whether the runtime, state, module, contract, flow, dependency, reference, and verification decisions are actually specific enough before user confirmation.

## Implementation Focus

AC-A-3 built-in and project architecture profiles can generate a baseline that affects completion judgment without turning architecture into Product AC.

## Evidence

npm run check passed; OpenNori check/status report architecture valid; Agent Workbench check/status validates a project baseline with nonzero technical section counts.

## Limitations

This proves the protocol, built-in profile, packaged Skill guidance, OpenNori self baseline, and AW baseline structure. It does not prove every future project profile will be high quality; agents and users still must review specificity before confirmation.

## Rule

This record documents architecture alignment for an acceptance gap. It is not Product AC evidence by itself.

