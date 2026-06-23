import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import { test } from "vitest";
import { tempRoot, writeBriefFile, writeActiveGoal, writeActiveGoalWithId, runDraftCommand, runInitCommand, runActivityFinishCommand, runActivityHeartbeatCommand, runActivityShowCommand, runActivityStartCommand, runDashboardCommand, runDoctorCommand, runProfileAddCommand, appendEvent, readEvents, refreshSnapshot, snapshotPath, startDashboardServer, goalPaths } from "./support/command-fixtures.js";

test("kernel events activity and snapshot expose dashboard state without replacing source files", { tags: ["cli", "dashboard"] }, async () => {
  const root = tempRoot();
  writeActiveGoal(root);

  const first = appendEvent(root, {
    type: "goal.created",
    goal_id: "module-goal",
    actor: { kind: "agent", name: "Codex", skill: "nori-acceptance" },
    summary: "Created a module goal."
  });
  const second = appendEvent(root, {
    type: "gap.changed",
    goal_id: "module-goal",
    gap_id: "ACCEPTANCE-BASIS",
    actor: { kind: "agent", name: "Codex", skill: "nori-reporting" },
    summary: "Current gap changed."
  });
  assert.equal(first.seq, 1);
  assert.equal(second.seq, 2);
  assert.equal(readEvents(root).length, 2);

  const started = await runActivityStartCommand([
    "--root", root,
    "--agent", "Codex",
    "--skill", "nori-evidence",
    "--state", "verifying",
    "--goal", "module-goal",
    "--gap", "AC-1",
    "--summary", "Verifying the active gap.",
    "--json"
  ]);
  assert.equal(started.ok, true);
  assert.equal(started.data.activity.agent, "Codex");
  assert.equal("snapshot" in started.data, false);
  assert.equal(started.data.snapshot_summary.agent_state, "verifying");
  assert.equal(started.data.snapshot_summary.current_gap_id, "AC-1");
  assert.equal(started.data.snapshot_path, ".opennori/snapshots/current.json");
  assert.equal(readEvents(root).some((event) => event.type === "ac.started" && event.gap_id === "AC-1"), true);

  const heartbeat = await runActivityHeartbeatCommand(["--root", root, "--agent", "Codex", "--state", "working", "--json"]);
  assert.equal(heartbeat.data.activity.state, "working");
  assert.equal(heartbeat.data.snapshot_summary.agent_state, "working");

  const shown = await runActivityShowCommand(["--root", root, "--json"]);
  assert.equal(shown.data.activity.state, "working");
  assert.equal(shown.data.snapshot_summary.agent_state, "working");

  const finished = await runActivityFinishCommand(["--root", root, "--summary", "Done for now.", "--json"]);
  assert.equal(finished.data.activity.state, "idle");
  assert.equal(finished.data.snapshot_summary.agent_state, "idle");
  assert.equal(readEvents(root).some((event) => event.type === "ac.finished" && event.gap_id === "AC-1"), true);

  const snapshot = refreshSnapshot(root, { goalId: "module-goal" });
  assert.equal(snapshot.goal.id, "module-goal");
  assert.equal(snapshot.goal.dossier.path, ".opennori/current/module-goal");
  assert.equal(snapshot.goal.dossier.readme_path, ".opennori/current/module-goal/README.md");
  assert.equal(snapshot.goal.dossier.contract_path, ".opennori/current/module-goal/contract.json");
  assert.equal(snapshot.goal.dossier.ledger_path, ".opennori/current/module-goal/ledger.json");
  assert.equal(snapshot.goal.dossier.criteria_path, ".opennori/current/module-goal/criteria");
  assert.equal(snapshot.current_gap.id, "AC-1");
  assert.equal(snapshot.current_gap.dossier.path, ".opennori/current/module-goal/criteria/AC-1");
  assert.equal(snapshot.current_gap.dossier.criterion_path, ".opennori/current/module-goal/criteria/AC-1/criterion.json");
  assert.equal(snapshot.current_gap.dossier.status_path, ".opennori/current/module-goal/criteria/AC-1/status.json");
  assert.equal(snapshot.current_gap.dossier.evidence_path, ".opennori/current/module-goal/criteria/AC-1/evidence");
  assert.equal(snapshot.current_gap.dossier.artifacts_path, ".opennori/current/module-goal/criteria/AC-1/artifacts");
  assert.equal(snapshot.criteria.find((criterion) => criterion.id === "AC-1").dossier.readme_path, ".opennori/current/module-goal/criteria/AC-1/README.md");
  assert.equal(snapshot.capability_profile.items.length, 0);
  assert.equal(snapshot.capability_compliance.complete, true);
  assert.equal(snapshot.outcome_summary.decision.state, "not_complete");
  assert.equal(snapshot.outcome_summary.decision.label, "Not complete yet");
  assert.equal(snapshot.outcome_summary.current_gap.id, "AC-1");
  assert.match(snapshot.outcome_summary.next.action, /AC-1/);
  assert.equal(snapshot.outcome_summary.profile.state, "idle");
  assert.equal(fs.existsSync(snapshotPath(root)), true);
  assert.equal(fs.existsSync(goalPaths(root, "module-goal").evidencePath), true);
});

test("dashboard snapshot exposes Project Profile without turning it into an AC node", { tags: ["cli", "dashboard", "profile", "quick"] }, async () => {
  const root = tempRoot();
  writeActiveGoalWithId(root, "module-goal");
  await runProfileAddCommand([
    "--root", root,
    "--type", "skill",
    "--name", "design-taste-frontend",
    "--strength", "must",
    "--purpose", "Generate a design read before implementation.",
    "--scope", "frontend UI work",
    "--install-policy", "existing_only",
    "--json"
  ]);

  const snapshot = refreshSnapshot(root, { goalId: "module-goal" });
  assert.equal(snapshot.capability_profile.items.length, 1);
  assert.equal(snapshot.capability_compliance.complete, false);
  assert.equal(snapshot.capability_compliance.blocking[0].id, "skill-design-taste-frontend");
  assert.equal(snapshot.outcome_summary.profile.scope, "current_goal_compliance");
  assert.equal(snapshot.outcome_summary.profile.state, "blocked");
  assert.match(snapshot.outcome_summary.profile.detail, /must\/avoid/);
  assert.equal(snapshot.criteria.some((criterion) => criterion.id === "skill-design-taste-frontend"), false);
});

test("activity commands infer the unique current gap for dashboard publishing only", { tags: ["cli", "dashboard"] }, async () => {
  const root = tempRoot();
  writeActiveGoalWithId(root, "module-goal");
  const paths = goalPaths(root, "module-goal");
  const before = fs.readFileSync(paths.evidencePath, "utf8");

  const started = await runActivityStartCommand([
    "--root", root,
    "--agent", "Codex",
    "--skill", "nori-architecture-apply",
    "--summary", "Applying the baseline to the current gap.",
    "--json"
  ]);

  assert.equal(started.ok, true);
  assert.equal(started.data.activity.goal_id, "module-goal");
  assert.equal(started.data.activity.gap_id, "AC-1");
  assert.equal(started.data.target.inferred, true);
  assert.equal("snapshot" in started.data, false);
  assert.equal(started.data.snapshot_summary.goal_id, "module-goal");
  assert.equal(started.data.snapshot_summary.current_gap_id, "AC-1");
  assert.equal(fs.existsSync(snapshotPath(root)), true);

  const heartbeat = await runActivityHeartbeatCommand([
    "--root", root,
    "--skill", "nori-architecture-apply",
    "--state", "verifying",
    "--summary", "Checking user-visible behavior.",
    "--json"
  ]);

  assert.equal(heartbeat.ok, true);
  assert.equal(heartbeat.data.activity.goal_id, "module-goal");
  assert.equal(heartbeat.data.activity.gap_id, "AC-1");
  assert.equal(heartbeat.data.activity.state, "verifying");

  const finished = await runActivityFinishCommand([
    "--root", root,
    "--skill", "nori-architecture-apply",
    "--summary", "Activity finished.",
    "--json"
  ]);

  assert.equal(finished.ok, true);
  assert.equal(finished.data.activity.state, "idle");
  assert.equal(fs.readFileSync(paths.evidencePath, "utf8"), before);
  assert.equal(readEvents(root).some((event) => event.type === "ac.started" && event.gap_id === "AC-1"), true);
  assert.equal(readEvents(root).some((event) => event.type === "ac.finished" && event.gap_id === "AC-1"), true);
  assert.equal(readEvents(root).some((event) => event.type === "activity.started"), true);
  assert.equal(readEvents(root).some((event) => event.type === "evidence.added"), false);
});

test("activity start ignores drafts and requires a current goal before publishing dashboard state", { tags: ["cli", "dashboard", "acceptance"] }, async () => {
  const root = tempRoot();
  await runInitCommand(["--root", root, "--confirm", "--json"]);
  await runDraftCommand(["--root", root, "--brief", writeBriefFile(root, "Ship first goal", { goalId: "first-goal" }), "--json"]);
  await runDraftCommand(["--root", root, "--brief", writeBriefFile(root, "Ship second goal", { goalId: "second-goal" }), "--json"]);

  const doctor = await runDoctorCommand(["--root", root, "--json"]);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.data.agent_next.state, "initialized_no_active_contract");
  assert.equal(doctor.data.agent_next.needs_user, true);
  assert.equal(doctor.data.agent_next.dashboard_activity, undefined);
  assert.match(doctor.data.agent_next.instruction, /draft Nori Contract/);

  const noCurrent = await runActivityStartCommand([
    "--root", root,
    "--skill", "nori-evidence",
    "--summary", "Verifying a gap.",
    "--json"
  ]);

  assert.equal(noCurrent.ok, true);
  assert.equal(noCurrent.data.target, null);
  assert.equal(noCurrent.data.snapshot_summary.status, "no_active_goal");
  assert.equal(noCurrent.data.snapshot_summary.goal_id, null);
});

test("dashboard no-current snapshot summarizes the latest historical outcome", { tags: ["cli", "dashboard", "quick"] }, () => {
  const root = tempRoot();
  writeActiveGoalWithId(root, "finished-goal", "complete", "completed");

  const snapshot = refreshSnapshot(root);

  assert.equal(snapshot.status, "no_active_goal");
  assert.equal(snapshot.goal, null);
  assert.equal(snapshot.decision, "no_active_goal");
  assert.equal(snapshot.idle_summary.state, "no_current_goal");
  assert.equal(snapshot.idle_summary.last_goal.id, "finished-goal");
  assert.equal(snapshot.idle_summary.last_goal.workflow_status, "complete");
  assert.equal(snapshot.idle_summary.last_goal.location, "completed");
  assert.equal(snapshot.idle_summary.last_goal.dossier_path, ".opennori/completed/finished-goal");
  assert.equal(snapshot.idle_summary.last_goal.readme_path, ".opennori/completed/finished-goal/README.md");
  assert.equal(snapshot.idle_summary.last_goal.report_path, ".opennori/reports/finished-goal.report.md");
  assert.equal(snapshot.outcome_summary.decision.state, "no_active_goal");
  assert.equal(snapshot.outcome_summary.current_gap.id, null);
  assert.equal(snapshot.outcome_summary.profile.scope, "project_only");
  assert.equal(snapshot.outcome_summary.profile.state, "idle");
  assert.match(snapshot.idle_summary.next, /next goal/i);
});

test("activity start refuses invalid multiple current goals instead of attaching dashboard state to the wrong target", { tags: ["cli", "dashboard", "acceptance"] }, async () => {
  const root = tempRoot();
  writeActiveGoalWithId(root, "first-goal");
  writeActiveGoalWithId(root, "second-goal");

  const doctor = await runDoctorCommand(["--root", root, "--json"]);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.data.status, "broken");
  assert.equal(doctor.data.agent_next.state, "health_needs_recovery");
  assert.equal(doctor.data.agent_next.dashboard_activity, undefined);

  const ambiguous = await runActivityStartCommand([
    "--root", root,
    "--skill", "nori-evidence",
    "--summary", "Verifying a gap.",
    "--json"
  ]);

  assert.equal(ambiguous.ok, false);
  assert.equal(ambiguous.error.type, "ambiguous_activity_target");
  assert.match(ambiguous.error.message, /multiple current goals/);

  const explicit = await runActivityStartCommand([
    "--root", root,
    "--goal", "second-goal",
    "--skill", "nori-evidence",
    "--summary", "Verifying second goal.",
    "--json"
  ]);

  assert.equal(explicit.ok, true);
  assert.equal(explicit.data.activity.goal_id, "second-goal");
  assert.equal(explicit.data.activity.gap_id, "AC-1");
  assert.equal(explicit.data.target.inferred, false);
});

test("dashboard snapshot ignores drafts and follows the unique current goal", { tags: ["cli", "dashboard", "acceptance"] }, async () => {
  const root = tempRoot();
  writeActiveGoalWithId(root, "first-goal");
  writeActiveGoalWithId(root, "second-goal", "active", "drafts");

  const started = await runActivityStartCommand([
    "--root", root,
    "--skill", "nori-evidence",
    "--state", "verifying",
    "--summary", "Verifying the current goal gap.",
    "--json"
  ]);

  assert.equal(started.ok, true);
  const snapshot = refreshSnapshot(root);
  assert.equal(snapshot.goal.id, "first-goal");
  assert.equal(snapshot.agent.skill, "nori-evidence");
  assert.equal(snapshot.agent.state, "verifying");
  assert.equal(snapshot.current_gap.id, "AC-1");
});

test("dashboard command can start the local kernel without opening a browser", { tags: ["cli", "dashboard"] }, async () => {
  const root = tempRoot();
  const dashboard = await runDashboardCommand(["--root", root, "--port", "0", "--no-open", "--once", "--json"]);

  assert.equal(dashboard.ok, true);
  assert.match(dashboard.data.url, /^http:\/\/127\.0\.0\.1:\d+\//);
  assert.equal(dashboard.data.side_effect, "started-and-closed");
  assert.equal(readEvents(root).some((event) => event.type === "dashboard.started"), true);
});

test("dashboard rejects non-GET requests with a deterministic error", { tags: ["cli", "dashboard"] }, async () => {
  const root = tempRoot();
  const handle = await startDashboardServer({ root, port: 0, open: false });
  const response = await fetch(`${handle.url}api/snapshot`, { method: "POST" });
  const payload = await response.json();
  handle.server.close();

  assert.equal(response.status, 405);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.type, "method_not_allowed");
});

test("dashboard exposes observation only and rejects confirmation-style control writes", { tags: ["cli", "dashboard"] }, async () => {
  const root = tempRoot();
  const handle = await startDashboardServer({ root, port: 0, open: false });
  const controlPaths = [
    "api/confirm",
    "api/approve",
    "api/waive",
    "api/evidence",
    "api/activity"
  ];

  for (const controlPath of controlPaths) {
    const response = await fetch(`${handle.url}${controlPath}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision: "confirm" })
    });
    const payload = await response.json();

    assert.equal(response.status, 405);
    assert.equal(payload.ok, false);
    assert.equal(payload.error.type, "method_not_allowed");
  }

  const snapshot = await fetch(`${handle.url}api/snapshot`);
  handle.server.close();

  assert.equal(snapshot.status, 200);
});

test("dashboard serves the built React app and assets", { tags: ["cli", "dashboard"] }, async () => {
  const root = tempRoot();
  const handle = await startDashboardServer({ root, port: 0, open: false });
  const page = await fetch(handle.url);
  const html = await page.text();
  const assetMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);

  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type") || "", /text\/html/);
  assert.match(html, /OpenNori Dashboard/);
  assert.match(html, /id="root"/);
  assert.notEqual(assetMatch, null);

  const script = await fetch(`${handle.url}${assetMatch[1].slice(1)}`);
  const scriptText = await script.text();
  handle.server.close();

  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type") || "", /text\/javascript/);
  assert.match(scriptText, /Observation only|Acceptance Radar Net/);
  assert.match(scriptText, /reply in agent chat|Agent reply/);
  assert.doesNotMatch(scriptText, /Confirm/);
  assert.doesNotMatch(scriptText, /Waive/);
});

test("dashboard SSE emits generic and typed event frames", { tags: ["cli", "dashboard"] }, async () => {
  const root = tempRoot();
  const handle = await startDashboardServer({ root, port: 0, open: false });
  let responseText = "";
  const request = http.get(`${handle.url}api/events`, (response) => {
    response.setEncoding("utf8");
    response.on("data", (chunk) => {
      responseText += chunk;
      if (responseText.includes("event: dashboard.started")) {
        request.destroy();
        handle.server.close();
      }
    });
  });

  await new Promise((resolve, reject) => {
    request.on("close", resolve);
    request.on("error", reject);
  });

  assert.match(responseText, /(^|\n)id: 1\ndata: /);
  assert.match(responseText, /\nevent: dashboard\.started\n/);
});

test("dashboard SSE stays read-only and does not refresh snapshot on heartbeat", { tags: ["cli", "dashboard"] }, async () => {
  const root = tempRoot();
  const handle = await startDashboardServer({ root, port: 0, open: false });
  const currentSnapshotPath = snapshotPath(root);
  fs.rmSync(currentSnapshotPath, { force: true });

  let heartbeatSeen = false;
  const request = http.get(`${handle.url}api/events?after=1`, (response) => {
    response.setEncoding("utf8");
    response.on("data", (chunk) => {
      if (chunk.includes(": heartbeat")) {
        heartbeatSeen = true;
        request.destroy();
        handle.server.close();
      }
    });
  });

  await new Promise((resolve, reject) => {
    request.on("close", resolve);
    request.on("error", reject);
  });

  assert.equal(heartbeatSeen, true);
  assert.equal(fs.existsSync(currentSnapshotPath), false);
});
