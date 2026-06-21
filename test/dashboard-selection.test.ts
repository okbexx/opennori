import assert from "node:assert/strict";
import { test } from "vitest";
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
