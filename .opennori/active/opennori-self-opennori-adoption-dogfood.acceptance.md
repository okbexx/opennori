# opennori-self-opennori-adoption-dogfood Acceptance Contract

## Goal

Run OpenNori through a non-OpenNori project and capture the adoption friction.

## Acceptance Basis

Status: draft
Summary: Draft generated from a completed goal candidate. User must approve or revise it before it becomes the next Nori Contract.

## Nori Profile

<none>

## User Acceptance Criteria

| ID | Layer | User acceptance criterion | Measurement | Passing threshold | Status |
| --- | --- | --- | --- | --- | --- |
| AC-1 | acceptance | As a user, I can start OpenNori in a non-OpenNori project from natural language and see a draft Nori Contract. | 用户在一个非 OpenNori 仓库中用自然语言要求 agent 使用 OpenNori，然后查看 agent 展示的 draft Nori Contract。 | draft 包含该项目目标、人类视角 AC、acceptance basis 和当前 approval 缺口；用户不需要记住 --from-next-candidate、--root 或内部 Skill 名。 | unknown |
| AC-2 | acceptance | As a user, I can review the final report and understand goal status, current gap, evidence, and any review risks. | 用户让 agent 在该非 OpenNori 项目推进到 status/report，并阅读报告顶部的完成判断、当前缺口、证据和风险。 | 报告清楚显示 goal、decision、current gap、evidence、review risks 和是否需要用户介入；用户能判断是否完成或该补什么。 | unknown |
| AC-3 | acceptance | As a user, I can identify the first point where the OpenNori loop felt unclear, repetitive, or too CLI-heavy. | 用户或评审者记录本次外部项目使用中首次卡住、重复、CLI 过重或半安装的点，并在证据或报告中复查。 | 证据或报告明确列出至少一个真实摩擦点，或说明未发现明显摩擦；不会把 OpenNori 自身通过状态当作外部采用证明。 | unknown |

## Rule

Progress is determined by acceptance evidence, not by implementation steps.
