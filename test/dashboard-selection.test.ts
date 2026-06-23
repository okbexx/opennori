import assert from "node:assert/strict";
import { test } from "vitest";
import { dashboardOutcomeRows } from "../src/dashboard/src/dashboard-view.ts";
import { buildAcceptanceRadarModel, getNodeColor, getNodePulseClass, getRadarLinkStyle } from "../src/dashboard/src/radar-model.ts";
import { gapIdFromFocusEvent, profileNodeFromSnapshot, renderedCriterionNodeFromSnapshot, syncSelectedNodeWithSnapshot } from "../src/dashboard/src/selection.ts";
import type { NoriSnapshot } from "../src/dashboard/src/types.ts";

function snapshotWithCriteria(criteria: NonNullable<NoriSnapshot["criteria"]>): NoriSnapshot {
  return {
    schema_version: "opennori/snapshot-v1",
    generated_at: "2026-06-20T00:00:00.000Z",
    root: "/tmp/opennori-dashboard",
    status: "active",
    agent: {
      name: "Codex",
      skill: "nori-evidence",
      state: "working",
      summary: "Working on the active gap."
    },
    goal: {
      id: "dashboard-goal",
      label: "Ship dashboard observation",
      workflow_status: "active"
    },
    current_gap: {
      id: "AC-3",
      label: "Review the current gap.",
      status: "unknown",
      reason: "Needs evidence."
    },
    need_user: false,
    decision: "not_complete",
    architecture: {
      decision: "valid",
      profile: "dashboard"
    },
    loop: {
      goal: "ready",
      contract: "approved",
      gap: "active",
      evidence: "needs_evidence",
      decision: "pending"
    },
    last_event: null,
    criteria,
    events: []
  };
}

test("dashboard selection maps passed AC focus to the rendered Passed aggregate", { tags: ["dashboard", "quick"] }, () => {
  const snapshot = snapshotWithCriteria([
    {
      id: "AC-2",
      user_story: "As a user, I can inspect a completed criterion.",
      measurement: "Open the dashboard and select the passed group.",
      threshold: "The passed criterion stays visible inside the aggregate.",
      status: "passing",
      confidence: "review-required",
      evidence: [],
      dossier: {
        path: ".opennori/current/dashboard-goal/criteria/AC-2",
        readme_path: ".opennori/current/dashboard-goal/criteria/AC-2/README.md",
        criterion_path: ".opennori/current/dashboard-goal/criteria/AC-2/criterion.json",
        status_path: ".opennori/current/dashboard-goal/criteria/AC-2/status.json",
        evidence_path: ".opennori/current/dashboard-goal/criteria/AC-2/evidence",
        artifacts_path: ".opennori/current/dashboard-goal/criteria/AC-2/artifacts"
      }
    },
    {
      id: "AC-3",
      user_story: "As a user, I can inspect the current gap.",
      measurement: "Open the dashboard and select AC-3.",
      threshold: "The AC-3 panel is selected.",
      status: "unknown",
      confidence: "none",
      evidence: []
    }
  ]);

  const node = renderedCriterionNodeFromSnapshot(snapshot, "AC-2");
  assert.equal(node?.id, "passed-group");
  assert.equal(node?.subLabel, "1");
  assert.equal((node?.rawData as { focused_id?: string }).focused_id, "AC-2");
  const rawData = node?.rawData as { criteria: Array<{ dossier?: { readme_path?: string } }> };
  assert.equal(rawData.criteria.at(0)?.dossier?.readme_path, ".opennori/current/dashboard-goal/criteria/AC-2/README.md");
});

test("dashboard radar model projects goal passed aggregate current gap and evidence nodes", { tags: ["dashboard", "quick", "unit"] }, () => {
  const snapshot = snapshotWithCriteria([
    {
      id: "AC-1",
      user_story: "As a user, I can inspect a completed criterion.",
      measurement: "Open the dashboard and inspect the passed aggregate.",
      threshold: "The completed criterion is grouped into Passed.",
      status: "passing",
      confidence: "verified",
      evidence: []
    },
    {
      id: "AC-3",
      user_story: "As a user, I can inspect the current gap.",
      measurement: "Open the dashboard and inspect AC-3 and its evidence.",
      threshold: "AC-3 remains visible as the current gap with reviewable evidence.",
      status: "needs_evidence",
      confidence: "review-required",
      evidence: [
        {
          kind: "command",
          result: "failing",
          summary: "The evidence is intentionally not passing."
        }
      ]
    }
  ]);

  const model = buildAcceptanceRadarModel(snapshot, { width: 1000, height: 800 });

  assert.equal(model.goalId, "dashboard-goal");
  assert.equal(model.currentGapNodeId, "ac-AC-3");
  assert.equal(model.isAgentActive, true);
  assert.equal(model.grid.circles.length, 5);
  assert.equal(model.grid.spokes.length, 8);

  const goal = model.nodes.find((node) => node.id === "dashboard-goal");
  const passed = model.nodes.find((node) => node.id === "passed-group");
  const currentGap = model.nodes.find((node) => node.id === "ac-AC-3");
  const evidence = model.nodes.find((node) => node.id === "ev-AC-3-0");
  assert.equal(goal?.type, "goal");
  assert.equal(passed?.subLabel, "1");
  assert.equal(currentGap?.status, "needs_evidence");
  assert.equal(evidence?.type, "evidence");

  const currentGapLink = model.links.find((link) => link.targetId === "ac-AC-3");
  const evidenceLink = model.links.find((link) => link.targetId === "ev-AC-3-0");
  assert.ok(currentGapLink);
  assert.equal(currentGapLink?.isMoving, true);
  assert.equal(evidenceLink?.isMoving, true);
  assert.equal(getRadarLinkStyle(currentGapLink, model.goalId).strokeWidth, 2.5);
  assert.equal(getNodeColor("needs_evidence", "ac"), "#fbbf24");
  assert.equal(getNodePulseClass("needs_evidence", "ac", model.isAgentActive), "pulse-warning");
});

test("dashboard selection follows visual state when a focused aggregate AC becomes unpassed", { tags: ["dashboard", "quick"] }, () => {
  const selectedPassedGroup = {
    id: "passed-group",
    type: "ac" as const,
    label: "Passed",
    status: "passed_group",
    x: 0,
    y: 0,
    rawData: { focused_id: "AC-2" }
  };
  const snapshot = snapshotWithCriteria([
    {
      id: "AC-2",
      user_story: "As a user, I can inspect a criterion that needs rework.",
      measurement: "Open the dashboard and inspect AC-2.",
      threshold: "The AC node is visible outside the aggregate.",
      status: "unknown",
      confidence: "none",
      evidence: []
    }
  ]);

  const node = syncSelectedNodeWithSnapshot(selectedPassedGroup, snapshot);
  assert.equal(node?.id, "ac-AC-2");
  assert.equal(node?.label, "AC-2");
});

test("dashboard focus events include evidence and architecture changes", { tags: ["dashboard", "quick"] }, () => {
  assert.equal(gapIdFromFocusEvent({
    schema_version: "opennori/event-v1",
    id: "evt_1",
    seq: 1,
    type: "evidence.added",
    goal_id: "dashboard-goal",
    gap_id: "AC-3",
    actor: { kind: "agent", name: "Codex", skill: "nori-evidence" },
    summary: "Evidence was added.",
    created_at: "2026-06-20T00:00:00.000Z"
  }), "AC-3");

  assert.equal(gapIdFromFocusEvent({
    schema_version: "opennori/event-v1",
    id: "evt_2",
    seq: 2,
    type: "architecture.changed",
    goal_id: "dashboard-goal",
    gap_id: "AC-4",
    actor: { kind: "agent", name: "Codex", skill: "nori-architecture-apply" },
    summary: "Architecture alignment changed.",
    created_at: "2026-06-20T00:00:01.000Z"
  }), "AC-4");
});

test("dashboard profile node syncs Project Profile compliance from snapshots", { tags: ["dashboard", "quick"] }, () => {
  const snapshot = snapshotWithCriteria([]);
  snapshot.capability_profile = {
    items: [
      {
        id: "skill-design-taste-frontend",
        type: "skill",
        name: "design-taste-frontend",
        strength: "must",
        purpose: "Generate a design read before implementation.",
        scope: "frontend UI work",
        install_policy: "existing_only",
        evidence: []
      }
    ]
  };
  snapshot.capability_compliance = {
    required: true,
    complete: false,
    blocking: [
      {
        id: "skill-design-taste-frontend",
        type: "skill",
        name: "design-taste-frontend",
        strength: "must",
        purpose: "Generate a design read before implementation.",
        status: "unknown",
        summary: "<none>"
      }
    ],
    review: [],
    statuses: [
      {
        id: "skill-design-taste-frontend",
        type: "skill",
        name: "design-taste-frontend",
        strength: "must",
        purpose: "Generate a design read before implementation.",
        status: "unknown",
        summary: "<none>"
      }
    ]
  };

  const node = profileNodeFromSnapshot(snapshot);
  assert.equal(node.id, "profile");
  assert.equal(node.type, "profile");
  assert.equal(node.status, "review");
  assert.equal((node.rawData as { compliance: { blocking: unknown[] } }).compliance.blocking.length, 1);

  snapshot.capability_compliance = {
    required: true,
    complete: true,
    blocking: [],
    review: [],
    statuses: [
      {
        id: "skill-design-taste-frontend",
        type: "skill",
        name: "design-taste-frontend",
        strength: "must",
        purpose: "Generate a design read before implementation.",
        status: "satisfied",
        summary: "Skill was used."
      }
    ]
  };

  const synced = syncSelectedNodeWithSnapshot(node, snapshot);
  assert.equal(synced?.id, "profile");
  assert.equal(synced?.status, "satisfied");
  assert.equal((synced?.rawData as { compliance: { complete: boolean } }).compliance.complete, true);
});

test("dashboard profile node is not evaluated when there is no current goal", { tags: ["dashboard", "quick"] }, () => {
  const snapshot = snapshotWithCriteria([]);
  snapshot.status = "no_active_goal";
  snapshot.goal = null;
  snapshot.current_gap = null;
  snapshot.decision = "no_active_goal";
  snapshot.idle_summary = {
    state: "no_current_goal",
    message: "No current Nori Contract is being observed.",
    next: "Ask the agent to use OpenNori for the next goal.",
    last_goal: {
      id: "completed-goal",
      label: "Ship completed goal",
      workflow_status: "complete",
      location: "completed",
      dossier_path: ".opennori/completed/completed-goal",
      readme_path: ".opennori/completed/completed-goal/README.md",
      report_path: ".opennori/reports/completed-goal.report.md"
    }
  };
  snapshot.capability_profile = { items: [] };
  snapshot.capability_compliance = {
    required: false,
    complete: false,
    blocking: [],
    review: [],
    statuses: []
  };

  const node = profileNodeFromSnapshot(snapshot);
  const rawData = node.rawData as { scope: string; idle_summary: NonNullable<NoriSnapshot["idle_summary"]> };

  assert.equal(node.status, "not_evaluated");
  assert.equal(rawData.scope, "project_only");
  assert.equal(rawData.idle_summary.last_goal?.id, "completed-goal");
});

test("dashboard outcome rows explain completion current gap next action and profile scope", { tags: ["dashboard", "quick", "unit"] }, () => {
  const snapshot = snapshotWithCriteria([
    {
      id: "AC-1",
      user_story: "As a user, I can inspect a completed criterion.",
      measurement: "Open the dashboard and inspect passed criteria.",
      threshold: "The completed criterion appears as done.",
      status: "passing",
      confidence: "verified",
      evidence: []
    },
    {
      id: "AC-3",
      user_story: "As a user, I can inspect the current gap.",
      measurement: "Open the dashboard and inspect AC-3.",
      threshold: "AC-3 shows the next action.",
      status: "needs_evidence",
      confidence: "review-required",
      evidence: []
    }
  ]);
  snapshot.outcome_summary = {
    decision: {
      state: "not_complete",
      label: "Not complete yet",
      detail: "AC-3 has no reviewable evidence."
    },
    current_gap: {
      id: "AC-3",
      label: "Inspect the current gap.",
      detail: "AC-3 is needs_evidence: record evidence."
    },
    need_user: {
      required: false,
      label: "No user action needed",
      action: "No user action needed."
    },
    next: {
      label: "Next",
      action: "Verify AC-3 and attach evidence."
    },
    profile: {
      scope: "current_goal_compliance",
      state: "clear",
      label: "Project Profile clear",
      detail: "Current goal has no blocking Project Profile compliance gaps."
    }
  };

  const rows = dashboardOutcomeRows(snapshot);
  assert.equal(rows.find((row) => row.label === "Goal")?.detail, "1/2 acceptance checks have passing or waived evidence.");
  assert.equal(rows.find((row) => row.label === "Current gap")?.value, "AC-3: Inspect the current gap.");
  assert.equal(rows.find((row) => row.label === "Agent can continue")?.detail, "Verify AC-3 and attach evidence.");
  assert.match(rows.find((row) => row.label === "Project Profile")?.detail || "", /current goal/i);

  snapshot.status = "no_active_goal";
  snapshot.goal = null;
  snapshot.criteria = [];
  snapshot.decision = "no_active_goal";
  snapshot.outcome_summary.profile.scope = "project_only";
  snapshot.outcome_summary.profile.state = "idle";
  const idleRows = dashboardOutcomeRows(snapshot);
  assert.equal(idleRows.find((row) => row.label === "Goal")?.value, "No current Nori Contract");
  assert.match(idleRows.find((row) => row.label === "Project Profile")?.detail || "", /Project-level preferences/);
});
