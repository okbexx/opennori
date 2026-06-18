import type {
  AcceptanceQualityAudit,
  ArchitectureState,
  AgentSkill,
  CompletionAnswer,
  EvidenceLedger,
  EvidenceRecord,
  EvidenceSource,
  NoriContract,
  NextGoalCandidate,
  NextRecommendation,
  UserIntervention
} from "../types.ts";
import { evidenceHealth, currentGap, evidenceView } from "./evidence.ts";
import { profileCompliance, renderProfileLines } from "./profile.ts";
import { inferCriterionLayer } from "./shared.ts";
import { reviewAcceptanceQuality } from "../acceptance.ts";
import { contractLanguage } from "../language.ts";

type CompletionContext = {
  root?: string;
  architecture?: ArchitectureState;
};

function reviewRiskSources(acceptanceReview: AcceptanceQualityAudit, health = { status: "clear" }): string[] {
  const risks: string[] = [];
  if (acceptanceReview.status !== "clear") risks.push("acceptance_review");
  if (health.status !== "clear") risks.push("evidence_health");
  return risks;
}

function profileReviewRisks(ledger: EvidenceLedger): string[] {
  return profileCompliance(ledger).review.length > 0 ? ["profile_review"] : [];
}

function architectureReviewRisks(architecture: ArchitectureState | undefined): string[] {
  if (!architecture) return [];
  const risks: string[] = [];
  if (architecture.required_for_goal && architecture.decision !== "valid") {
    risks.push("architecture_review");
  }
  if (architecture.agent_surface && (!architecture.agent_surface.guide.installed || !architecture.agent_surface.guide.in_sync)) {
    risks.push("architecture_review");
  }
  if (architecture.build_vs_buy.status !== "clear") {
    risks.push("build_vs_buy");
  }
  return [...new Set(risks)];
}

function architectureReviewSkill(architecture: ArchitectureState): AgentSkill {
  if (architecture.decision === "challenged") return "nori-architecture-challenge";
  if (architecture.build_vs_buy.status !== "clear") return "nori-build-vs-buy";
  if (architecture.decision === "valid") return "nori-architecture-apply";
  return "nori-architecture-brainstorm";
}

function architectureReviewActions(architecture: ArchitectureState): string[] {
  if (architecture.decision === "missing") {
    return [
      "Preview an Architecture Baseline from the current goal, Product AC, Nori Profile, project evidence, and available profiles.",
      "Ask the user to confirm the baseline or explicitly waive architecture review before non-trivial implementation continues."
    ];
  }
  if (architecture.decision === "draft") {
    return [
      "Show the draft Architecture Baseline to the user.",
      "Ask the user to confirm, revise, or waive the baseline before non-trivial implementation continues."
    ];
  }
  if (architecture.decision === "challenged") {
    return [
      "Review the open Architecture Challenge with the user.",
      "Resolve, revise, or waive the challenge before treating the architecture as complete."
    ];
  }
  if (architecture.decision === "invalid") {
    return [
      "Repair the invalid Architecture Baseline state before implementation continues.",
      "Run OpenNori check or doctor again after the baseline is recoverable."
    ];
  }
  if (architecture.build_vs_buy.status !== "clear") {
    return [
      "Review build_vs_buy findings before custom infrastructure work continues.",
      "Record reusable alternatives or the reason self-build is justified."
    ];
  }
  return [
    "Apply the confirmed Architecture Baseline while working on the current acceptance gap."
  ];
}

function reviewRiskSkill(input: {
  acceptanceReview: AcceptanceQualityAudit;
}): AgentSkill {
  if (input.acceptanceReview.status !== "clear") return "nori-acceptance";
  return "nori-reporting";
}

function goalLabel(goal: string): string {
  const normalized = goal.replace(/\s+/g, " ").trim();
  if (normalized.length <= 96) return normalized;
  return `${normalized.slice(0, 93)}...`;
}

function quoteCommandValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function withDraftCommand(candidate: NextGoalCandidate, sourceGoalId: string, language: string): NextGoalCandidate {
  const draftArgs = [
    "draft",
    "--from-next-candidate",
    candidate.id,
    "--source-goal",
    sourceGoalId,
    "--language",
    language,
    "--root",
    ".",
    "--json"
  ];
  return {
    ...candidate,
    draft_args: draftArgs,
    draft_command: `opennori draft --from-next-candidate ${quoteCommandValue(candidate.id)} --source-goal ${quoteCommandValue(sourceGoalId)} --language ${quoteCommandValue(language)} --root . --json`,
    draft_rule: language === "zh-CN"
      ? "这个命令只创建 draft Nori Contract。用户必须批准或修改后，它才能成为下一轮实现或证据闭环的依据。"
      : "This command creates a draft Nori Contract only. The user must approve or revise the draft before implementation or evidence can complete the next loop."
  };
}

function completedGoalCandidates(contract: NoriContract, architecture: ArchitectureState | undefined): NextGoalCandidate[] {
  const language = contractLanguage(contract);
  const zh = language === "zh-CN";
  const completedGoal = zh ? "已完成目标" : "the completed goal";
  const goal = String(contract.goal || completedGoal).trim();
  const shortGoal = goalLabel(goal || completedGoal);
  const goalText = [
    contract.goal_id,
    goal,
    ...contract.criteria.map((criterion) => criterion.user_story)
  ].join("\n").toLowerCase();
  const isOpenNoriGoal = goalText.includes("opennori") || goalText.includes("nori contract") || goalText.includes("nori profile");
  const hasArchitecture = Boolean(architecture?.baseline?.status === "active");
  const generic: NextGoalCandidate[] = zh
    ? [
        {
          id: "real-user-validation",
          goal: `在真实用户路径中验证“${shortGoal}”。`,
          user_value: "用户能判断已完成结果是否在自己真正关心的场景里可用，而不只是 agent 本地证明通过。",
          acceptance_directions: [
            "作为用户，我能从正常用户入口进入已完成流程。",
            "作为用户，我能执行核心操作并看到预期结果，而不需要阅读实现说明。",
            "作为用户，我能查看证据，理解真实用户路径是如何检查的，以及没有覆盖什么。"
          ],
          risks: [
            "这可能扩散成宽泛回归测试；下一份 contract 应聚焦一个用户可见路径。",
            "不要把本地实现成功当成真实用户验收证明。"
          ],
          source: "completion-context"
        },
        {
          id: "failure-and-boundary-coverage",
          goal: `让“${shortGoal}”周围的失败和边界行为可复查。`,
          user_value: "当输入、权限、持久化或外部条件不走 happy path 时，用户也能信任完成结果。",
          acceptance_directions: [
            "作为用户，我能触发或复查重要失败场景，并看到预期提示或恢复行为。",
            "作为用户，我能知道哪些输入、角色或状态被支持，哪些明确不在范围内。",
            "作为用户，我能看到失败或边界行为的证据，而不只是 happy path 通过摘要。"
          ],
          risks: [
            "失败覆盖容易无限扩大；先问哪些失败真正影响用户验收。",
            "不要把内部异常类型或测试名称变成 Product AC。"
          ],
          source: "completion-context"
        },
        {
          id: "architecture-adherence",
          goal: `复查“${shortGoal}”是否仍遵守已确认 Architecture Baseline。`,
          user_value: "用户能信任完成结果遵守了约定架构；如果没有，agent 必须提出可复查 challenge。",
          acceptance_directions: [
            "作为用户，我能看到已完成结果适用哪份 Architecture Baseline。",
            "作为用户，我能看到新增基础设施的 build-vs-buy 证据。",
            "作为用户，我能在项目证据与 baseline 冲突时看到 Architecture Challenge。"
          ],
          risks: [
            hasArchitecture
              ? "架构指导可能变成实现清单；需要和 Product AC、完成缺口保持分离。"
              : "没有找到 active Architecture Baseline；先建立 baseline 再把它当成成熟架构切片。",
            "不要让某个外部工具或审查面驱动 OpenNori loop。"
          ],
          source: "completion-context"
        },
        {
          id: "next-loop-usability",
          goal: `选择“${shortGoal}”之后的下一个人类可判断目标。`,
          user_value: "用户能从已完成 contract 继续到下一轮验收 loop，而不用重新发明下一句 prompt。",
          acceptance_directions: [
            "作为用户，我能在 confident completion 后看到一小组候选下一轮目标。",
            "作为用户，我能要求 agent 使用、组合或改写候选目标，然后再成为新的 Nori Contract。",
            "作为用户，我能知道这些候选不是 phase、task list 或完成证据。"
          ],
          risks: [
            "候选目标只是下一份 contract 的建议，不是已批准 AC。",
            "如果用户明确要求继续，agent 可以选择最佳候选并起草新 contract，然后请求用户确认。"
          ],
          source: "completion-context"
        }
      ]
    : [
        {
          id: "real-user-validation",
          goal: `Validate "${shortGoal}" in a real user path.`,
          user_value: "Users can judge whether the completed outcome works in the situation they actually care about, not only in the agent's local proof.",
          acceptance_directions: [
            "As a user, I can enter the completed flow from the normal user-facing entrypoint.",
            "As a user, I can perform the core operation and see the expected result without reading implementation notes.",
            "As a user, I can review evidence that explains how the real-user path was checked and what it does not cover."
          ],
          risks: [
            "This can become broad regression testing; keep the next contract focused on one user-visible path.",
            "Do not treat local implementation success as proof of real user acceptance."
          ],
          source: "completion-context"
        },
        {
          id: "failure-and-boundary-coverage",
          goal: `Make the failure and boundary behavior around "${shortGoal}" reviewable.`,
          user_value: "Users can trust the completed result when inputs, permissions, persistence, or external conditions do not follow the happy path.",
          acceptance_directions: [
            "As a user, I can trigger or review the important failure case and see the intended message or recovery behavior.",
            "As a user, I can tell what inputs, roles, or states are supported and what is intentionally out of scope.",
            "As a user, I can see evidence for the failure or boundary behavior instead of only a passing happy-path summary."
          ],
          risks: [
            "Failure coverage can expand endlessly; ask which failures matter to user acceptance.",
            "Do not turn internal exception types or test names into Product AC."
          ],
          source: "completion-context"
        },
        {
          id: "architecture-adherence",
          goal: `Review whether "${shortGoal}" still follows the confirmed architecture baseline.`,
          user_value: "Users can trust that the completed result followed the agreed architecture unless the agent raises a reviewable challenge.",
          acceptance_directions: [
            "As a user, I can see which architecture baseline applies to the completed result.",
            "As a user, I can see build-vs-buy evidence for any new infrastructure introduced by the work.",
            "As a user, I can see an Architecture Challenge if project evidence conflicts with the confirmed baseline."
          ],
          risks: [
            hasArchitecture
              ? "Architecture guidance can become an implementation checklist; keep it separate from Product AC and completion gaps."
              : "No active Architecture Baseline was found; establish one before treating this as a mature architecture slice.",
            "Do not make a specific external tool or review surface drive the OpenNori loop."
          ],
          source: "completion-context"
        },
        {
          id: "next-loop-usability",
          goal: `Choose the next human-facing outcome after "${shortGoal}".`,
          user_value: "Users can continue from a completed contract into the next acceptance loop without inventing the next prompt from scratch.",
          acceptance_directions: [
            "As a user, I can review a small set of candidate next goals after confident completion.",
            "As a user, I can ask the agent to use, combine, or revise a candidate before it becomes a new Nori Contract.",
            "As a user, I can tell the candidates are not phases, task lists, or completion evidence."
          ],
          risks: [
            "Candidate goals are suggestions for the next contract, not approved acceptance criteria.",
            "If the user explicitly asked to continue, the agent may select the best candidate and draft a new contract, then ask for acceptance approval."
          ],
          source: "completion-context"
        }
      ];
  const candidates = !isOpenNoriGoal ? generic : [
    {
      id: "opennori-adoption-dogfood",
      goal: zh
        ? "在一个非 OpenNori 项目中完整跑一遍 OpenNori，并记录采用摩擦。"
        : "Run OpenNori through a non-OpenNori project and capture the adoption friction.",
      user_value: zh
        ? "用户能判断 OpenNori 是否真的能在自身仓库之外，从自然语言目标跑到报告闭环。"
        : "Users can judge whether OpenNori works outside its own repository, from natural-language goal through report.",
      acceptance_directions: zh
        ? [
            "作为用户，我能在非 OpenNori 项目中从自然语言启动 OpenNori，并看到 draft Nori Contract。",
            "作为用户，我能查看最终报告并理解 goal 状态、当前缺口、证据和 review risks。",
            "作为用户，我能识别 OpenNori loop 第一个不清楚、重复或过度依赖 CLI 的摩擦点。"
          ]
        : [
            "As a user, I can start OpenNori in a non-OpenNori project from natural language and see a draft Nori Contract.",
            "As a user, I can review the final report and understand goal status, current gap, evidence, and any review risks.",
            "As a user, I can identify the first point where the OpenNori loop felt unclear, repetitive, or too CLI-heavy."
          ],
      risks: zh
        ? [
            "Dogfood 可能变成宽泛产品审计；下一份 contract 要聚焦用户可见采用结果。",
            "不要把 OpenNori 自身 passing 报告当成外部项目采用证明。"
          ]
        : [
            "Dogfood may become a broad product audit; keep the next contract focused on the user-visible adoption result.",
            "Do not treat OpenNori's own passing report as evidence for external project adoption."
          ],
      source: "completion-context"
    },
    ...generic.slice(1)
  ];
  return candidates.map((candidate) => withDraftCommand(candidate, contract.goal_id, language));
}

export function intervention(contract: NoriContract, ledger: EvidenceLedger): UserIntervention {
  const compliance = profileCompliance(ledger);
  if (compliance.required && !compliance.complete) {
    const item = compliance.blocking[0];
    if (!item) {
      return {
        required: true,
        action: "Capability profile compliance is incomplete; inspect Nori Profile evidence."
      };
    }
    return {
      required: true,
      criterion: `PROFILE-${item.id}`,
      user_story: `作为用户，我需要确认 agent 是否必须遵守能力偏好：${item.name}。`,
      action: item.status === "violated"
        ? `Capability profile item ${item.name} was violated. Waive it or revise the work.`
        : `Provide evidence that Nori Profile item ${item.name} was satisfied, or waive it.`
    };
  }

  for (const criterion of contract.criteria) {
    const state = ledger.criteria[criterion.id];
    if (state?.status === "blocked") {
      const latest = state.evidence?.at(-1);
      return {
        required: true,
        criterion: criterion.id,
        user_story: criterion.user_story,
        action: latest?.summary || "Provide the decision, permission, input, or external condition needed to unblock this criterion."
      };
    }
  }

  return {
    required: false,
    action: "No user intervention is currently required."
  };
}

export function completionAnswer(contract: NoriContract, ledger: EvidenceLedger, { root = process.cwd(), architecture = undefined }: CompletionContext = {}): CompletionAnswer {
  const gap = currentGap(contract, ledger);
  const objectiveComplete = !gap && ledger.status === "complete";
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const health = evidenceHealth(contract, ledger, { root });
  const risks = objectiveComplete ? [
    ...reviewRiskSources(acceptanceReview, health),
    ...profileReviewRisks(ledger),
    ...architectureReviewRisks(architecture)
  ] : [];
  if (objectiveComplete && risks.length > 0) {
    return {
      complete: true,
      objective_complete: true,
      confidence: "review-risk",
      review_risks: risks,
      answer: `Objectively complete with review risk: ${risks.join(", ")}.`
    };
  }
  if (objectiveComplete) {
    return {
      complete: true,
      objective_complete: true,
      confidence: "confident",
      review_risks: [],
      answer: "Complete: all required acceptance criteria have passing or waived evidence."
    };
  }
  return {
    complete: false,
    objective_complete: false,
    confidence: "not-complete",
    review_risks: [],
    answer: `Not complete: ${gap ? `${gap.id} is ${gap.status}. ${gap.reason}` : `workflow status is ${ledger.status}.`}`
  };
}

export function nextRecommendation(contract: NoriContract, ledger: EvidenceLedger, { root = process.cwd(), architecture = undefined }: CompletionContext = {}): NextRecommendation {
  const gap = currentGap(contract, ledger);
  const needed = intervention(contract, ledger);
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const health = evidenceHealth(contract, ledger, { root });
  const profile = profileCompliance(ledger);

  if (needed.required) {
    return {
      status: "user-intervention-required",
      focus: needed.criterion || null,
      summary: `${needed.criterion || "OpenNori"} needs user input before the agent continues.`,
      actions: [
        needed.action,
        "After the decision or external condition is available, record evidence and rerun OpenNori status."
      ]
    };
  }

  const architectureRisks = architectureReviewRisks(architecture);
  if (
    gap
    && gap.id !== "ACCEPTANCE-BASIS"
    && architecture
    && architecture.required_for_goal
    && (architecture.decision !== "valid" || architecture.build_vs_buy.status !== "clear")
  ) {
    const skill = architectureReviewSkill(architecture);
    return {
      status: "architecture-review-required",
      focus: gap.id,
      recommended_skill: skill,
      summary: `Product AC is ready, but architecture needs review before non-trivial implementation continues: ${architectureRisks.join(", ")}.`,
      actions: architectureReviewActions(architecture)
    };
  }

  if (gap) {
    if (gap.id === "ACCEPTANCE-BASIS") {
      return {
        status: "acceptance-approval-required",
        focus: gap.id,
        summary: "Acceptance criteria need user approval or revision before implementation work counts as complete.",
        actions: [
          "Ask the user to approve or revise the acceptance criteria before implementation work continues."
        ]
      };
    }

    const hasConfirmedArchitecture = Boolean(architecture?.required_for_goal && architecture.decision === "valid");
    return {
      status: "work-on-current-gap",
      focus: gap.id,
      recommended_skill: hasConfirmedArchitecture ? "nori-architecture-apply" : "nori-evidence",
      summary: `Continue with ${gap.id}: ${gap.user_story}`,
      actions: hasConfirmedArchitecture
        ? [
            `Apply the confirmed Architecture Baseline while working on ${gap.id}.`,
            `After implementation or verification, record reviewable evidence for ${gap.id} and rerun OpenNori status.`
          ]
        : [
            `Create or collect reviewable evidence for ${gap.id}.`,
            `Record the result for ${gap.id}, then rerun OpenNori status.`
          ]
    };
  }

  const reviewRisks = [
    ...reviewRiskSources(acceptanceReview, health),
    ...profileReviewRisks(ledger),
    ...architectureReviewRisks(architecture)
  ];
  if (ledger.status === "complete" && reviewRisks.length > 0) {
    const actions: string[] = [];
    if (acceptanceReview.status !== "clear") {
      actions.push("Show unresolved acceptance ambiguity to the user.");
      actions.push("Use nori-acceptance to ask the concrete missing acceptance questions, then revise the affected criteria, record explicit assumptions, or ask the user to accept the remaining review risk.");
    }
    if (health.status !== "clear") {
      actions.push("Review evidence_health findings.");
      actions.push("Refresh stale, broad, or summary-only evidence with reviewable sources, reviewability, and limitations.");
    }
    if (profile.review.length > 0) {
      actions.push("Review Nori Profile preference risks.");
      actions.push("Record profile evidence, waive the preference, or ask the user whether the remaining profile risk is acceptable.");
    }
    if (architecture && architectureReviewRisks(architecture).includes("architecture_review")) {
      actions.push("Review architecture_check warnings.");
      actions.push("Confirm, repair, or challenge the Architecture Baseline before reporting confidently complete.");
    }
    if (architecture && architectureReviewRisks(architecture).includes("build_vs_buy")) {
      actions.push("Review build_vs_buy findings.");
      actions.push("Record reusable alternatives or the reason self-build is justified before reporting mature architecture completion.");
    }
    return {
      status: "completion-review-required",
      focus: null,
      recommended_skill: reviewRiskSkill({ acceptanceReview }),
      summary: `All required ACs have passing or waived evidence, but completion has review risk: ${reviewRisks.join(", ")}.`,
      actions
    };
  }

  if (ledger.status === "complete") {
    const candidateGoals = completedGoalCandidates(contract, architecture);
    return {
      status: "ready-for-next-loop",
      focus: null,
      summary: "This OpenNori goal is complete. If the user has asked to continue, choose or refine a candidate goal and start the next acceptance loop without waiting for another next-step prompt.",
      actions: [
        "Report the completion evidence briefly.",
        "Review candidate_goals and choose the strongest next human-facing goal from the current context.",
        "Run acceptance discovery or draft a new Nori Contract for that candidate; do not treat the candidate as approved AC or evidence."
      ],
      candidate_goals: candidateGoals
    };
  }

  return {
    status: "reconcile-workflow-state",
    focus: null,
    summary: `No current gap was found, but workflow status is ${ledger.status}.`,
    actions: [
      "Run OpenNori evaluate and doctor, then inspect the report before continuing."
    ]
  };
}

function escapeTableCell(value: unknown): string {
  return String(value || "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

function formatEvidenceValue(value: unknown): string {
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatEvidenceSource(source: EvidenceSource | string): string {
  if (!source) return "<none>";
  if (typeof source === "string") return source;
  const preferredKeys = ["type", "label", "command", "path", "url", "outcome", "summary"];
  const sourceRecord = source as EvidenceSource;
  const parts: string[] = [];
  for (const key of preferredKeys) {
    if (sourceRecord[key]) parts.push(`${key}=${formatEvidenceValue(sourceRecord[key])}`);
  }
  for (const [key, value] of Object.entries(sourceRecord)) {
    if (!preferredKeys.includes(key) && value !== undefined && value !== null && String(value).trim() !== "") {
      parts.push(`${key}=${formatEvidenceValue(value)}`);
    }
  }
  return parts.join(", ") || "<none>";
}

function formatEvidenceSources(evidence: EvidenceRecord | null | undefined, { root = process.cwd() } = {}): string {
  const view = evidenceView(evidence, { root });
  if (!view) return "<none>";
  if (view.sources.length === 0) return view.path || "<none>";
  return view.sources.map((source) => formatEvidenceSource(source)).join("; ");
}

export function renderReport(contract: NoriContract, ledger: EvidenceLedger, { root = process.cwd(), architecture = undefined }: CompletionContext = {}): string {
  const gap = currentGap(contract, ledger);
  const needed = intervention(contract, ledger);
  const completion = completionAnswer(contract, ledger, { root, architecture });
  const health = evidenceHealth(contract, ledger, { root });
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const profile = profileCompliance(ledger);
  const recommendation = nextRecommendation(contract, ledger, { root, architecture });
  const lines = [
    `# ${contract.goal_id} Acceptance Report`,
    "",
    "## Decision Summary",
    "",
    `Completion: ${completion.answer}`,
    `Objective complete: ${completion.objective_complete ? "yes" : "no"}`,
    `Confidence: ${completion.confidence}`,
    `Review risks: ${completion.review_risks.length > 0 ? completion.review_risks.join(", ") : "none"}`,
    `Current gap: ${gap ? `${gap.id} - ${gap.reason}` : "None. All required acceptance criteria have passing or waived evidence."}`,
    `User intervention: ${needed.required ? `${needed.criterion} - ${needed.action}` : needed.action}`,
    `Recommended next action: ${recommendation.summary}`,
    `Workflow status: ${ledger.status}`,
    "",
    "## Goal",
    "",
    contract.goal,
    "",
    "## Acceptance Basis",
    "",
    `Status: ${contract.acceptance_basis?.status || "draft"}`,
    contract.acceptance_basis?.summary ? `Summary: ${contract.acceptance_basis.summary}` : "Summary: <none>",
    "",
    "## Nori Profile",
    "",
    ...renderProfileLines(ledger),
    "",
    ...(profile.review.length > 0
      ? [
          "Profile review risks:",
          ...profile.review.map((item) => `- ${item.id}: ${item.name} is ${item.status} (${item.strength})`),
          ""
        ]
      : []),
    "## Acceptance Status",
    "",
    "| ID | Layer | User acceptance criterion | Status | Confidence | Evidence summary | Basis | Sources | Reviewability | Limitations |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const criterion of contract.criteria) {
    const state = ledger.criteria[criterion.id];
    const latest = state?.evidence?.at(-1);
    const view = evidenceView(latest, { root });
    const evidence = view ? `${view.kind}: ${view.summary}` : "<none>";
    lines.push(`| ${criterion.id} | ${criterion.layer || inferCriterionLayer(criterion.id)} | ${escapeTableCell(criterion.user_story)} | ${state?.status || "unknown"} | ${state?.confidence || "none"} | ${escapeTableCell(evidence)} | ${view?.basis || "<none>"} | ${escapeTableCell(formatEvidenceSources(latest, { root }))} | ${view?.reviewability || "<none>"} | ${escapeTableCell(view?.limitations || "<none>")} |`);
  }

  lines.push("", "## Current Acceptance Gap", "");
  lines.push(gap ? `${gap.id} - ${gap.reason}` : "None. All required acceptance criteria have passing or waived evidence.");
  lines.push("", "## Acceptance Review", "");
  lines.push(`Status: ${acceptanceReview.status}`);
  lines.push(`Summary: ${acceptanceReview.summary}`);
  if (acceptanceReview.findings.length > 0) {
    lines.push("", "| Criterion | Severity | Concern | Question | Agent guidance |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const finding of acceptanceReview.findings) {
      lines.push(`| ${finding.criterion_id} | ${finding.severity} | ${finding.gap_id} | ${escapeTableCell(finding.question)} | ${escapeTableCell(finding.agent_guidance || "")} |`);
    }
  }
  lines.push("", "## Evidence Health", "");
  lines.push(`Status: ${health.status}`);
  lines.push(`Summary: ${health.summary}`);
  if (health.findings.length > 0) {
    lines.push("", "| Criterion | Severity | Issue | Message | Recovery |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const finding of health.findings) {
      lines.push(`| ${finding.criterion_id} | ${finding.severity} | ${finding.issue} | ${escapeTableCell(finding.message)} | ${escapeTableCell(finding.recovery)} |`);
    }
  }
  lines.push("", "## User Intervention", "");
  lines.push(needed.required ? `${needed.criterion} - ${needed.action}` : needed.action);
  if (recommendation.candidate_goals && recommendation.candidate_goals.length > 0) {
    lines.push("", "## Candidate Next Goals", "");
    lines.push("These are not approved acceptance criteria, implementation phases, or completion evidence. They are candidate starts for the next Nori Contract.");
    for (const candidate of recommendation.candidate_goals) {
      lines.push("", `### ${candidate.id}`, "");
      lines.push(`Goal: ${candidate.goal}`);
      lines.push(`User value: ${candidate.user_value}`);
      if (candidate.draft_command) {
        lines.push(`Draft command: ${candidate.draft_command}`);
      }
      if (candidate.draft_rule) {
        lines.push(`Draft rule: ${candidate.draft_rule}`);
      }
      lines.push("Acceptance directions:");
      for (const direction of candidate.acceptance_directions) {
        lines.push(`- ${direction}`);
      }
      lines.push("Risks:");
      for (const risk of candidate.risks) {
        lines.push(`- ${risk}`);
      }
    }
  }
  lines.push("", "## Conclusion", "", `Current status: ${ledger.status}`);
  return `${lines.join("\n")}\n`;
}
