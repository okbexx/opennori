import { inferContractLanguage, normalizeContractLanguage } from "./language.ts";
import type { AcceptanceDiscovery, Brainstorm } from "./types/acceptance.ts";

export function renderDiscoveryMarkdown(discovery: AcceptanceDiscovery): string {
  const language = normalizeContractLanguage(discovery.presentation?.language, inferContractLanguage(discovery.goal));
  const zh = language === "zh-CN";
  const lines = [
    `# ${discovery.id} ${zh ? "验收发现" : "Acceptance Discovery"}`,
    "",
    `## ${zh ? "目标" : "Goal"}`,
    "",
    discovery.goal,
    "",
    `## ${zh ? "表达偏好" : "Presentation"}`,
    "",
    `${zh ? "语言" : "Language"}: ${language}`,
    "",
    `## ${zh ? "规则" : "Rule"}`,
    "",
    zh
      ? "这是由 Skill 准备的验收问题来源，不是 Nori Contract、过程计划或完成证据。CLI 只保存它，不判断问题是否充分。"
      : "This is a Skill-prepared acceptance question source, not a Nori Contract, process plan, or completion evidence. The CLI stores it without judging question quality.",
    "",
    `## ${zh ? "验收问题" : "Acceptance Questions"}`,
    ""
  ];

  if (discovery.gaps.length === 0) {
    lines.push(zh ? "<无。Skill 仍需决定是否可以起草 brief。>" : "<none. The Skill still decides whether drafting is ready.>", "");
  }
  for (const gap of discovery.gaps) {
    lines.push(
      `### ${gap.id}`,
      "",
      `${zh ? "优先级" : "Priority"}: ${gap.priority || "must-answer"}`,
      "",
      `${zh ? "问题" : "Question"}: ${gap.question}`,
      "",
      `${zh ? "为什么重要" : "Why it matters"}: ${gap.why}`,
      ""
    );
  }

  lines.push(`## ${zh ? "下一步" : "Next"}`, "", discovery.next);
  return `${lines.join("\n")}\n`;
}

export function renderBrainstormMarkdown(brainstorm: Brainstorm): string {
  const language = normalizeContractLanguage(brainstorm.presentation?.language, inferContractLanguage(brainstorm.idea));
  const zh = language === "zh-CN";
  const lines = [
    `# ${brainstorm.id} ${zh ? "头脑风暴" : "Brainstorm"}`,
    "",
    `## ${zh ? "想法" : "Idea"}`,
    "",
    brainstorm.idea,
    "",
    `## ${zh ? "表达偏好" : "Presentation"}`,
    "",
    `${zh ? "语言" : "Language"}: ${language}`,
    "",
    `## ${zh ? "规则" : "Rule"}`,
    "",
    brainstorm.rule,
    "",
    `## ${zh ? "候选方向" : "Candidates"}`,
    ""
  ];

  if (brainstorm.candidates.length === 0) {
    lines.push(zh ? "<无。Skill 应准备候选方向后再保存。>" : "<none. The Skill should prepare candidates before storing this source.>", "");
  }
  for (const candidate of brainstorm.candidates) {
    lines.push(
      `### ${candidate.id}. ${candidate.title}`,
      "",
      `${zh ? "用户价值" : "User value"}: ${candidate.user_value}`,
      "",
      `${zh ? "建议目标来源" : "Suggested goal source"}: ${candidate.suggested_goal_template || "<none>"}`,
      "",
      `${zh ? "验收方向" : "Acceptance directions"}:`,
      ...(candidate.acceptance_directions.length > 0 ? candidate.acceptance_directions.map((direction: string) => `- ${direction}`) : ["- <none>"]),
      "",
      `${zh ? "风险" : "Risks"}:`,
      ...(candidate.risks.length > 0 ? candidate.risks.map((risk: string) => `- ${risk}`) : ["- <none>"]),
      ""
    );
  }

  lines.push(
    `## ${zh ? "下一步" : "Next"}`,
    "",
    zh
      ? "agent 根据用户选择或修改后的方向准备 NoriBrief，并用 opennori draft --brief 保存标准草稿。"
      : "The agent prepares a NoriBrief from the user's selected or revised direction, then stores the standard draft with opennori draft --brief."
  );
  return `${lines.join("\n")}\n`;
}
