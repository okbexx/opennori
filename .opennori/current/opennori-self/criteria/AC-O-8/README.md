# AC-O-8 Acceptance Dossier

Goal: 让 OpenNori 从只保存目标、AC、证据、报告的验收工具，升级为能先确立 Architecture Baseline，并让 agent 在后续实现 AC 时持续沿用该技术架构的验收驱动产品；用户不仅能判断产品目标是否完成，也能判断交付物是否按确认过的优秀技术架构完成。
Layer: operator
Status: passing
Confidence: verified
Required: yes
Risk: high

## Criterion

User story: 作为用户，我在 Codex 对话里声明必须使用某个 Skill、偏好某个技术栈或避免某个工具后，agent 能记录这些偏好并在完成前告诉我是否遵守。

Measurement: 在 Codex 对话中提出能力偏好后，查看 active contract、status 或 report 中的 Nori Profile。

Passing threshold: 用户不需要记住 CLI；must 或 avoid 的违反会阻止 complete，prefer 会被展示但不阻止 complete；这些偏好不会被写成用户 AC。

## Evidence

Latest: review-result - Nori Profile now separates blocking compliance from review risk: must/violated avoid still block, while unknown or violated prefer items surface as profile_review and make objective completion review-risk rather than confidently complete.
Result: passing
Basis: tool-observation
Reviewability: Run the targeted profile/completion tests and inspect profileCompliance, completionAnswer, check output, and the new preferred-profile regression.
Limitations: This verifies local CLI semantics; agent/user still decides whether a preference risk should be accepted, waived, or resolved.

Sources:
- npx vitest run test/core.test.js -t 'profile|completion-review|required skills'
- npm run typecheck

## Files

- Criterion source: criteria/AC-O-8/criterion.json
- Status projection: criteria/AC-O-8/status.json
- Evidence ledger: criteria/AC-O-8/evidence
- Artifacts: criteria/AC-O-8/artifacts

This README is generated for review. The criterion JSON and evidence records are the structured state.
