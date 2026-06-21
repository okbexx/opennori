import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { tempRoot, writeBriefFile, renderHuman, runApproveCommand, runBrainstormCommand, runCriterionAddCommand, runCriterionUpdateCommand, runDiscoverCommand, runDraftCommand, runInitCommand, runNextCommand, runResumeCommand, runStatusCommand, runDoctorCommand, runProfileAddCommand, resolveCliCommand, runCliCommand, buildArchitectureBaseline, renderAgentGuideMarkdown, writeArchitectureBaseline, writeArchitectureRequirement, addEvidence, buildEvidenceLedger, goalPaths, writeGoalDossier, writeJson } from "./support/command-fixtures.js";

test("status commands return routeable no-current-goal state instead of unexpected errors", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  await runInitCommand(["--root", root, "--confirm", "--json"]);

  const resolved = await resolveCliCommand(["status", "--root", root, "--json"]);
  assert.equal(resolved.ok, true);
  const status = await runCliCommand(resolved);
  assert.equal(status.ok, true);
  assert.equal(status.data.status, "no_current_goal");
  assert.equal(status.data.current_goal, null);
  assert.equal(status.data.agent_next.state, "initialized_no_active_contract");
  assert.equal(status.data.agent_next.recommended_skill, "nori-acceptance");
  assert.match(renderHuman(status, ["status"]), /OpenNori has no current goal/);
});

test("status with draft contracts routes agents to one-AC review before approval", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  await runInitCommand(["--root", root, "--confirm", "--json"]);
  const briefPath = writeBriefFile(root, "Ship a reviewable draft", {
    goalId: "draft-needs-interpretation",
    language: "en"
  });
  await runDraftCommand(["--root", root, "--brief", briefPath, "--json"]);

  const resolved = await resolveCliCommand(["status", "--root", root, "--json"]);
  assert.equal(resolved.ok, true);
  const status = await runCliCommand(resolved);
  assert.equal(status.ok, true);
  assert.equal(status.data.status, "no_current_goal");
  assert.equal(status.data.agent_next.state, "initialized_no_active_contract");
  assert.equal(status.data.agent_next.recommended_skill, "nori-acceptance");
  assert.equal(status.data.draft_goals.some((goal) => goal.goal_id === "draft-needs-interpretation"), true);
});

test("status routes incomplete project state to health recovery instead of unexpected errors", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  await runInitCommand(["--root", root, "--confirm", "--json"]);
  fs.rmSync(path.join(root, ".opennori", "current"), { recursive: true, force: true });
  fs.rmSync(path.join(root, ".opennori", "drafts"), { recursive: true, force: true });

  const resolved = await resolveCliCommand(["status", "--root", root, "--json"]);
  assert.equal(resolved.ok, true);
  const status = await runCliCommand(resolved);
  assert.equal(status.ok, true);
  assert.equal(status.data.status, "needs-action");
  assert.equal(status.data.current_goal, null);
  assert.equal(status.data.agent_next.state, "health_needs_recovery");
  assert.equal(status.data.agent_next.recommended_skill, "nori-project-health");
  assert.equal(status.data.health.failed_checks.some((check) => check.name === "dir_current"), true);
  const text = renderHuman(status, ["status"]);
  assert.match(text, /OpenNori has no current goal/);
  assert.match(text, /Health: needs-action/);
});

test("brainstorm command module creates selectable directions without a contract", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const candidates = JSON.stringify({
    candidates: [
      {
        id: "A",
        title: "头脑风暴验收入口",
        user_value: "用户能从粗略想法看到可选择的验收方向。",
        suggested_goal_template: "让 OpenNori 支持头脑风暴入口。",
        acceptance_directions: ["作为用户，我能看到候选方向并选择或改写。"],
        risks: ["候选方向仍需转成 NoriBrief 后才能 draft。"]
      }
    ]
  });
  const brainstorm = await runBrainstormCommand([
    "--root", root,
    "--idea", "我想让 OpenNori 支持头脑风暴",
    "--candidates", candidates,
    "--json"
  ]);

  assert.equal(brainstorm.ok, true);
  assert.equal(brainstorm.data.status, "draft-source");
  assert.equal(brainstorm.data.presentation.language, "zh-CN");
  assert.equal(brainstorm.data.is_acceptance_contract, false);
  assert.equal(brainstorm.data.candidates.length, 1);
  assert.equal(fs.existsSync(brainstorm.data.brainstorm_path), true);
  assert.equal(fs.existsSync(brainstorm.data.markdown_path), true);
  assert.equal(brainstorm.artifacts.some((artifact) => artifact.kind === "brainstorm_source"), true);
  assert.match(fs.readFileSync(brainstorm.data.markdown_path, "utf8"), /不是计划、Nori Contract 或完成证据/);
});

test("discover command module writes a question source without creating a current goal", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const questions = JSON.stringify({
    gaps: [
      {
        id: "field-scope",
        question: "哪些字段可以修改，哪些字段只读？",
        why: "用户需要知道设置页的可编辑范围。"
      }
    ]
  });
  const discovery = await runDiscoverCommand([
    "--root", root,
    "--goal", "做一个设置页，用户可以修改个人资料，保存后刷新仍然生效，失败时有提示。",
    "--questions", questions,
    "--json"
  ]);

  assert.equal(discovery.ok, true);
  assert.equal(discovery.data.status, "needs-user-answers");
  assert.equal(discovery.data.presentation.language, "zh-CN");
  assert.equal(discovery.data.is_acceptance_contract, false);
  assert.equal(fs.existsSync(discovery.data.discovery_path), true);
  assert.equal(fs.existsSync(discovery.data.markdown_path), true);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "current")), false);
  assert.equal(discovery.data.gaps.length > 0, true);
  assert.equal(discovery.data.gaps.every((gap) => typeof gap.question === "string" && gap.question.length > 0), true);
  assert.equal(discovery.artifacts.some((artifact) => artifact.kind === "acceptance_discovery"), true);
  assert.match(fs.readFileSync(discovery.data.markdown_path, "utf8"), /不是 Nori Contract、过程计划或完成证据/);
});

test("draft command module creates contracts only from Skill-prepared briefs", { tags: ["cli", "profile", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const missing = await runDraftCommand(["--root", root, "--json"]);
  assert.equal(missing.ok, false);
  assert.equal(missing.error.type, "brief_required");

  const briefPath = writeBriefFile(root, "Ship a settings page where users edit profile details", {
    goalId: "module-settings-contract",
    language: "zh-CN",
    criteria: [
      {
        id: "AC-1",
        layer: "operator",
        user_story: "作为用户，我能从顶部导航打开 Account Settings 并进入 Profile 标签页。",
        measurement: "打开 Account Settings，再进入 Profile 标签页查看资料表单。",
        threshold: "Profile 标签页显示昵称、头像和简介字段，邮箱、手机号和密码显示为只读或不在本轮编辑范围。"
      },
      {
        id: "AC-2",
        layer: "operator",
        user_story: "作为用户，我能按规则编辑昵称、头像和简介。",
        measurement: "输入 2-30 个字符的昵称、最多 160 个字符的简介，并选择不超过 2MB 的 PNG/JPEG 头像。",
        threshold: "合法输入可以提交；不合法昵称、过长简介或错误头像格式会显示可理解的校验提示。"
      }
    ]
  });

  const draft = await runDraftCommand([
    "--root", root,
    "--brief", briefPath,
    "--language", "zh-CN",
    "--json"
  ]);

  assert.equal(draft.ok, true);
  assert.equal(draft.data.goal_id, "module-settings-contract");
  assert.equal(draft.data.presentation.language, "zh-CN");
  assert.equal(draft.data.acceptance_basis.status, "draft");
  assert.match(draft.data.acceptance_basis.summary, /Skill-prepared acceptance brief/);
  assert.equal(draft.data.criteria.length, 2);
  assert.equal(draft.data.criteria.some((criterion) => /Account Settings/.test(criterion.user_story)), true);
  assert.equal(draft.data.criteria.some((criterion) => /2-30 个字符/.test(`${criterion.user_story} ${criterion.measurement}`)), true);
  assert.equal(draft.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(draft.data.state, "draft");
});

test("draft command module stores Skill-prepared draft contracts", { tags: ["cli", "profile", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const briefPath = writeBriefFile(root, "Ship an OpenNori-backed task", {
    goalId: "module-goal",
    language: "en"
  });
  const draft = await runDraftCommand([
    "--root", root,
    "--brief", briefPath,
    "--json"
  ]);
  assert.equal(draft.ok, true);
  assert.equal(draft.data.goal_id, "module-goal");
  assert.equal(draft.data.acceptance_basis.status, "draft");
  assert.match(draft.data.acceptance_basis.summary, /Skill-prepared acceptance brief/);
  assert.equal(draft.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(draft.data.state, "draft");
  assert.equal(fs.existsSync(draft.data.acceptance_path), true);
  assert.equal(fs.existsSync(draft.data.evidence_path), true);
  assert.equal(draft.artifacts.some((artifact) => artifact.kind === "nori_contract_draft"), true);
  const draftText = renderHuman(draft, ["draft"]);
  assert.match(draftText, /OpenNori draft created/);
  assert.match(draftText, /Nori Contract Draft:/);
  assert.match(draftText, /Internal evidence ledger:/);
  assert.doesNotMatch(draftText, /"evidence_path"/);
});

test("init command module initializes project state with preview safety", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const preview = await runInitCommand(["--root", root, "--json"]);
  assert.equal(preview.ok, true);
  assert.equal(preview.data.status, "needs_confirm");
  assert.equal(preview.data.agent_next.state, "setup_preview_needs_confirmation");
  assert.equal(preview.data.agent_next.needs_user, true);
  assert.equal(preview.data.install_plan.summary.will_write, 0);
  assert.equal(fs.existsSync(path.join(root, ".opennori")), false);

  const initialized = await runInitCommand(["--root", root, "--confirm", "--json"]);
  assert.equal(initialized.ok, true);
  assert.equal(initialized.data.status, "installed");
  assert.equal(initialized.data.agent_next.state, "initialized_no_active_contract");
  assert.equal(initialized.data.agent_next.recommended_skill, "nori-acceptance");
  assert.match(initialized.data.agent_next.instruction, /already stated natural-language goal/);
  assert.match(initialized.data.agent_next.user_visible_next, /stated goal/);
  assert.equal(fs.existsSync(path.join(root, ".opennori", "manifest.json")), true);

  const doctor = await runDoctorCommand(["--root", root, "--json"]);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.data.status, "ready");
  assert.equal(doctor.data.active_goals.length, 0);
  assert.equal(doctor.data.agent_next.state, "initialized_no_active_contract");
  assert.match(doctor.data.agent_next.instruction, /already stated goal/);
});

test("draft command module creates current Nori Contracts from brief files", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const briefPath = path.join(root, "brief.json");
  writeJson(briefPath, {
    goal_id: "module-brief-goal",
    goal: "Ship a brief-backed OpenNori task",
    criteria: [
      {
        id: "AC-BRIEF",
        user_story: "作为用户，我能查看 brief 生成的验收目标。",
        measurement: "用户运行 status 并查看当前缺口。",
        threshold: "输出显示 AC-BRIEF 或验收审批缺口。"
      }
    ]
  });

  const drafted = await runDraftCommand(["--brief", briefPath, "--root", root, "--json"]);
  assert.equal(drafted.ok, true);
  assert.equal(drafted.data.goal_id, "module-brief-goal");
  assert.equal(drafted.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(drafted.data.state, "draft");
  assert.equal(fs.existsSync(drafted.data.acceptance_path), true);
  assert.equal(fs.existsSync(drafted.data.evidence_path), true);
  assert.equal(drafted.artifacts.some((artifact) => artifact.kind === "nori_contract_draft"), true);
});

test("next command module asks for architecture requirement before baseline review", { tags: ["cli", "architecture", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const contract = {
    goal_id: "module-goal",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can see the current acceptance gap."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "active", criteria: { "AC-1": { status: "unknown", evidence: [] } } };

  const next = await runNextCommand(["--json"], {
    loadPair: () => ({ contract, ledger, root })
  });
  assert.equal(next.ok, true);
  assert.equal(next.data.goal_id, "module-goal");
  assert.equal(next.data.current_gap.id, "AC-1");
  assert.equal(next.data.complete, false);
  assert.equal(next.data.next_recommendation.status, "architecture-requirement-required");
  assert.equal(next.data.agent_next.state, "architecture_requirement_needs_decision");
  assert.equal(next.data.agent_next.recommended_skill, "nori-architecture-brainstorm");
  assert.equal(next.data.agent_next.current_gap_id, "AC-1");
  assert.equal(next.next_actions.some((action) => /required, not_required, or waived/.test(action)), true);
});

test("resume command module includes completion, health, architecture, and next actions", { tags: ["cli", "architecture", "reporting", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    goal_id: "module-goal",
    criteria: [],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "complete", criteria: {} };

  const resume = await runResumeCommand(["--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(resume.ok, true);
  assert.equal(resume.data.goal_id, "module-goal");
  assert.equal(resume.data.completion.complete, true);
  assert.equal(resume.data.completion.objective_complete, true);
  assert.equal(resume.data.completion.confidence, "review-risk");
  assert.equal(resume.data.completion.review_risks.includes("architecture_requirement"), true);
  assert.equal(resume.data.acceptance_review.status, "clear");
  assert.equal(resume.data.evidence_health.status, "clear");
  assert.equal(resume.data.architecture.decision, "missing");
  assert.equal(resume.data.next_recommendation.status, "completion-review-required");
  assert.equal(resume.data.agent_next.state, "completion_needs_review");
  assert.equal(resume.data.agent_next.recommended_skill, "nori-reporting");
  assert.equal(resume.data.acceptance_path, acceptancePath);
  assert.equal(resume.next_actions.some((action) => /Architecture Baseline review/.test(action)), true);
});

test("resume command module returns next-loop handoff without CLI candidate goals", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    goal_id: "module-goal",
    goal: "Ship a settings page with profile editing, validation, persistence, failed-save recovery, reviewable screenshots, and release-ready report copy",
    criteria: [],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "complete", criteria: {} };
  writeArchitectureRequirement(root, {
    goalId: contract.goal_id,
    status: "required",
    reason: "This fixture verifies confident completion with an active baseline."
  });
  writeArchitectureBaseline(root, buildArchitectureBaseline(root, {
    goal: contract.goal,
    goalId: contract.goal_id,
    accepted: true
  }));
  fs.writeFileSync(path.join(root, ".opennori", "agent-guide.md"), renderAgentGuideMarkdown());

  const resume = await runResumeCommand(["--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });

  assert.equal(resume.ok, true);
  assert.equal(resume.data.completion.confidence, "confident");
  assert.equal(resume.data.next_recommendation.status, "ready-for-next-loop");
  assert.equal(resume.data.agent_next.state, "ready_for_next_loop");
  assert.equal(resume.data.agent_next.recommended_skill, "nori-acceptance");
  assert.equal(resume.data.agent_next.candidate_goals, undefined);
  assert.equal(resume.data.next_recommendation.candidate_goals, undefined);
  assert.match(resume.data.agent_next.instruction, /prepare the next human-facing NoriBrief/);
  assert.equal(resume.next_actions.some((action) => /candidate_goals/.test(action)), false);
});

test("status command module includes criteria and completion state", { tags: ["cli", "reporting", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const contract = {
    goal_id: "module-goal",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can review the current delivery status."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = { status: "active", criteria: { "AC-1": { status: "unknown", evidence: [] } } };

  const status = await runStatusCommand(["--json"], {
    loadPair: () => ({ contract, ledger, root })
  });
  assert.equal(status.ok, true);
  assert.equal(status.data.goal_id, "module-goal");
  assert.equal(status.data.workflow_status, "active");
  assert.equal(status.data.completion.complete, false);
  assert.equal(status.data.completion.objective_complete, false);
  assert.equal(status.data.acceptance_review.status, "clear");
  assert.equal(status.data.evidence_health.status, "clear");
  assert.equal(status.data.architecture.decision, "missing");
  assert.equal(status.data.next_recommendation.status, "architecture-requirement-required");
  assert.equal(status.data.agent_next.state, "architecture_requirement_needs_decision");
  assert.equal(status.data.agent_next.recommended_skill, "nori-architecture-brainstorm");
  assert.equal(status.data.agent_next.current_gap_id, "AC-1");
  assert.equal(status.data.criteria.length, 1);
  assert.equal(status.data.criteria[0].id, "AC-1");
  assert.equal(status.next_actions.some((action) => /required, not_required, or waived/.test(action)), true);
});

test("approve command module marks acceptance basis approved and recomputes status", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    goal_id: "module-goal",
    goal: "Approve module acceptance",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can approve acceptance criteria."
      }
    ],
    acceptance_basis: { status: "draft" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", { kind: "test-summary", summary: "AC-1 passes.", result: "passing" });
  writeGoalDossier(paths.goalDir, contract, ledger);

  const approved = await runApproveCommand(["--summary", "User approved module criteria.", "--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(approved.ok, true);
  assert.equal(approved.data.acceptance_basis.status, "approved");
  assert.equal(approved.data.acceptance_basis.summary, "User approved module criteria.");
  assert.equal(approved.data.workflow_status, "complete");
  assert.equal(approved.data.current_gap, null);
  assert.equal(approved.data.architecture.decision, "missing");
  assert.equal(approved.data.next_recommendation.status, "completion-review-required");
  assert.equal(approved.data.agent_next.state, "completion_needs_review");
  assert.equal(approved.data.agent_next.recommended_skill, "nori-reporting");
  assert.equal(approved.next_actions.some((action) => /architecture_check/.test(action)), true);
  assert.match(fs.readFileSync(acceptancePath, "utf8"), /Status: approved/);
});

test("approve command module only changes current contract language when explicitly approved", { tags: ["cli", "reporting", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "交付设置页",
    criteria: [
      {
        id: "AC-1",
        user_story: "作为用户，我能保存设置。",
        measurement: "打开设置页并保存有效字段。",
        threshold: "刷新后仍能看到保存后的值。"
      }
    ],
    acceptance_basis: { status: "draft" }
  };
  const ledger = buildEvidenceLedger(contract);
  writeGoalDossier(paths.goalDir, contract, ledger);

  const firstApproval = await runApproveCommand(["--summary", "User approved existing contract.", "--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(firstApproval.ok, true);
  assert.equal(firstApproval.data.presentation, undefined);
  assert.match(fs.readFileSync(acceptancePath, "utf8"), /Language: en/);

  const languageApproval = await runApproveCommand(["--language", "zh-CN", "--summary", "User approved Chinese contract presentation.", "--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(languageApproval.ok, true);
  assert.equal(languageApproval.data.presentation.language, "zh-CN");
  assert.match(fs.readFileSync(acceptancePath, "utf8"), /语言: zh-CN/);
});

test("approve command module routes approved non-trivial gaps to architecture review before implementation", { tags: ["cli", "architecture", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    goal_id: "module-goal",
    goal: "Ship a settings page where users edit profile details",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can edit profile details from Account Settings."
      }
    ],
    acceptance_basis: { status: "draft" }
  };
  const ledger = buildEvidenceLedger(contract);
  writeGoalDossier(paths.goalDir, contract, ledger);

  const approved = await runApproveCommand(["--summary", "User approved module criteria.", "--json"], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });

  assert.equal(approved.ok, true);
  assert.equal(approved.data.current_gap.id, "AC-1");
  assert.equal(approved.data.architecture.decision, "missing");
  assert.equal(approved.data.next_recommendation.status, "architecture-requirement-required");
  assert.equal(approved.data.agent_next.state, "architecture_requirement_needs_decision");
  assert.equal(approved.data.agent_next.recommended_skill, "nori-architecture-brainstorm");
  assert.equal(approved.data.agent_next.current_gap_id, "AC-1");
  assert.equal(approved.next_actions.some((action) => /required, not_required, or waived/.test(action)), true);
});

test("criterion update command module clears stale evidence after a user revision", { tags: ["cli", "evidence", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Revise module acceptance",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can inspect the old criterion.",
        measurement: "Open the old screen.",
        threshold: "I can see the old behavior."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", { kind: "test-summary", summary: "Old evidence passes.", result: "passing" });
  writeGoalDossier(paths.goalDir, contract, ledger);

  const updated = await runCriterionUpdateCommand([
    "--criterion", "AC-1",
    "--user-story", "As a user, I can inspect the revised criterion.",
    "--measurement", "Open the revised screen.",
    "--threshold", "I can see the revised behavior.",
    "--summary", "User revised AC-1.",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });
  assert.equal(updated.ok, true);
  assert.equal(updated.data.acceptance_basis.status, "approved");
  assert.equal(updated.data.criterion.user_story, "As a user, I can inspect the revised criterion.");
  assert.equal(updated.data.current_gap.id, "AC-1");
  const written = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  assert.equal(written.criteria["AC-1"].status, "unknown");
  assert.equal(written.criteria["AC-1"].evidence.length, 0);
});

test("criterion update command keeps draft revisions awaiting acceptance review", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "drafts");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Revise draft acceptance",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can select a project.",
        measurement: "Open the project list and choose a project.",
        threshold: "The selected project is visible."
      }
    ],
    acceptance_basis: {
      status: "draft",
      summary: "Draft generated by enhanced autogoal.",
      source: "autogoal",
      mode: "enhanced",
      coverage_summary: ["project registry CRUD", "project selection"],
      assumptions: ["Deleting means unlinking from the registry, not deleting the local directory."]
    }
  };
  const ledger = buildEvidenceLedger(contract);
  writeGoalDossier(paths.goalDir, contract, ledger);
  await runProfileAddCommand([
    "--root", root,
    "--id", "ui-component-library-first",
    "--type", "constraint",
    "--name", "Use existing component library first",
    "--strength", "must",
    "--purpose", "Keep implementation aligned with user preference.",
    "--scope", "UI work",
    "--install-policy", "ask_before_install",
    "--json"
  ]);

  const updated = await runCriterionUpdateCommand([
    "--criterion", "AC-1",
    "--user-story", "As a user, I can add, inspect, update, unlink, and select AW registered projects.",
    "--measurement", "Open the AW project registry, add or edit a project record, unlink it from the registry, and select a visible project.",
    "--threshold", "Project CRUD affects only AW registry metadata and visible project list state; unlink never deletes the local project directory.",
    "--summary", "User revised AC-1 during draft review.",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root, location: "drafts" })
  });

  assert.equal(updated.ok, true);
  assert.equal(updated.data.acceptance_basis.status, "draft");
  assert.equal(updated.data.acceptance_basis.source, "autogoal");
  assert.equal(updated.data.acceptance_basis.mode, "enhanced");
  assert.equal(updated.data.current_gap.id, "ACCEPTANCE-BASIS");
  assert.equal(updated.data.workflow_status, "draft");
  const writtenContract = JSON.parse(fs.readFileSync(paths.contractPath, "utf8"));
  const written = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  assert.equal(writtenContract.acceptance_basis.status, "draft");
  assert.equal(writtenContract.acceptance_basis.approved_at, undefined);
  assert.equal(writtenContract.acceptance_basis.source, "autogoal");
  assert.equal(written.status, "draft");
});

test("criterion add command module extends the contract and ledger together", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-goal", "current");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-goal",
    goal: "Add module acceptance",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can inspect the existing criterion.",
        measurement: "Open the existing report.",
        threshold: "The existing criterion is visible."
      }
    ],
    acceptance_basis: { status: "approved" }
  };
  const ledger = buildEvidenceLedger(contract);
  addEvidence(contract, ledger, "AC-1", { kind: "test-summary", summary: "Existing evidence passes.", result: "passing" });
  writeGoalDossier(paths.goalDir, contract, ledger);

  const added = await runCriterionAddCommand([
    "--id", "AC-Z-18",
    "--user-story", "As a user, I can review the new product boundary.",
    "--measurement", "Read the OpenNori README and report.",
    "--threshold", "The new boundary is visible and pending evidence.",
    "--summary", "User added AC-Z-18.",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root })
  });

  assert.equal(added.ok, true);
  assert.equal(added.data.criterion.id, "AC-Z-18");
  assert.equal(added.data.criterion.layer, "productization");
  assert.equal(added.data.current_gap.id, "AC-Z-18");

  const writtenContract = JSON.parse(fs.readFileSync(paths.contractPath, "utf8"));
  const written = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  assert.equal(writtenContract.criteria.some((criterion) => criterion.id === "AC-Z-18"), true);
  assert.equal(written.criteria["AC-Z-18"].status, "unknown");
  assert.match(fs.readFileSync(acceptancePath, "utf8"), /AC-Z-18/);
});

test("criterion add command module can add draft criteria without approval", { tags: ["cli", "acceptance", "quick"] }, async () => {
  const root = tempRoot();
  const paths = goalPaths(root, "module-draft", "drafts");
  const acceptancePath = paths.acceptancePath;
  const evidencePath = paths.evidencePath;
  const contract = {
    schema_version: "opennori/contract-v1",
    protocol_version: "opennori/v1",
    goal_id: "module-draft",
    goal: "Add draft acceptance",
    criteria: [
      {
        id: "AC-1",
        user_story: "As a user, I can inspect the draft criterion.",
        measurement: "Open the draft report.",
        threshold: "The draft criterion is visible."
      }
    ],
    acceptance_basis: { status: "draft", summary: "Draft pending review." }
  };
  const ledger = buildEvidenceLedger(contract);
  ledger.status = "draft";
  writeGoalDossier(paths.goalDir, contract, ledger);

  const added = await runCriterionAddCommand([
    "--from-draft",
    "--goal", "module-draft",
    "--id", "AC-14",
    "--user-story", "As a user, I can review the missing settings boundary.",
    "--measurement", "Open settings, change the chosen value, and save it.",
    "--threshold", "The saved value persists and failed saves show a recovery message.",
    "--summary", "AC Review Loop added AC-14.",
    "--json"
  ], {
    loadPair: () => ({ contract, ledger, acceptancePath, evidencePath, root, location: "drafts" }),
    refreshManifest() {}
  });

  assert.equal(added.ok, true);
  assert.equal(added.data.criterion.id, "AC-14");
  assert.equal(added.data.acceptance_basis.status, "draft");
  assert.equal(added.data.workflow_status, "draft");
  assert.equal(added.data.current_gap.id, "ACCEPTANCE-BASIS");

  const writtenContract = JSON.parse(fs.readFileSync(paths.contractPath, "utf8"));
  const written = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  assert.equal(writtenContract.acceptance_basis.status, "draft");
  assert.equal(writtenContract.acceptance_basis.approved_at, undefined);
  assert.equal(writtenContract.criteria.some((criterion) => criterion.id === "AC-14"), true);
  assert.equal(written.status, "draft");
  assert.equal(written.criteria["AC-14"].status, "unknown");
  assert.match(fs.readFileSync(acceptancePath, "utf8"), /AC-14/);
});
