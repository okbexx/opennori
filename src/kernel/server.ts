import { spawn } from "node:child_process";
import fs from "node:fs";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { URL } from "node:url";
import { packagePath } from "../package-root.ts";
import type { NoriEvent } from "../types.ts";
import { appendEvent, readEvents } from "./events.ts";
import { refreshSnapshot } from "./snapshot.ts";

export type DashboardServerOptions = {
  root: string;
  host?: string;
  port?: number;
  goalId?: string;
  open?: boolean;
};

export type DashboardServerHandle = {
  url: string;
  server: http.Server;
};

type SseClient = {
  response: ServerResponse;
  lastSeq: number;
};

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8765;

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function sendNotFound(response: ServerResponse): void {
  sendJson(response, 404, {
    ok: false,
    error: {
      type: "not_found",
      message: "OpenNori dashboard endpoint not found."
    }
  });
}

function contentType(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml; charset=utf-8";
  return "application/octet-stream";
}

function dashboardAssetPath(urlPath: string): string | null {
  const assetsRoot = packagePath("dashboard");
  const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const resolved = path.resolve(assetsRoot, relative);
  if (!resolved.startsWith(path.resolve(assetsRoot))) return null;
  return resolved;
}

function sendStatic(requestUrl: string, response: ServerResponse): void {
  const filePath = dashboardAssetPath(requestUrl);
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendNotFound(response);
    return;
  }
  response.writeHead(200, {
    "content-type": contentType(filePath),
    "cache-control": "no-store"
  });
  fs.createReadStream(filePath).pipe(response);
}

function eventPayload(event: NoriEvent): string {
  const data = JSON.stringify(event);
  return `id: ${event.seq}\ndata: ${data}\n\nid: ${event.seq}\nevent: ${event.type}\ndata: ${data}\n\n`;
}

function sendPendingEvents(client: SseClient, root: string): void {
  for (const event of readEvents(root, { afterSeq: client.lastSeq, limit: 50 })) {
    client.response.write(eventPayload(event));
    client.lastSeq = event.seq;
  }
}

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
  const clients = new Set<SseClient>();

  const broadcast = (events: NoriEvent[]) => {
    if (events.length === 0) return;
    for (const client of [...clients]) {
      const nextEvents = events.filter((event) => event.seq > client.lastSeq);
      for (const event of nextEvents) {
        client.response.write(eventPayload(event));
        client.lastSeq = event.seq;
      }
    }
  };

  const server = http.createServer((request: IncomingMessage, response: ServerResponse) => {
    const parsed = new URL(request.url || "/", `http://${host}:${port}`);
    if (request.method !== "GET") {
      sendJson(response, 405, {
        ok: false,
        error: {
          type: "method_not_allowed",
          message: "OpenNori dashboard only accepts GET requests."
        }
      });
      return;
    }

    if (parsed.pathname === "/api/snapshot") {
      try {
        sendJson(response, 200, {
          ok: true,
          data: refreshSnapshot(root, { goalId: options.goalId })
        });
      } catch (error) {
        sendJson(response, 500, {
          ok: false,
          error: {
            type: "snapshot_failed",
            message: error instanceof Error ? error.message : String(error)
          }
        });
      }
      return;
    }

    if (parsed.pathname === "/api/events") {
      response.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        connection: "keep-alive"
      });
      const lastSeq = Number(parsed.searchParams.get("after") || request.headers["last-event-id"] || 0);
      const client: SseClient = {
        response,
        lastSeq: Number.isFinite(lastSeq) ? lastSeq : 0
      };
      clients.add(client);
      sendPendingEvents(client, root);
      request.on("close", () => {
        clients.delete(client);
      });
      return;
    }

    sendStatic(parsed.pathname, response);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const url = `http://${host}:${(server.address() as { port: number }).port}/`;
  const started = appendEvent(root, {
    type: "dashboard.started",
    actor: { kind: "system", name: "OpenNori" },
    summary: `OpenNori dashboard started at ${url}`,
    data: { url }
  });
  broadcast([started]);

  const interval = setInterval(() => {
    try {
      refreshSnapshot(root, { goalId: options.goalId });
      for (const client of clients) {
        sendPendingEvents(client, root);
        client.response.write(": heartbeat\n\n");
      }
    } catch {
      // Dashboard polling must not mutate or block project state.
    }
  }, 1500);
  server.on("close", () => {
    clearInterval(interval);
  });

  if (options.open !== false) openBrowser(url);
  return { url, server };
}
