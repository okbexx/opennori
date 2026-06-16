import { spawn } from "node:child_process";
import type { Server } from "node:http";
import path from "node:path";
import { serve } from "@hono/node-server";
import { appendEvent } from "./events.ts";
import { createDashboardApp } from "./http/app.ts";

export type DashboardServerOptions = {
  root: string;
  host?: string;
  port?: number;
  goalId?: string;
  open?: boolean;
};

export type DashboardServerHandle = {
  url: string;
  server: Server;
};

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8765;

function openBrowser(url: string): void {
  const command = process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
      ? "cmd"
      : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}

export async function startDashboardServer(options: DashboardServerOptions): Promise<DashboardServerHandle> {
  const root = path.resolve(options.root);
  const host = options.host || DEFAULT_HOST;
  const port = options.port === undefined ? DEFAULT_PORT : Number(options.port);
  const app = createDashboardApp({
    root,
    goalId: options.goalId
  });

  const server = await new Promise<Server>((resolve, reject) => {
    const startedServer = serve({
      fetch: app.fetch,
      hostname: host,
      port
    }, () => {
      startedServer.off("error", reject);
      resolve(startedServer as Server);
    }) as Server;
    startedServer.once("error", reject);
  });

  const url = `http://${host}:${(server.address() as { port: number }).port}/`;
  appendEvent(root, {
    type: "dashboard.started",
    actor: { kind: "system", name: "OpenNori" },
    summary: `OpenNori dashboard started at ${url}`,
    data: { url }
  });
  if (options.open !== false) openBrowser(url);
  return { url, server };
}
