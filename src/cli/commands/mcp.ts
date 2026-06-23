import path from "node:path";
import { defineCommand } from "citty";
import { ok } from "../../core.ts";
import { PACKAGE_JSON } from "../../lifecycle/shared.ts";
import { MCP_CAPABILITY_MODEL, mcpResourceSummary } from "../../mcp/resources.ts";
import { serveOpenNoriMcpStdio } from "../../mcp/server.ts";
import { runJsonCommand } from "../runtime.ts";

export const mcpCommand = defineCommand({
  meta: {
    name: "mcp",
    description: "Start the read-only OpenNori MCP context server over stdio."
  },
  args: {
    root: {
      type: "string",
      description: "Project root.",
      default: process.cwd()
    },
    goal: {
      type: "string",
      description: "Optional goal id for the snapshot resource."
    },
    json: {
      type: "boolean",
      description: "Print MCP resource metadata instead of starting stdio. Used by tests and agents.",
      default: false
    }
  },
  async run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    const goalId = args.goal ? String(args.goal) : undefined;
    if (!args.json) {
      await serveOpenNoriMcpStdio({
        root,
        goalId,
        version: String(PACKAGE_JSON.version)
      });
      return ok({
        side_effect: "stdio_server_started"
      });
    }
    return ok({
      ...mcpResourceSummary(root),
      command: "opennori mcp",
      transport: MCP_CAPABILITY_MODEL.transport,
      version: String(PACKAGE_JSON.version),
      focused_goal_id: goalId || null
    });
  }
});

export async function runMcpCommand(rawArgs: string[]) {
  return runJsonCommand(mcpCommand, rawArgs);
}
