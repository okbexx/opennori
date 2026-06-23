import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";
import { helpTextFor, resolveCliCommand, runCliCommand } from "../src/cli/command-tree.ts";
import { runMcpCommand } from "../src/cli/commands/mcp.ts";
import { buildMcpContextResource, buildMcpDoctorResource, buildMcpSnapshotResource, mcpResourceText } from "../src/mcp/resources.ts";
import { snapshotPath } from "../src/core.ts";
import type { JsonObject, NoriResult } from "../src/types.ts";
import { tempRoot, writeActiveGoal } from "./support/command-fixtures.js";

type McpResourceSummary = JsonObject & {
  schema_version: "opennori/mcp-resource-summary-v1";
  side_effect: "none";
  transport: "stdio";
  tools: unknown[];
  resources: Array<{ uri: string }>;
};

test("MCP resources expose current OpenNori context without writing snapshot state", { tags: ["cli", "reporting", "dashboard", "quick"] }, async () => {
  const root = tempRoot();
  writeActiveGoal(root);
  const currentSnapshotPath = snapshotPath(root);
  assert.equal(fs.existsSync(currentSnapshotPath), false);

  const context = buildMcpContextResource(root);
  assert.equal(context.ok, true);
  assert.equal(context.data.schema_version, "opennori/mcp-context-resource-v1");
  assert.equal(["ready", "health_needs_recovery"].includes(context.data.status), true);
  assert.equal(context.data.side_effect, "none");
  assert.equal(context.data.context?.goal_id, "module-goal");
  assert.equal(context.data.doctor.current_goal?.goal_id, "module-goal");
  assert.equal(typeof context.data.doctor.status, "string");

  const snapshot = buildMcpSnapshotResource(root);
  assert.equal(snapshot.ok, true);
  assert.equal(snapshot.data.schema_version, "opennori/mcp-snapshot-resource-v1");
  assert.equal(snapshot.data.side_effect, "none");
  assert.equal(snapshot.data.snapshot.goal?.id, "module-goal");
  assert.equal(fs.existsSync(currentSnapshotPath), false);

  const text = mcpResourceText(context);
  assert.equal(text.includes('"schema_version": "opennori/mcp-context-resource-v1"'), true);
});

test("MCP context returns doctor recovery state instead of failing when no current goal exists", { tags: ["cli", "reporting", "quick"] }, () => {
  const root = tempRoot();

  const context = buildMcpContextResource(root);
  assert.equal(context.ok, true);
  assert.equal(context.data.status, "health_needs_recovery");
  assert.equal(context.data.context, null);
  assert.equal(context.data.doctor.current_goal, null);
  assert.equal(context.data.next_actions.length > 0, true);

  const doctor = buildMcpDoctorResource(root);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.data.side_effect, "none");
  assert.equal(doctor.data.doctor.status, context.data.doctor.status);
});

test("MCP command exposes read-only resource metadata without starting stdio when --json is used", { tags: ["cli", "unit", "quick"] }, async () => {
  const root = tempRoot();
  const summary = await runMcpCommand(["--root", root, "--json"]) as NoriResult<McpResourceSummary>;

  assert.equal(summary.ok, true);
  if (!summary.ok) return;
  assert.equal(summary.data.schema_version, "opennori/mcp-resource-summary-v1");
  assert.equal(summary.data.side_effect, "none");
  assert.equal(summary.data.transport, "stdio");
  assert.equal(summary.data.tools.length, 0);
  assert.equal(summary.data.resources.some((resource) => resource.uri === "opennori://project/context"), true);

  const help = await helpTextFor(["mcp", "--help"]);
  assert.match(help, /read-only OpenNori MCP context server/);
  assert.match(help, /--root/);
});

test("MCP command is routed through the shared CLI command registry", { tags: ["cli", "unit", "quick"] }, async () => {
  const root = tempRoot();
  const resolved = await resolveCliCommand(["mcp", "--root", root, "--json"]);
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  assert.deepEqual(resolved.path, ["mcp"]);
  assert.equal(resolved.policy.stdioServer, true);

  const summary = await runCliCommand(resolved) as NoriResult<McpResourceSummary>;
  assert.equal(summary.ok, true);
  if (!summary.ok) return;
  assert.equal(summary.data.root, root);
  assert.equal(summary.data.transport, "stdio");
  assert.equal(summary.data.tools.length, 0);
});
