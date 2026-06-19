import { slugify } from "./core/shared.ts";
import { inferContractLanguage, normalizeContractLanguage, type PresentationLanguage } from "./language.ts";
import type {
  AcceptanceDiscovery,
  AcceptanceDiscoveryGap,
  AcceptanceQualityAudit,
  Brainstorm,
  BrainstormCandidate,
  NoriBrief
} from "./types.ts";

const GENERATED_BY_SKILL_SUMMARY = "Draft generated from a Skill-prepared brief. User must approve or revise it before implementation.";

function hasChineseText(text: unknown): boolean {
  return inferContractLanguage(text) === "zh-CN";
}

function normalizeLanguage(languageInput: unknown, text: unknown): PresentationLanguage {
  return normalizeContractLanguage(languageInput, hasChineseText(text) ? "zh-CN" : "en");
}

function parseJsonArg<T>(value: unknown, label: string): T {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${label} is required`);
  }
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(`${label} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeGap(input: Partial<AcceptanceDiscoveryGap>, index: number): AcceptanceDiscoveryGap {
  const question = String(input.question || "").trim();
  const why = String(input.why || "").trim();
  if (!question) throw new Error(`Discovery gap ${index + 1} is missing question`);
  if (!why) throw new Error(`Discovery gap ${index + 1} is missing why`);
  return {
    id: String(input.id || `gap-${index + 1}`).trim(),
    question,
    why,
    priority: input.priority || "must-answer"
  };
}

function normalizeCandidate(input: Partial<BrainstormCandidate>, index: number): BrainstormCandidate {
  const title = String(input.title || "").trim();
  const userValue = String(input.user_value || "").trim();
  if (!title) throw new Error(`Brainstorm candidate ${index + 1} is missing title`);
  if (!userValue) throw new Error(`Brainstorm candidate ${index + 1} is missing user_value`);
  return {
    id: String(input.id || String.fromCharCode(65 + index)).trim(),
    title,
    user_value: userValue,
    suggested_goal_template: String(input.suggested_goal_template || input.title || "").trim(),
    acceptance_directions: Array.isArray(input.acceptance_directions)
      ? input.acceptance_directions.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    risks: Array.isArray(input.risks)
      ? input.risks.map((item) => String(item || "").trim()).filter(Boolean)
      : []
  };
}

export function reviewAcceptanceQuality(_contract: unknown): AcceptanceQualityAudit {
  return {
    status: "clear",
    summary: "Subjective acceptance quality is reviewed by OpenNori Skills and the user; CLI checks only report objective contract state.",
    findings: []
  };
}

export const auditAcceptanceQuality = reviewAcceptanceQuality;

export function discoveryFromSkillInput(input: {
  goal: string;
  id?: string;
  language?: unknown;
  gaps?: Array<Partial<AcceptanceDiscoveryGap>>;
  status?: AcceptanceDiscovery["status"];
  next?: string;
}): AcceptanceDiscovery {
  const goal = String(input.goal || "").trim();
  if (!goal) throw new Error("Discovery goal is required");
  const gaps = (input.gaps || []).map((gap, index) => normalizeGap(gap, index));
  const language = normalizeLanguage(input.language, goal);
  return {
    protocol_version: "opennori/discovery-v1",
    id: input.id || slugify(goal.slice(0, 40) || "acceptance-discovery"),
    goal,
    presentation: { language },
    status: input.status || (gaps.length > 0 ? "needs-user-answers" : "ready-for-draft"),
    is_acceptance_contract: false,
    gaps,
    next: input.next || "Use OpenNori Skills to ask only completion-changing questions, then create a Skill-prepared NoriBrief with opennori draft --brief."
  };
}

export function discoveryFromJsonArg(value: unknown, fallback: { goal?: string; id?: string; language?: unknown } = {}): AcceptanceDiscovery {
  const input = parseJsonArg<Record<string, unknown>>(value, "--questions");
  const presentation = objectValue(input.presentation);
  return discoveryFromSkillInput({
    goal: String(input.goal || fallback.goal || ""),
    id: String(input.id || fallback.id || "") || undefined,
    language: input.language || presentation.language || fallback.language,
    gaps: Array.isArray(input.gaps) ? input.gaps as Array<Partial<AcceptanceDiscoveryGap>> : [],
    status: input.status as AcceptanceDiscovery["status"] | undefined,
    next: typeof input.next === "string" ? input.next : undefined
  });
}

export function brainstormFromSkillInput(input: {
  idea: string;
  id?: string;
  language?: unknown;
  candidates?: Array<Partial<BrainstormCandidate>>;
  rule?: string;
}): Brainstorm {
  const idea = String(input.idea || "").trim();
  if (!idea) throw new Error("Brainstorm idea is required");
  const candidates = (input.candidates || []).map((candidate, index) => normalizeCandidate(candidate, index));
  const language = normalizeLanguage(input.language, idea);
  const defaultRule = language === "zh-CN"
    ? "Brainstorm 输出是由 Skill 准备的 draft 来源；它不是计划、Nori Contract 或完成证据。"
    : "Brainstorm output is a Skill-prepared draft source. It is not a plan, a Nori Contract, or completion evidence.";
  return {
    protocol_version: "opennori/brainstorm-v1",
    id: input.id || slugify(idea.slice(0, 40) || "brainstorm"),
    idea,
    presentation: { language },
    status: "draft-source",
    candidates,
    rule: input.rule || defaultRule
  };
}

export function brainstormFromJsonArg(value: unknown, fallback: { idea?: string; id?: string; language?: unknown } = {}): Brainstorm {
  const input = parseJsonArg<Record<string, unknown>>(value, "--candidates");
  const presentation = objectValue(input.presentation);
  return brainstormFromSkillInput({
    idea: String(input.idea || fallback.idea || ""),
    id: String(input.id || fallback.id || "") || undefined,
    language: input.language || presentation.language || fallback.language,
    candidates: Array.isArray(input.candidates) ? input.candidates as Array<Partial<BrainstormCandidate>> : [],
    rule: typeof input.rule === "string" ? input.rule : undefined
  });
}

export function briefFromSkillPreparedBrief(input: NoriBrief, languageInput: unknown = undefined): NoriBrief {
  const goal = String(input.goal || "").trim();
  if (!goal) throw new Error("Brief goal is required");
  if (!Array.isArray(input.criteria) || input.criteria.length === 0) {
    throw new Error("Skill-prepared brief must include at least one acceptance criterion");
  }
  const language = normalizeContractLanguage(languageInput, normalizeContractLanguage(input.presentation?.language, inferContractLanguage(goal)));
  return {
    ...input,
    goal,
    presentation: {
      ...(input.presentation || {}),
      language
    },
    acceptance_basis: {
      status: "draft",
      summary: GENERATED_BY_SKILL_SUMMARY,
      ...(input.acceptance_basis || {})
    }
  };
}

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
