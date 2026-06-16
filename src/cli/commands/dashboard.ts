import path from "node:path";
import { defineCommand } from "citty";
import { ok } from "../../core.ts";
import { startDashboardServer } from "../../kernel/server.ts";
import { runJsonCommand } from "../runtime.ts";

export const dashboardCommand = defineCommand({
  meta: {
    name: "dashboard",
    description: "Start the local OpenNori visual dashboard kernel."
  },
  args: {
    root: {
      type: "string",
      description: "Project root.",
      default: process.cwd()
    },
    goal: {
      type: "string",
      description: "Optional goal id to focus."
    },
    host: {
      type: "string",
      description: "Loopback host.",
      default: "127.0.0.1"
    },
    port: {
      type: "string",
      description: "Port to listen on.",
      default: "8765"
    },
    noOpen: {
      type: "boolean",
      description: "Do not open the dashboard in a browser.",
      default: false
    },
    once: {
      type: "boolean",
      description: "Start and immediately close after returning the dashboard URL. Used by tests.",
      default: false
    },
    json: {
      type: "boolean",
      description: "Keep deterministic JSON output for agents.",
      default: false
    }
  },
  async run({ args }) {
    const root = path.resolve(String(args.root || process.cwd()));
    const handle = await startDashboardServer({
      root,
      goalId: args.goal ? String(args.goal) : undefined,
      host: String(args.host || "127.0.0.1"),
      port: Number(args.port || 8765),
      open: !args.noOpen && !args.once
    });
    if (args.once) {
      await new Promise<void>((resolve) => handle.server.close(() => resolve()));
    }
    return ok(
      {
        url: handle.url,
        root,
        side_effect: args.once ? "started-and-closed" : "server-running"
      },
      [],
      [],
      args.once ? [] : [`Open ${handle.url} to inspect OpenNori live state.`]
    );
  }
});

export async function runDashboardCommand(rawArgs: string[]) {
  return runJsonCommand(dashboardCommand, rawArgs);
}
