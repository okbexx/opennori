import path from "node:path";
import { defineCommand } from "citty";
import { ok } from "../../core.ts";
import { PACKAGE_JSON } from "../../lifecycle/shared.ts";
import { mcpResourceSummary } from "../../mcp/resources.ts";
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
  run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    return ok({
      ...mcpResourceSummary(root),
      command: "opennori mcp",
      transport: "stdio",
      version: String(PACKAGE_JSON.version),
      focused_goal_id: args.goal ? String(args.goal) : null
    });
  }
});

export async function runMcpCommand(rawArgs: string[]) {
  return runJsonCommand(mcpCommand, rawArgs);
}
