import { slugify } from "./core/shared.ts";
import { inferContractLanguage, normalizeContractLanguage, type PresentationLanguage } from "./language.ts";
import type {
  AcceptanceCriterion,
  AcceptanceDiscovery,
  AcceptanceDiscoveryAnswers,
  AcceptanceDiscoveryGap,
  AcceptanceQualityAudit,
  AcceptanceQualityFinding,
  Brainstorm,
  BrainstormCandidate,
  NoriBrief,
  NoriContract,
  NextGoalCandidate
} from "./types.ts";

const BRAINSTORM_CANDIDATES: BrainstormCandidate[] = [
  {
    id: "A",
    title: "目标澄清型",
    user_value: "用户能把模糊想法收敛成一个明确目标和少量可观察验收方向。",
    suggested_goal_template: "让用户从模糊想法中选择一个明确、可验收的目标。",
    acceptance_directions: [
      "作为用户，我能在候选方向中看出每个方向解决的用户价值。",
      "作为用户，我能选择一个方向进入 OpenNori draft，或要求改写方向。",
      "作为用户，我能判断候选方向没有要求我阅读技术说明。"
    ],
    risks: ["目标仍然太泛，无法生成可验收 AC。"]
  },
  {
    id: "B",
    title: "方案取舍型",
    user_value: "用户能比较几种产品形态，并选择哪一种进入正式验收。",
    suggested_goal_template: "让用户比较多个可验收产品形态，并选择一个进入执行。",
    acceptance_directions: [
      "作为用户，我能看到每个方向对应的使用入口和判断方式。",
      "作为用户，我能比较方向之间的取舍，而不是阅读实现计划。",
      "作为用户，我能选择一个方向作为正式 OpenNori draft 的来源。"
    ],
    risks: ["候选项可能变成技术方案比较，需要退回用户价值和验收方式。"]
  },
  {
    id: "C",
    title: "风险识别型",
    user_value: "用户能先看见哪些验收点需要强证据、人工确认或外部条件。",
    suggested_goal_template: "让用户识别完成判断中的高风险验收点。",
    acceptance_directions: [
      "作为用户，我能看到哪些方向需要更强证据才能说完成。",
      "作为用户，我能知道哪些风险需要人工确认或外部条件。",
      "作为用户，我能决定先验证风险还是直接进入 draft。"
    ],
    risks: ["风险讨论可能扩散成过程计划，需要保持在完成判断和证据强度上。"]
  }
];

const BRAINSTORM_CANDIDATES_EN: BrainstormCandidate[] = [
  {
    id: "A",
    title: "Goal clarification",
    user_value: "The user can turn a fuzzy idea into a clear goal and a few observable acceptance directions.",
    suggested_goal_template: "Help the user choose a clear, human-acceptable goal from a fuzzy idea.",
    acceptance_directions: [
      "As a user, I can see the user value behind each candidate direction.",
      "As a user, I can choose one direction for an OpenNori draft or ask the agent to revise it.",
      "As a user, I can tell the candidate direction does not require me to read implementation notes."
    ],
    risks: ["The goal may still be too broad to become reviewable acceptance criteria."]
  },
  {
    id: "B",
    title: "Product-shape tradeoff",
    user_value: "The user can compare several product shapes and choose which one should become the formal acceptance target.",
    suggested_goal_template: "Help the user compare several human-acceptable product shapes and choose one for execution.",
    acceptance_directions: [
      "As a user, I can see the user entrypoint and judgment method for each direction.",
      "As a user, I can compare tradeoffs between directions instead of reading an implementation plan.",
      "As a user, I can choose one direction as the source for the formal OpenNori draft."
    ],
    risks: ["The comparison can drift into technical solution review and must return to user value and acceptance."]
  },
  {
    id: "C",
    title: "Risk discovery",
    user_value: "The user can see which acceptance points need stronger evidence, human confirmation, or external conditions.",
    suggested_goal_template: "Help the user identify high-risk completion checks before drafting the contract.",
    acceptance_directions: [
      "As a user, I can see which directions need stronger evidence before completion can be accepted.",
      "As a user, I can tell which risks need human confirmation or external conditions.",
      "As a user, I can decide whether to verify the risk first or move into a draft."
    ],
    risks: ["Risk discussion can expand into a process plan; keep it centered on completion judgment and evidence strength."]
  }
];

export const DEFAULT_CRITERIA: AcceptanceCriterion[] = [
  {
    id: "AC-1",
    user_story: "作为用户，我使用目标系统完成核心操作后，能判断目标结果是否已经达成。",
    measurement: "用户执行核心操作并查看结果。",
    threshold: "结果能被用户直接判断为达成或未达成；不需要阅读实现说明。",
    risk: "medium"
  },
  {
    id: "AC-2",
    user_story: "作为用户，我查看结果状态后，能知道还缺什么或我需要做什么。",
    measurement: "用户查看状态、报告或界面反馈。",
    threshold: "反馈说明当前缺口或人类动作，不把过程步骤当作完成依据。",
    risk: "medium"
  },
  {
    id: "AC-3",
    user_story: "作为用户，我重新打开项目或会话后，能继续从同一个验收状态推进。",
    measurement: "用户恢复任务并查看当前验收状态。",
    threshold: "恢复信息包含目标、当前状态、当前缺口和可继续的入口。",
    risk: "high"
  }
];

export const DEFAULT_CRITERIA_EN: AcceptanceCriterion[] = [
  {
    id: "AC-1",
    user_story: "As a user, I can complete the core operation in the target system and judge whether the goal outcome was achieved.",
    measurement: "The user performs the core operation and reviews the resulting state, screen, report, or artifact.",
    threshold: "The outcome can be judged directly as achieved or not achieved without reading implementation notes.",
    risk: "medium"
  },
  {
    id: "AC-2",
    user_story: "As a user, I can review the result state and understand what is missing or what I need to do next.",
    measurement: "The user opens the status, report, screen feedback, or equivalent review surface.",
    threshold: "The feedback explains the current gap or required human action, and does not treat process steps as completion evidence.",
    risk: "medium"
  },
  {
    id: "AC-3",
    user_story: "As a user, I can reopen the project or session and continue from the same acceptance state.",
    measurement: "The user resumes the work and reviews the current acceptance state.",
    threshold: "The resumed state includes the goal, workflow state, current gap, and a clear continuation entrypoint.",
    risk: "high"
  }
];

const DISCOVERY_GAPS: AcceptanceDiscoveryGap[] = [
  {
    id: "missing-user-entry",
    patterns: ["设置", "资料", "个人资料", "profile", "settings", "字段", "field", "使用", "打开", "查看", "进入", "run", "open", "view", "use", "entry"],
    question: "用户从哪个入口开始操作，最终在哪里查看结果？",
    why: "没有用户入口，AC 容易变成内部状态而不是可执行验收。"
  },
  {
    id: "missing-field-scope",
    patterns: ["设置", "资料", "个人资料", "profile", "settings", "字段", "field"],
    question: "本轮用户可以修改或查看哪些具体字段？哪些字段明确不在范围内？",
    why: "没有字段范围，用户无法判断修改能力是否完整。"
  },
  {
    id: "missing-validation-rule",
    patterns: ["修改", "输入", "保存", "上传", "表单", "edit", "input", "save", "upload", "form"],
    question: "每个可输入内容的有效规则是什么，例如长度、必填、格式、文件类型或大小？",
    why: "没有校验规则，失败和边界输入无法验收。"
  },
  {
    id: "missing-success-signal",
    patterns: ["保存", "提交", "创建", "更新", "完成", "save", "submit", "create", "update"],
    question: "操作成功后，用户会看到什么明确反馈或结果变化？",
    why: "没有成功反馈，用户无法判断操作是否真的完成。"
  },
  {
    id: "missing-persistence-scope",
    patterns: ["保存", "刷新", "重新打开", "重新登录", "持久", "save", "refresh", "reload", "reopen", "login", "persist"],
    question: "结果需要在刷新、重新打开、重新登录或跨设备后仍然存在吗？",
    why: "没有持久化范围，完成判断会在当前页面和真实保存之间摇摆。"
  },
  {
    id: "missing-failure-case",
    patterns: ["失败", "错误", "提示", "网络", "权限", "error", "fail", "failure", "invalid", "permission", "network"],
    question: "哪些失败情况必须覆盖，用户分别应该看到什么提示或保留什么原状态？",
    why: "没有失败场景，错误体验可能被一句“有提示”掩盖。"
  },
  {
    id: "missing-out-of-scope-boundary",
    patterns: ["页面", "页", "设置", "功能", "支持", "完成", "page", "feature", "support", "complete"],
    question: "哪些相关能力明确不属于本轮完成范围？",
    why: "没有范围边界，agent 可能扩大实现，也可能漏掉用户真正期待的部分。"
  },
  {
    id: "missing-review-method",
    patterns: ["设置", "资料", "个人资料", "profile", "settings", "字段", "field", "判断", "验收", "完成", "review", "accept", "done", "complete"],
    question: "用户或评审者应该用什么可复查方式判断这条 AC 通过？",
    why: "没有复查方式，完成判断会退化成 agent 自我总结。"
  }
];

const DISCOVERY_GAPS_EN: AcceptanceDiscoveryGap[] = [
  {
    id: "missing-user-entry",
    patterns: ["设置", "资料", "个人资料", "profile", "settings", "字段", "field", "使用", "打开", "查看", "进入", "run", "open", "view", "use", "entry"],
    question: "Where does the user start, and where do they review the final result?",
    why: "Without a user entrypoint, acceptance can drift into internal state instead of a reviewable user action."
  },
  {
    id: "missing-field-scope",
    patterns: ["设置", "资料", "个人资料", "profile", "settings", "字段", "field"],
    question: "Which exact fields can the user change or review in this goal, and which fields are explicitly out of scope?",
    why: "Without field scope, the user cannot judge whether the editing capability is complete."
  },
  {
    id: "missing-validation-rule",
    patterns: ["修改", "输入", "保存", "上传", "表单", "edit", "input", "save", "upload", "form"],
    question: "What values are valid for each input, such as length, required status, format, file type, or size?",
    why: "Without validation rules, boundary and failure input cannot be accepted with confidence."
  },
  {
    id: "missing-success-signal",
    patterns: ["保存", "提交", "创建", "更新", "完成", "save", "submit", "create", "update"],
    question: "After success, what clear feedback or result change should the user see?",
    why: "Without a success signal, the user cannot judge whether the operation really completed."
  },
  {
    id: "missing-persistence-scope",
    patterns: ["保存", "刷新", "重新打开", "重新登录", "持久", "save", "refresh", "reload", "reopen", "login", "persist"],
    question: "Should the result still exist after refresh, reopen, relogin, or use on another device?",
    why: "Without persistence scope, completion is ambiguous between current-screen state and durable saved state."
  },
  {
    id: "missing-failure-case",
    patterns: ["失败", "错误", "提示", "网络", "权限", "error", "fail", "failure", "invalid", "permission", "network"],
    question: "Which failure cases must be covered, and what message or preserved state should the user see?",
    why: "Without concrete failure scenarios, a vague error message can hide unacceptable behavior."
  },
  {
    id: "missing-out-of-scope-boundary",
    patterns: ["页面", "页", "设置", "功能", "支持", "完成", "page", "feature", "support", "complete"],
    question: "Which related capabilities are intentionally out of scope for this goal?",
    why: "Without scope boundaries, the agent may overbuild or miss what the user actually expects."
  },
  {
    id: "missing-review-method",
    patterns: ["设置", "资料", "个人资料", "profile", "settings", "字段", "field", "判断", "验收", "完成", "review", "accept", "done", "complete"],
    question: "What reviewable method should the user or reviewer use to decide whether this AC passes?",
    why: "Without a review method, completion can collapse into agent self-summary."
  }
];

const USER_OPERATION_TERMS = [
  "运行",
  "打开",
  "查看",
  "选择",
  "阅读",
  "询问",
  "确认",
  "比较",
  "检查",
  "审查",
  "预览",
  "安装",
  "卸载",
  "归档",
  "添加",
  "修改",
  "提出",
  "触发",
  "执行",
  "创建",
  "run",
  "open",
  "view",
  "select",
  "read",
  "ask",
  "confirm",
  "compare",
  "review",
  "preview",
  "install",
  "uninstall",
  "archive",
  "add",
  "update",
  "check"
];

const USER_OUTCOME_TERMS = [
  "能",
  "看到",
  "显示",
  "输出",
  "返回",
  "包含",
  "结果",
  "状态",
  "缺口",
  "反馈",
  "报告",
  "摘要",
  "入口",
  "建议",
  "知道",
  "判断",
  "确认",
  "区分",
  "理解",
  "提示",
  "展示",
  "保留",
  "标明",
  "说明",
  "指出",
  "回答",
  "可复查",
  "可执行",
  "不需要",
  "不会",
  "不能",
  "不创建",
  "can",
  "see",
  "show",
  "output",
  "include",
  "result",
  "status",
  "gap",
  "report",
  "summary",
  "entry",
  "action",
  "return",
  "understand",
  "decide",
  "confirm",
  "distinguish",
  "explain",
  "answer",
  "review"
];

const IMPLEMENTATION_DETAIL_TERMS = [
  "acceptance.json",
  "evidence.json",
  "plan.md",
  "json",
  "schema",
  "script",
  "file exists",
  "脚本",
  "命令",
  "计划",
  "实现步骤"
];

const IMPLEMENTATION_ONLY_PHRASES = [
  "文件存在",
  "字段存在",
  "命令执行成功",
  "测试通过",
  "用例通过",
  "模块实现",
  "接口实现",
  "函数实现",
  "组件实现",
  "schema 校验通过",
  "json 字段",
  "manifest 字段",
  "file exists",
  "field exists",
  "tests pass",
  "test passes",
  "module implemented",
  "function implemented",
  "schema passes"
];

const NEGATION_TERMS = ["不能", "不应", "不是", "不得", "避免", "cannot", "must not", "should not", "reject"];
const GENERIC_DRAFT_SUMMARY = "Draft generated from generic acceptance discovery. User must answer the open acceptance questions before approval.";
const DISCOVERY_ANSWER_DRAFT_SUMMARY = "Draft generated from reviewed Acceptance Discovery answers. User still needs to approve or revise the Nori Contract before implementation.";
const NEXT_CANDIDATE_DRAFT_SUMMARY = "Draft generated from a completed goal candidate. User must approve or revise it before it becomes the next Nori Contract.";

const GENERIC_DRAFT_SUMMARY_ZH = "从通用验收发现生成的草稿。用户必须先回答开放的验收问题，再批准这份契约。";
const DISCOVERY_ANSWER_DRAFT_SUMMARY_ZH = "从已复查的验收发现答案生成的草稿。用户仍需在实现前批准或修改这份 Nori Contract。";
const NEXT_CANDIDATE_DRAFT_SUMMARY_ZH = "从已完成目标的候选下一轮目标生成的草稿。用户必须批准或修改后，它才能成为下一份 Nori Contract。";

function summaryText(kind: "generic" | "discovery" | "next-candidate", language: unknown): string {
  const normalized = normalizeContractLanguage(language);
  if (normalized === "zh-CN") {
    if (kind === "generic") return GENERIC_DRAFT_SUMMARY_ZH;
    if (kind === "discovery") return DISCOVERY_ANSWER_DRAFT_SUMMARY_ZH;
    return NEXT_CANDIDATE_DRAFT_SUMMARY_ZH;
  }
  if (kind === "generic") return GENERIC_DRAFT_SUMMARY;
  if (kind === "discovery") return DISCOVERY_ANSWER_DRAFT_SUMMARY;
  return NEXT_CANDIDATE_DRAFT_SUMMARY;
}

function defaultCriteriaFor(language: unknown): AcceptanceCriterion[] {
  return normalizeContractLanguage(language) === "zh-CN" ? DEFAULT_CRITERIA : DEFAULT_CRITERIA_EN;
}

function hasChineseText(text: unknown): boolean {
  return inferContractLanguage(text) === "zh-CN";
}

function discoveryCatalogFor(language: unknown): AcceptanceDiscoveryGap[] {
  return normalizeContractLanguage(language) === "zh-CN" ? DISCOVERY_GAPS : DISCOVERY_GAPS_EN;
}

function discoveryFallbackFor(language: unknown): AcceptanceDiscoveryGap {
  return normalizeContractLanguage(language) === "zh-CN"
    ? {
        id: "missing-review-method",
        question: "用户或评审者应该用什么可复查方式判断这个目标完成？",
        why: "OpenNori 需要先知道完成判断方式，才能形成真正可验收的 AC。"
      }
    : {
        id: "missing-review-method",
        question: "What reviewable method should the user or reviewer use to decide whether this goal is complete?",
        why: "OpenNori needs the completion judgment method before it can form human-acceptable AC."
      };
}

const NEXT_CANDIDATE_DRAFT_DETAILS: Record<string, Array<Pick<AcceptanceCriterion, "measurement" | "threshold" | "risk">>> = {
  "opennori-adoption-dogfood": [
    {
      measurement: "用户在一个非 OpenNori 仓库中用自然语言要求 agent 使用 OpenNori，然后查看 agent 展示的 draft Nori Contract。",
      threshold: "draft 包含该项目目标、人类视角 AC、acceptance basis 和当前 approval 缺口；用户不需要记住 --from-next-candidate、--root 或内部 Skill 名。",
      risk: "medium"
    },
    {
      measurement: "用户让 agent 在该非 OpenNori 项目推进到 status/report，并阅读报告顶部的完成判断、当前缺口、证据和风险。",
      threshold: "报告清楚显示 goal、decision、current gap、evidence、review risks 和是否需要用户介入；用户能判断是否完成或该补什么。",
      risk: "medium"
    },
    {
      measurement: "用户或评审者记录本次外部项目使用中首次卡住、重复、CLI 过重或半安装的点，并在证据或报告中复查。",
      threshold: "证据或报告明确列出至少一个真实摩擦点，或说明未发现明显摩擦；不会把 OpenNori 自身通过状态当作外部采用证明。",
      risk: "medium"
    }
  ],
  "real-user-validation": [
    {
      measurement: "用户从目标产品或工具的正常用户入口进入已完成流程，并记录入口路径或可复查证据。",
      threshold: "用户能在不阅读实现说明的情况下到达该流程；入口、前置条件和范围限制在 draft、status 或证据中清楚说明。",
      risk: "medium"
    },
    {
      measurement: "用户按核心操作执行一次完整路径并观察结果、反馈或报告。",
      threshold: "结果符合用户期望；如果依赖外部数据、权限或环境，限制被清楚记录。",
      risk: "medium"
    },
    {
      measurement: "用户或评审者打开最终报告或证据来源，复查真实用户路径如何被检查以及未覆盖什么。",
      threshold: "报告或证据说明检查入口、操作、结果、证据来源和限制；不会只说本地实现或测试已完成。",
      risk: "medium"
    }
  ],
  "failure-and-boundary-coverage": [
    {
      measurement: "用户或评审者触发一个已确认的重要失败场景，并查看用户可见提示、恢复方式或保留状态。",
      threshold: "失败反馈与用户确认的预期一致；用户知道能否重试、如何恢复，以及哪些数据被保留。",
      risk: "high"
    },
    {
      measurement: "用户或评审者复查支持的输入、角色、状态和明确不在范围内的边界。",
      threshold: "报告或界面说明支持范围和排除范围；用户不会把未覆盖边界误认为已完成。",
      risk: "medium"
    },
    {
      measurement: "用户或评审者打开失败/边界证据，而不是只看 happy path 通过摘要。",
      threshold: "证据能复查失败触发方式、用户可见结果、边界说明和限制。",
      risk: "medium"
    }
  ],
  "architecture-adherence": [
    {
      measurement: "用户查看当前 goal 适用的 Architecture Baseline、profile 和状态。",
      threshold: "报告或 status 清楚显示 baseline 是否有效、是否有 open challenge，以及 Product decision 与 Architecture decision 分开呈现。",
      risk: "medium"
    },
    {
      measurement: "用户查看新增或变更基础设施对应的 build-vs-buy 记录。",
      threshold: "记录说明已检查项目现有依赖、标准库、官方 SDK 或成熟开源方案；自研理由可复查。",
      risk: "medium"
    },
    {
      measurement: "当实现证据与 baseline 冲突时，用户查看 Architecture Challenge。",
      threshold: "challenge 说明冲突证据、建议改变、风险和需要用户确认的决策；agent 没有静默替换架构。",
      risk: "medium"
    }
  ],
  "next-loop-usability": [
    {
      measurement: "用户在完成报告、resume、status、next 或 context export 中查看下一轮 candidate_goals。",
      threshold: "候选数量少且每个都有 goal、user_value、acceptance_directions、risks 和 draft metadata；用户能判断哪个值得继续。",
      risk: "low"
    },
    {
      measurement: "用户要求 agent 使用、组合或改写一个 candidate，并查看生成的新 draft Nori Contract。",
      threshold: "新 draft 带有 acceptance basis 和 approval 缺口；用户确认前 candidate 不会被当成已批准 AC 或证据。",
      risk: "medium"
    },
    {
      measurement: "用户复查 candidate 和 draft 的文字呈现。",
      threshold: "candidate 被标明不是 phase、task list 或 completion evidence；agent 不把它们当过程计划执行。",
      risk: "medium"
    }
  ]
};

function sentenceHasSpecifics(text: unknown, terms: string[]): boolean {
  const value = String(text || "").toLowerCase();
  return terms.some((term) => value.includes(term.toLowerCase()));
}

function includesAny(text: unknown, terms: string[]): boolean {
  const value = String(text || "").toLowerCase();
  return terms.some((term) => value.includes(term.toLowerCase()));
}

function looksImplementationOnly(text: unknown): boolean {
  const value = String(text || "");
  if (includesAny(value, NEGATION_TERMS)) return false;
  if (includesAny(value, USER_OPERATION_TERMS) && includesAny(value, USER_OUTCOME_TERMS)) return false;
  return includesAny(value, IMPLEMENTATION_ONLY_PHRASES);
}

export function discoverAcceptanceGaps(
  text: string,
  { fallback = false, allowedIds = null as Set<string> | null, language = undefined as PresentationLanguage | undefined } = {}
): AcceptanceDiscoveryGap[] {
  const lowered = text.toLowerCase();
  const catalog = discoveryCatalogFor(language || (hasChineseText(text) ? "zh-CN" : "en"));
  const profileEditGoal = sentenceHasSpecifics(text, ["设置", "资料", "个人资料", "profile", "settings"]);
  const isMissing = (gapId: string): boolean => {
    if (gapId === "missing-field-scope") return !sentenceHasSpecifics(text, ["昵称", "头像", "简介", "邮箱", "手机号", "字段范围", "field scope", "name", "avatar", "bio", "email", "phone"]);
    if (gapId === "missing-validation-rule") return !sentenceHasSpecifics(text, ["长度", "必填", "格式", "大小", "类型", "字符", "校验规则", "validation", "required", "format", "length", "size", "type"]);
    if (gapId === "missing-success-signal") return !sentenceHasSpecifics(text, ["成功", "保存成功", "成功反馈", "result", "success"]);
    if (gapId === "missing-persistence-scope") return !sentenceHasSpecifics(text, ["刷新", "重新打开", "重新登录", "跨设备", "refresh", "reload", "reopen", "login"]);
    if (gapId === "missing-failure-case") return !sentenceHasSpecifics(text, ["网络", "权限", "无效", "错误码", "保留原", "失败场景", "network", "permission", "invalid"]);
    if (gapId === "missing-out-of-scope-boundary") return !sentenceHasSpecifics(text, ["不在范围", "不包含", "本轮不", "范围边界", "out of scope", "exclude"]);
    if (gapId === "missing-user-entry") return !sentenceHasSpecifics(text, ["导航", "菜单", "账户设置", "个人资料页", "report", "dashboard", "navigation", "menu", "account settings"]);
    if (gapId === "missing-review-method") return !sentenceHasSpecifics(text, ["截图", "浏览器", "报告", "测试", "review", "screenshot", "browser", "report"]);
    return true;
  };
  const gaps = catalog
    .filter((gap) => !allowedIds || allowedIds.has(gap.id))
    .filter((gap) => (gap.patterns || []).some((pattern) => lowered.includes(pattern.toLowerCase())))
    .filter((gap) => isMissing(gap.id));

  if (profileEditGoal) {
    const expected = new Set([
      "missing-user-entry",
      "missing-field-scope",
      "missing-validation-rule",
      "missing-success-signal",
      "missing-persistence-scope",
      "missing-failure-case",
      "missing-out-of-scope-boundary",
      "missing-review-method"
    ]);
    for (const gap of catalog) {
      if (!expected.has(gap.id)) continue;
      if (allowedIds && !allowedIds.has(gap.id)) continue;
      if (!gaps.some((item) => item.id === gap.id)) {
        if (isMissing(gap.id)) gaps.push(gap);
      }
    }
  }

  if (gaps.length > 0 || !fallback) return gaps;
  return [discoveryFallbackFor(language || (hasChineseText(text) ? "zh-CN" : "en"))];
}

function discoveryGap(gapId: string, language: unknown = "zh-CN"): AcceptanceDiscoveryGap | undefined {
  return discoveryCatalogFor(language).find((gap) => gap.id === gapId) || DISCOVERY_GAPS.find((gap) => gap.id === gapId);
}

export function discoverAcceptance(goal: string, explicitId: string | undefined = undefined, languageInput: unknown = undefined): AcceptanceDiscovery {
  const text = String(goal || "").trim();
  const language = normalizeContractLanguage(languageInput, inferContractLanguage(text));
  const selectedGaps = discoverAcceptanceGaps(text, { fallback: true, language });
  const zh = language === "zh-CN";

  return {
    protocol_version: "opennori/discovery-v1",
    id: explicitId || slugify(text.slice(0, 40) || "acceptance-discovery"),
    goal: text,
    presentation: { language },
    status: selectedGaps.length > 0 ? "needs-user-answers" : "ready-for-draft",
    is_acceptance_contract: false,
    gaps: selectedGaps.map((gap, index) => ({
      id: gap.id,
      question: gap.question,
      why: gap.why,
      priority: index < 3 ? "must-answer" : "can-default"
    })),
    next: zh
      ? "先询问 must-answer 问题，再起草 Nori Contract。只有用户接受时才使用假设。"
      : "Ask the must-answer questions before drafting a Nori Contract. Use assumptions only when the user accepts them."
  };
}

export function reviewAcceptanceQuality(contract: NoriContract): AcceptanceQualityAudit {
  const findings: AcceptanceQualityFinding[] = [];
  const genericDraft = contract.acceptance_basis?.status === "draft"
    && [GENERIC_DRAFT_SUMMARY, GENERIC_DRAFT_SUMMARY_ZH].includes(String(contract.acceptance_basis?.summary || ""));
  if (genericDraft) {
    for (const gap of discoverAcceptanceGaps(contract.goal, { fallback: true, language: contract.presentation?.language })) {
      findings.push({
        criterion_id: "ACCEPTANCE-BASIS",
        path: "acceptance_basis",
        gap_id: gap.id,
        question: gap.question,
        why: gap.why,
        message: "This draft was generated from a generic goal and still needs user acceptance discovery before approval.",
        agent_guidance: "Show this question to the user, then revise the Product AC or record an explicit user-approved assumption before implementation.",
        source: "heuristic",
        severity: "needs-user-review"
      });
    }
  }

  for (const [index, criterion] of (contract.criteria || []).entries()) {
    const triggerText = [
      criterion.user_story,
      criterion.threshold
    ].filter(Boolean).join("\n");
    const fullText = [
      criterion.user_story,
      criterion.measurement,
      criterion.threshold
    ].filter(Boolean).join("\n");
    const addFinding = (gapId: string, overrides: Partial<AcceptanceQualityFinding> = {}) => {
      const gap = discoveryGap(gapId, contract.presentation?.language);
      if (!gap) return;
      findings.push({
        criterion_id: criterion.id,
        path: `criteria[${index}]`,
        gap_id: gap.id,
        question: gap.question,
        why: gap.why,
        message: overrides.message || gap.why,
        agent_guidance: overrides.agent_guidance || "Ask the user or record an explicit assumption before treating this criterion as confidently complete.",
        source: "heuristic",
        severity: "needs-user-review",
        ...overrides
      });
    };

    const addCustomFinding = (gapId: string, field: string, question: string, why: string, message: string) => {
      findings.push({
        criterion_id: criterion.id,
        path: `criteria[${index}].${field}`,
        gap_id: gapId,
        question,
        why,
        message,
        agent_guidance: "Use this as a review signal, not a hard rejection. Clarify with the user or rewrite the criterion only after user confirmation.",
        source: "heuristic",
        severity: "needs-user-review"
      });
    };

    const userStory = String(criterion.user_story || "");
    if (userStory && !userStory.startsWith("作为用户") && !userStory.toLowerCase().startsWith("as a user")) {
      addCustomFinding(
        "user-perspective-format",
        "user_story",
        "这条 AC 是否确实从最终用户或评审者的操作/判断出发？",
        "AC 不必机械套用固定句式，但 agent 需要确认它表达的是人类用户可执行的操作或判断。",
        "Acceptance criterion does not use the usual user-perspective wording."
      );
    }

    const implementationTerms = IMPLEMENTATION_DETAIL_TERMS.filter((term) => userStory.toLowerCase().includes(term.toLowerCase()));
    if (implementationTerms.length > 0) {
      addCustomFinding(
        "possible-implementation-detail",
        "user_story",
        "这些技术词是否是用户实际会看到/操作的内容，还是应该移到证据、Profile 或 Architecture Baseline？",
        "技术词可能是产品表面，也可能是实现细节；需要 agent 结合上下文判断，不能由代码直接拒绝。",
        `Acceptance criterion contains possible implementation detail terms: ${implementationTerms.join(", ")}.`
      );
    }

    const measurement = String(criterion.measurement || "");
    if (measurement && !includesAny(measurement, USER_OPERATION_TERMS)) {
      addCustomFinding(
        "measurement-review-method-unclear",
        "measurement",
        "用户或评审者具体通过什么入口、操作或审查动作判断这条 AC？",
        "measurement 缺少明显的用户操作或复查动作，agent 需要确认验收入口，而不是把它当结构错误。",
        "Measurement may not describe a user operation or review action."
      );
    }

    const threshold = String(criterion.threshold || "");
    if (threshold && !includesAny(threshold, USER_OUTCOME_TERMS)) {
      addCustomFinding(
        "threshold-user-outcome-unclear",
        "threshold",
        "通过时用户会看到什么结果、反馈或可作出什么判断？",
        "threshold 缺少明显的用户可观察结果，agent 需要澄清完成判断。",
        "Passing threshold may not describe a user-observable outcome or judgment."
      );
    }

    for (const [field, value] of Object.entries({ measurement, threshold })) {
      if (looksImplementationOnly(value)) {
        addCustomFinding(
          "implementation-only-completion-signal",
          field,
          "这个完成信号如何映射到用户可见结果？如果只是测试、文件或模块状态，应作为 evidence 或 architecture/profile 证据，而不是用户 AC。",
          "实现层信号可以成为证据，但通常不能单独代表用户验收完成。",
          `${field} looks like an implementation-only completion signal.`
        );
      }
    }

    const vagueEditableProfile = sentenceHasSpecifics(triggerText, [
      "修改个人资料",
      "修改资料",
      "修改字段",
      "编辑个人资料",
      "编辑资料",
      "edit profile",
      "update profile",
      "modify fields",
      "edit fields"
    ]);
    if (vagueEditableProfile && !sentenceHasSpecifics(fullText, ["昵称", "头像", "简介", "邮箱", "手机号", "字段范围", "field scope", "name", "avatar", "bio", "email", "phone"])) {
      addFinding("missing-field-scope");
    }
    if (vagueEditableProfile && !sentenceHasSpecifics(fullText, ["长度", "必填", "格式", "大小", "类型", "字符", "校验规则", "validation", "required", "format", "length", "size", "type"])) {
      addFinding("missing-validation-rule");
    }

    const mentionsSave = sentenceHasSpecifics(triggerText, ["保存", "提交", "save", "submit"]);
    if (mentionsSave && !sentenceHasSpecifics(fullText, ["保存成功", "成功反馈", "成功提示", "显示成功", "报告显示", "result", "success"])) {
      addFinding("missing-success-signal");
    }
    if (mentionsSave && !sentenceHasSpecifics(fullText, ["刷新", "重新打开", "重新登录", "跨设备", "refresh", "reload", "reopen", "login"])) {
      addFinding("missing-persistence-scope");
    }

    const vagueFailure = sentenceHasSpecifics(triggerText, [
      "失败时有提示",
      "失败提示",
      "有提示",
      "错误提示",
      "show an error",
      "error message"
    ]);
    if (vagueFailure && !sentenceHasSpecifics(fullText, ["网络", "权限", "无效", "错误码", "保留原", "失败场景", "network", "permission", "invalid"])) {
      addFinding("missing-failure-case");
    }

    const broadSettingsScope = sentenceHasSpecifics(triggerText, ["设置页", "个人资料", "settings page"]);
    if (broadSettingsScope && !sentenceHasSpecifics(fullText, ["不在范围", "不包含", "本轮不", "范围边界", "out of scope", "exclude"])) {
      addFinding("missing-out-of-scope-boundary");
    }
  }

  return {
    status: findings.length > 0 ? "needs-user-review" : "clear",
    summary: findings.length > 0
      ? `${findings.length} acceptance quality gap(s) may need user review.`
      : "No underspecified acceptance gaps found.",
    findings
  };
}

export const auditAcceptanceQuality = reviewAcceptanceQuality;

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
      ? "这是验收发现来源，不是 Nori Contract、过程计划或完成证据。"
      : "This is an acceptance discovery source, not a Nori Contract, process plan, or completion evidence.",
    "",
    `## ${zh ? "验收缺口" : "Acceptance Gaps"}`,
    ""
  ];

  for (const gap of discovery.gaps) {
    lines.push(
      `### ${gap.id}`,
      "",
      `${zh ? "优先级" : "Priority"}: ${gap.priority}`,
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

  for (const candidate of brainstorm.candidates) {
    lines.push(
      `### ${candidate.id}. ${candidate.title}`,
      "",
      `${zh ? "用户价值" : "User value"}: ${candidate.user_value}`,
      "",
      `${zh ? "验收方向" : "Acceptance directions"}:`,
      ...candidate.acceptance_directions.map((direction: string) => `- ${direction}`),
      "",
      `${zh ? "风险" : "Risks"}:`,
      ...candidate.risks.map((risk: string) => `- ${risk}`),
      ""
    );
  }

  lines.push(
    `## ${zh ? "下一步" : "Next"}`,
    "",
    zh
      ? "用户选择一个候选方向或要求修改后，再进入 OpenNori draft。"
      : "User chooses a candidate or revises one before OpenNori draft."
  );
  return `${lines.join("\n")}\n`;
}

export function briefFromGoal(goal: string, goalId: string | undefined = undefined, languageInput: unknown = undefined): NoriBrief {
  const language = normalizeContractLanguage(languageInput, inferContractLanguage(goal));
  return {
    goal_id: goalId || undefined,
    goal,
    presentation: { language },
    acceptance_basis: { status: "draft", summary: summaryText("generic", language) },
    criteria: defaultCriteriaFor(language)
  };
}

function normalizeDiscoveryAnswers(input: AcceptanceDiscoveryAnswers): Record<string, string> {
  const source = input.answers && typeof input.answers === "object" && !Array.isArray(input.answers)
    ? input.answers
    : input;
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (key === "goal" || key === "answers") continue;
    if (value === undefined || value === null) continue;
    const answer = typeof value === "string" ? value.trim() : JSON.stringify(value);
    if (answer) answers[key] = answer;
  }
  return answers;
}

function answerFor(answers: Record<string, string>, id: string, fallback: string): string {
  return answers[id] || fallback;
}

export function briefFromDiscoveryAnswers(
  discovery: AcceptanceDiscovery,
  input: AcceptanceDiscoveryAnswers,
  goalId: string | undefined = undefined,
  languageInput: unknown = undefined
): NoriBrief {
  const answers = normalizeDiscoveryAnswers(input);
  const goal = String(input.goal || discovery.goal || "").trim();
  if (!goal) throw new Error("Discovery goal is required");
  const language = normalizeContractLanguage(languageInput, normalizeContractLanguage(discovery.presentation?.language, inferContractLanguage(goal)));
  const zh = language === "zh-CN";

  const entry = answerFor(answers, "missing-user-entry", zh ? "用户从目标功能的正常入口开始操作，并在同一用户界面查看结果。" : "The user starts from the normal entrypoint for the target feature and reviews the result in the same user-facing surface.");
  const fieldScope = answerFor(answers, "missing-field-scope", zh ? "用户按已确认范围修改本轮包含的字段。" : "The user only changes the fields confirmed as in scope for this goal.");
  const validation = answerFor(answers, "missing-validation-rule", zh ? "输入内容符合用户确认的有效规则。" : "Inputs follow the validity rules confirmed by the user.");
  const success = answerFor(answers, "missing-success-signal", zh ? "操作成功后用户看到明确成功反馈和更新后的结果。" : "After success, the user sees clear success feedback and the updated result.");
  const persistence = answerFor(answers, "missing-persistence-scope", zh ? "刷新或重新打开后，用户仍能看到保存后的结果。" : "After refresh or reopen, the user still sees the saved result.");
  const failure = answerFor(answers, "missing-failure-case", zh ? "失败时用户看到明确提示，并能判断原状态或输入是否被保留。" : "On failure, the user sees a clear message and can tell whether the previous state or their input was preserved.");
  const boundary = answerFor(answers, "missing-out-of-scope-boundary", zh ? "相关但未确认的能力不属于本轮完成范围。" : "Related capabilities that were not confirmed are out of scope for this goal.");
  const review = answerFor(answers, "missing-review-method", zh ? "评审者通过可复查的操作记录、截图、报告或人工确认判断是否通过。" : "A reviewer uses reviewable operation records, screenshots, reports, or human confirmation to judge whether this passes.");

  return {
    goal_id: goalId || undefined,
    goal,
    presentation: { language },
    acceptance_basis: {
      status: "draft",
      summary: summaryText("discovery", language),
      discovery_id: discovery.id,
      answered_gaps: Object.keys(answers)
    },
    criteria: zh ? [
      {
        id: "AC-1",
        user_story: `作为用户，我能从已确认入口开始，并只操作本轮确认范围内的内容：${entry}`,
        measurement: `用户通过确认入口执行本轮目标所需操作；范围：${fieldScope}`,
        threshold: `入口、可操作范围和不在范围内的边界对用户可见或可判断：${boundary}`,
        risk: "medium"
      },
      {
        id: "AC-2",
        user_story: `作为用户，我输入无效内容时，能看到清楚的校验反馈并知道如何修正：${validation}`,
        measurement: `用户按已确认规则尝试有效和无效输入，并检查校验反馈：${validation}`,
        threshold: "有效输入被接受且不显示校验错误；无效输入被阻止继续，用户能看到对应提示。",
        risk: "medium"
      },
      {
        id: "AC-3",
        user_story: `作为用户，我保存有效修改后，能看到明确成功反馈和更新后的结果：${success}`,
        measurement: `用户完成有效编辑并触发保存；复查方式：${review}`,
        threshold: `界面或报告显示保存成功，并展示用户刚刚保存的结果：${success}`,
        risk: "medium"
      },
      {
        id: "AC-4",
        user_story: `作为用户，我刷新或重新打开后，仍能看到保存后的结果：${persistence}`,
        measurement: `用户完成保存后刷新、重新打开或按确认范围恢复页面：${persistence}`,
        threshold: "用户看到的结果仍与保存成功后的内容一致，不需要阅读实现说明。",
        risk: "high"
      },
      {
        id: "AC-5",
        user_story: `作为用户，我遇到必须覆盖的失败情况时，能看到明确提示并知道数据状态：${failure}`,
        measurement: `用户或评审者触发已确认失败场景；复查方式：${review}`,
        threshold: `失败反馈和数据保留行为符合用户确认：${failure}`,
        risk: "high"
      },
      {
        id: "AC-6",
        user_story: `作为用户或评审者，我能用已确认的复查方式判断本轮目标是否完成：${review}`,
        measurement: `用户或评审者复查成功结果、持久化或重新检查结果、失败行为和范围边界：${review}`,
        threshold: "证据能展示成功反馈、后续复查结果、失败提示和范围边界，并且不把实现步骤当作完成依据。",
        risk: "medium"
      }
    ] : [
      {
        id: "AC-1",
        user_story: `As a user, I can start from the confirmed entrypoint and only operate within the confirmed scope: ${entry}`,
        measurement: `The user performs the goal operation through the confirmed entrypoint; scope: ${fieldScope}`,
        threshold: `The entrypoint, editable scope, and out-of-scope boundary are visible or judgeable to the user: ${boundary}`,
        risk: "medium"
      },
      {
        id: "AC-2",
        user_story: `As a user, I see clear validation feedback and know how to fix invalid input: ${validation}`,
        measurement: `The user tries valid and invalid input according to the confirmed rules and reviews the validation feedback: ${validation}`,
        threshold: "Valid input is accepted without validation errors; invalid input is stopped, and the user sees the matching message.",
        risk: "medium"
      },
      {
        id: "AC-3",
        user_story: `As a user, after saving valid changes, I see clear success feedback and the updated result: ${success}`,
        measurement: `The user completes valid editing and saves; review method: ${review}`,
        threshold: `The screen or report shows save success and displays the result the user just saved: ${success}`,
        risk: "medium"
      },
      {
        id: "AC-4",
        user_story: `As a user, after refresh or reopen, I still see the saved result: ${persistence}`,
        measurement: `After saving, the user refreshes, reopens, or restores the page within the confirmed scope: ${persistence}`,
        threshold: "The user sees the same result as after successful save, without reading implementation notes.",
        risk: "high"
      },
      {
        id: "AC-5",
        user_story: `As a user, when a required failure case happens, I see a clear message and understand the data state: ${failure}`,
        measurement: `The user or reviewer triggers the confirmed failure case; review method: ${review}`,
        threshold: `The failure feedback and data preservation behavior match what the user confirmed: ${failure}`,
        risk: "high"
      },
      {
        id: "AC-6",
        user_story: `As a user or reviewer, I can use the confirmed review method to judge whether this goal is complete: ${review}`,
        measurement: `The user or reviewer reviews success feedback, later persistence/recheck, failure behavior, and scope boundary: ${review}`,
        threshold: "Evidence shows success feedback, later review result, failure message, and scope boundary, and does not treat implementation steps as completion.",
        risk: "medium"
      }
    ]
  };
}

export function buildBrainstorm(idea: string, explicitId: string | undefined = undefined, languageInput: unknown = undefined): Brainstorm {
  const id = explicitId || slugify(idea.slice(0, 40));
  const language = normalizeContractLanguage(languageInput, inferContractLanguage(idea));
  return {
    protocol_version: "opennori/brainstorm-v1",
    id,
    idea,
    presentation: { language },
    status: "draft-source",
    candidates: language === "zh-CN" ? BRAINSTORM_CANDIDATES : BRAINSTORM_CANDIDATES_EN,
    rule: language === "zh-CN"
      ? "头脑风暴输出只用于选择验收方向。它不是计划、Nori Contract 或完成证据。"
      : "Brainstorm output is for choosing an acceptance direction. It is not a plan, a Nori Contract, or completion evidence."
  };
}

export function briefFromBrainstorm(brainstorm: Brainstorm, candidateId: string): NoriBrief {
  const candidate = brainstorm.candidates.find((item) => item.id === candidateId);
  if (!candidate) throw new Error(`Brainstorm candidate not found: ${candidateId}`);
  const language = normalizeContractLanguage(brainstorm.presentation?.language, inferContractLanguage(brainstorm.idea));
  const zh = language === "zh-CN";
  return {
    goal_id: slugify(`${brainstorm.id}-${candidate.id}`),
    goal: `${candidate.suggested_goal_template} ${zh ? "原始想法" : "Original idea"}: ${brainstorm.idea}`,
    presentation: {
      language
    },
    acceptance_basis: {
      status: "draft",
      summary: zh
        ? `从头脑风暴 ${brainstorm.id} 的候选 ${candidate.id} 生成的草稿。`
        : `Draft generated from brainstorm ${brainstorm.id} candidate ${candidate.id}.`
    },
    criteria: candidate.acceptance_directions.map((direction: string, index: number) => ({
      id: `AC-${index + 1}`,
      user_story: direction,
      measurement: zh
        ? "用户查看 OpenNori draft、报告或目标结果后作出判断。"
        : "The user reviews the OpenNori draft, report, or goal result and makes a judgment.",
      threshold: zh
        ? "用户能直接判断是否满足，不需要阅读实现步骤。"
        : "The user can judge whether it is satisfied without reading implementation steps.",
      risk: index === 0 ? "medium" : "low"
    }))
  };
}

const NEXT_CANDIDATE_DRAFT_DETAILS_EN: Record<string, Array<Pick<AcceptanceCriterion, "measurement" | "threshold" | "risk">>> = {
  "opennori-adoption-dogfood": [
    {
      measurement: "The user asks an agent to use OpenNori in a non-OpenNori repository, then reviews the draft Nori Contract shown by the agent.",
      threshold: "The draft includes that project's goal, human-centered AC, acceptance basis, and current approval gap; the user does not need to remember --from-next-candidate, --root, or internal Skill names.",
      risk: "medium"
    },
    {
      measurement: "The user has the agent advance the non-OpenNori project to status/report and reads the completion decision, current gap, evidence, and risks at the top of the report.",
      threshold: "The report clearly shows goal, decision, current gap, evidence, review risks, and whether user intervention is needed; the user can judge completion or what is missing.",
      risk: "medium"
    },
    {
      measurement: "The user or reviewer records the first point where external-project use became unclear, repetitive, too CLI-heavy, or half-installed, then reviews it in evidence or the report.",
      threshold: "Evidence or report names at least one real friction point, or says no obvious friction was found; OpenNori's own passing state is not treated as external adoption proof.",
      risk: "medium"
    }
  ],
  "real-user-validation": [
    {
      measurement: "The user enters the completed flow from the target product or tool's normal user entrypoint and records the path or reviewable evidence.",
      threshold: "The user can reach the flow without reading implementation notes; entrypoint, prerequisites, and scope limits are clear in the draft, status, or evidence.",
      risk: "medium"
    },
    {
      measurement: "The user performs one full core operation and observes the result, feedback, or report.",
      threshold: "The result matches the user's expectation; any dependency on external data, permission, or environment is clearly recorded.",
      risk: "medium"
    },
    {
      measurement: "The user or reviewer opens the final report or evidence source and reviews how the real-user path was checked and what was not covered.",
      threshold: "Report or evidence explains entrypoint, operation, result, evidence source, and limitations; it does not only say local implementation or tests passed.",
      risk: "medium"
    }
  ],
  "failure-and-boundary-coverage": [
    {
      measurement: "The user or reviewer triggers an important confirmed failure case and reviews the user-visible message, recovery path, or preserved state.",
      threshold: "Failure feedback matches the user-confirmed expectation; the user knows whether they can retry, how to recover, and what data was preserved.",
      risk: "high"
    },
    {
      measurement: "The user or reviewer reviews the supported inputs, roles, states, and intentionally excluded boundaries.",
      threshold: "Report or interface explains supported and excluded scope; the user does not mistake an uncovered boundary for completed work.",
      risk: "medium"
    },
    {
      measurement: "The user or reviewer opens failure/boundary evidence instead of only reading a passing happy-path summary.",
      threshold: "Evidence makes the failure trigger, user-visible result, boundary explanation, and limitations reviewable.",
      risk: "medium"
    }
  ],
  "architecture-adherence": [
    {
      measurement: "The user reviews the Architecture Baseline, profile, and status that apply to the current goal.",
      threshold: "Report or status clearly shows whether the baseline is valid, whether an open challenge exists, and separates Product decision from Architecture decision.",
      risk: "medium"
    },
    {
      measurement: "The user reviews build-vs-buy records for any added or changed infrastructure.",
      threshold: "Records show whether current project dependencies, standard libraries, official SDKs, or mature open-source options were checked; self-build reasoning is reviewable.",
      risk: "medium"
    },
    {
      measurement: "When implementation evidence conflicts with the baseline, the user reviews an Architecture Challenge.",
      threshold: "The challenge explains conflicting evidence, suggested change, risks, and the decision needing user confirmation; the agent did not silently replace the architecture.",
      risk: "medium"
    }
  ],
  "next-loop-usability": [
    {
      measurement: "The user reviews next-loop candidate_goals in completion report, resume, status, next, or context export.",
      threshold: "There are few candidates, and each has goal, user_value, acceptance_directions, risks, and draft metadata; the user can judge which one is worth continuing.",
      risk: "low"
    },
    {
      measurement: "The user asks the agent to use, combine, or revise a candidate and reviews the generated new draft Nori Contract.",
      threshold: "The new draft has acceptance basis and an approval gap; the candidate is not treated as approved AC or evidence before user confirmation.",
      risk: "medium"
    },
    {
      measurement: "The user reviews the wording of the candidate and draft.",
      threshold: "The candidate is marked as not a phase, task list, or completion evidence; the agent does not execute it as a process plan.",
      risk: "medium"
    }
  ]
};

function nextCandidateDraftDetail(candidateId: string, index: number, total: number, language: unknown): Pick<AcceptanceCriterion, "measurement" | "threshold" | "risk"> {
  const zh = normalizeContractLanguage(language) === "zh-CN";
  const detail = (zh ? NEXT_CANDIDATE_DRAFT_DETAILS : NEXT_CANDIDATE_DRAFT_DETAILS_EN)[candidateId]?.[index];
  if (detail) return detail;
  if (index === total - 1) {
    return zh
      ? {
          measurement: "用户或评审者打开新 draft、状态或报告，复查本候选方向的结果、证据和限制。",
          threshold: "输出说明用户入口、可观察结果、证据来源和未覆盖范围；不会把候选本身当作已批准 AC 或完成证据。",
          risk: "medium"
        }
      : {
          measurement: "The user or reviewer opens the new draft, status, or report and reviews the result, evidence, and limitations for this candidate direction.",
          threshold: "The output explains user entrypoint, observable result, evidence source, and uncovered scope; the candidate itself is not treated as approved AC or completion evidence.",
          risk: "medium"
        };
  }
  return zh
    ? {
        measurement: "用户或评审者按这个候选方向执行可观察操作，并查看结果、状态或报告。",
        threshold: "用户能看到可判断的结果和限制；任何候选风险都需要在 approval 前确认、修订或接受。",
        risk: "low"
      }
    : {
        measurement: "The user or reviewer performs an observable action for this candidate direction and reviews the result, status, or report.",
        threshold: "The user can see a judgeable result and limitations; candidate risks are confirmed, revised, or accepted before approval.",
        risk: "low"
      };
}

export function briefFromNextGoalCandidate(
  candidate: NextGoalCandidate,
  {
    sourceGoalId,
    goalId,
    language
  }: {
    sourceGoalId?: string;
    goalId?: string;
    language?: unknown;
  } = {}
): NoriBrief {
  const candidateId = String(candidate.id || "").trim();
  if (!candidateId) throw new Error("Candidate id is required");
  const goal = String(candidate.goal || "").trim();
  if (!goal) throw new Error("Candidate goal is required");
  const directions = (candidate.acceptance_directions || [])
    .map((direction) => String(direction || "").trim())
    .filter(Boolean);
  if (directions.length === 0) {
    throw new Error(`Candidate has no acceptance directions: ${candidateId}`);
  }

  const normalizedLanguage = normalizeContractLanguage(language, inferContractLanguage(goal));
  return {
    goal_id: goalId || slugify([sourceGoalId, candidateId].filter(Boolean).join("-") || candidateId),
    goal,
    presentation: { language: normalizedLanguage },
    acceptance_basis: {
      status: "draft",
      summary: summaryText("next-candidate", normalizedLanguage),
      source_goal_id: sourceGoalId,
      candidate_id: candidateId,
      candidate_source: candidate.source,
      user_value: candidate.user_value,
      risks: candidate.risks || [],
      rule: normalizedLanguage === "zh-CN"
        ? "候选目标只是草稿来源。它们不是已批准的验收标准、实现阶段或完成证据。"
        : "Candidate goals are draft sources only. They are not approved acceptance criteria, implementation phases, or completion evidence."
    },
    criteria: directions.map((direction, index) => ({
      id: `AC-${index + 1}`,
      user_story: direction,
      ...nextCandidateDraftDetail(candidateId, index, directions.length, normalizedLanguage)
    }))
  };
}
