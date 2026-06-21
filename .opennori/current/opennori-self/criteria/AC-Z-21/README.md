# AC-Z-21 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: productization
Status: passing
Confidence: verified
Required: yes
Risk: medium

## Criterion

User story: 作为用户，我对 agent 说“验收标准用中文”或“write this contract in English”后，能在 agent 展示的发现问题、Nori Contract、status/report 摘要和下一轮候选目标中看到我要求的语言；如果我已经有一份批准过的契约，OpenNori 不会在我未确认时把它改成另一种语言。

Measurement: 在对话或命令输出中分别生成中文和英文的 brainstorm、discover、draft、status/report/next-candidate 内容；再用一个已有 current contract 做普通证据写入和显式语言确认，观察可读契约标题、字段说明和报告/候选目标语言变化。

Passing threshold: 新目标的可读内容按用户要求显示中文或英文；用户不需要记忆底层参数；旧 contract 在普通 status/report/check/evidence 写入后仍保持原展示语言；只有用户明确批准改变展示语言后，后续契约和报告才显示新语言；底层协议字段保持稳定，不影响 agent 继续读取状态。

## Evidence

Latest: project-profile-language-boundary-review - OpenNori preserves language preference across user-reviewable contract assets and Project Profile prose: packaged Skills route wrong-language Project Profile and project Architecture Profile content back to profile/architecture Skills; stable ids and protocol fields remain English, and CLI does not auto-translate existing approved contracts without explicit user-approved revision.
Result: passing
Basis: tool-observation
Reviewability: Inspect packaged Skills, README, protocol, and .opennori/profile/README.md. Confirm language preference is handled in Skill/user-review behavior, Project Profile user-readable prose is treated as project-level content, and protocol field names remain stable English.
Limitations: This verifies product rules and current assets. It does not implement CLI auto-translation, by design; wrong-language prose is corrected through Skill-driven revision and user confirmation.

Sources:
- plugins/opennori/skills/nori/SKILL.md
- plugins/opennori/skills/nori-acceptance/SKILL.md
- plugins/opennori/skills/nori-autogoal/SKILL.md
- plugins/opennori/skills/nori-capability-profile/SKILL.md
- README.md
- .opennori/protocol.md

## Files

- Criterion source: criteria/AC-Z-21/criterion.json
- Status projection: criteria/AC-Z-21/status.json
- Evidence ledger: criteria/AC-Z-21/evidence
- Artifacts: criteria/AC-Z-21/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
