# opennori-build-vs-buy-maturity Brainstorm

## Idea

OpenNori 自身要把成熟开源库 / 官方 SDK 优先的 build-vs-buy 习惯产品化，并用它修正 OpenNori 的 CLI、schema、Markdown、installer 等通用基础设施边界

## Rule

This is a draft source, not a Nori Contract or completion evidence.

## Candidates

### A. 目标澄清型

User value: 用户能把模糊想法收敛成一个明确目标和少量可观察验收方向。

Acceptance directions:
- 作为用户，我能在候选方向中看出每个方向解决的用户价值。
- 作为用户，我能选择一个方向进入 OpenNori draft，或要求改写方向。
- 作为用户，我能判断候选方向没有要求我阅读技术说明。

Risks:
- 目标仍然太泛，无法生成可验收 AC。

### B. 方案取舍型

User value: 用户能比较几种产品形态，并选择哪一种进入正式验收。

Acceptance directions:
- 作为用户，我能看到每个方向对应的使用入口和判断方式。
- 作为用户，我能比较方向之间的取舍，而不是阅读实现计划。
- 作为用户，我能选择一个方向作为正式 OpenNori draft 的来源。

Risks:
- 候选项可能变成技术方案比较，需要退回用户价值和验收方式。

### C. 风险识别型

User value: 用户能先看见哪些验收点需要强证据、人工确认或外部条件。

Acceptance directions:
- 作为用户，我能看到哪些方向需要更强证据才能说完成。
- 作为用户，我能知道哪些风险需要人工确认或外部条件。
- 作为用户，我能决定先验证风险还是直接进入 draft。

Risks:
- 风险讨论可能扩散成过程计划，需要保持在完成判断和证据强度上。

## Next

User chooses a candidate or revises one before OpenNori draft.
