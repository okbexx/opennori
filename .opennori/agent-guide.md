# OpenNori Agent Guide

Before implementing a non-trivial OpenNori acceptance gap, read:

- `.opennori/active/*.acceptance.md`
- `.opennori/architecture/baseline.md`
- `.opennori/architecture/baseline.json` when structured data is needed

Follow the Architecture Baseline while completing Product AC.
If the baseline conflicts with project evidence, create an Architecture Challenge and ask for confirmation.
Do not silently replace technology stack, directory boundaries, dependency policy, or state model.

Build-vs-buy is required before custom infrastructure work: check current dependencies, standard libraries, official SDKs, mature open-source libraries, and documented reference projects before self-building.
