import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { streamSSE, type SSEStreamingApi } from "hono/streaming";
import { packagePath } from "../../package-root.ts";
import type { NoriEvent } from "../../types/kernel.ts";
import { readEvents } from "../events.ts";
import { refreshSnapshot } from "../snapshot.ts";

const EVENT_STREAM_POLL_MS = 5000;

export type DashboardAppOptions = {
  root: string;
  goalId?: string;
};

type SseClient = {
  lastSeq: number;
};

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

function notFoundPayload() {
  return {
    ok: false,
    error: {
      type: "not_found",
      message: "OpenNori dashboard endpoint not found."
    }
  };
}

function methodNotAllowedPayload() {
  return {
    ok: false,
    error: {
      type: "method_not_allowed",
      message: "OpenNori dashboard only accepts GET requests."
    }
  };
}

function eventPayload(event: NoriEvent): string {
  const data = JSON.stringify(event);
  return `id: ${event.seq}\ndata: ${data}\n\nid: ${event.seq}\nevent: ${event.type}\ndata: ${data}\n\n`;
}

async function sendPendingEvents(stream: SSEStreamingApi, client: SseClient, root: string): Promise<void> {
  for (const event of readEvents(root, { afterSeq: client.lastSeq, limit: 50 })) {
    await stream.write(eventPayload(event));
    client.lastSeq = event.seq;
  }
}

export function createDashboardApp(options: DashboardAppOptions) {
  const root = path.resolve(options.root);
  const app = new Hono();

  app.use("*", async (c, next) => {
    if (c.req.method !== "GET") return c.json(methodNotAllowedPayload(), 405);
    return next();
  });

  app.get("/api/snapshot", (c) => {
    try {
      return c.json({
        ok: true,
        data: refreshSnapshot(root, { goalId: options.goalId })
      });
    } catch (error) {
      return c.json({
        ok: false,
        error: {
          type: "snapshot_failed",
          message: error instanceof Error ? error.message : String(error)
        }
      }, 500);
    }
  });

  app.get("/api/events", (c) => {
    const afterSeq = Number(c.req.query("after") || c.req.header("last-event-id") || 0);
    const client: SseClient = {
      lastSeq: Number.isFinite(afterSeq) ? afterSeq : 0
    };
    return streamSSE(c, async (stream) => {
      await sendPendingEvents(stream, client, root);
      while (!stream.aborted) {
        await stream.sleep(EVENT_STREAM_POLL_MS);
        try {
          await sendPendingEvents(stream, client, root);
          await stream.write(": heartbeat\n\n");
        } catch {
          // Dashboard polling must not mutate or block project state.
        }
      }
    });
  });

  app.get("*", (c) => {
    const filePath = dashboardAssetPath(new URL(c.req.url).pathname);
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return c.json(notFoundPayload(), 404);
    }
    return c.body(new Uint8Array(fs.readFileSync(filePath)), 200, {
      "content-type": contentType(filePath),
      "cache-control": "no-store"
    });
  });

  app.notFound((c) => c.json(notFoundPayload(), 404));

  return app;
}
