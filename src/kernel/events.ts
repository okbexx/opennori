import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { nowIso, readJson, writeJson } from "../core/shared.ts";
import type { JsonObject } from "../types/common.ts";
import type { NoriEvent, NoriEventActor, NoriEventInput } from "../types/kernel.ts";

export const EVENT_SCHEMA_VERSION = "opennori/event-v1";

const MAX_EVENT_REPLAY = 200;

function eventsDir(root: string): string {
  return path.join(root, ".opennori", "events");
}

export function eventsPath(root: string): string {
  return path.join(eventsDir(root), "events.jsonl");
}

function eventSeqPath(root: string): string {
  return path.join(eventsDir(root), "seq.json");
}

function eventLockParent(root: string): string {
  const noriDir = path.join(root, ".opennori");
  if (fs.existsSync(noriDir)) return path.join(noriDir, ".locks");
  return path.join(os.tmpdir(), "opennori-locks", Buffer.from(root).toString("hex").slice(0, 80));
}

function eventLockPath(root: string): string {
  return path.join(eventLockParent(root), "events.write.lock");
}

function waitSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function withEventWriteLock<T>(root: string, action: () => T): T {
  const lockPath = eventLockPath(root);
  const startedAt = Date.now();
  const timeoutMs = 15_000;
  const staleMs = 120_000;
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });

  while (true) {
    try {
      fs.mkdirSync(lockPath);
      writeJson(path.join(lockPath, "owner.json"), {
        pid: process.pid,
        root,
        created_at: nowIso()
      });
      break;
    } catch (error) {
      const typedError = error as NodeJS.ErrnoException;
      if (typedError.code !== "EEXIST") throw error;
      try {
        const stat = fs.statSync(lockPath);
        if (Date.now() - stat.mtimeMs > staleMs) {
          fs.rmSync(lockPath, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error(`Timed out waiting for OpenNori event write lock: ${lockPath}`);
      }
      waitSync(50);
    }
  }

  try {
    return action();
  } finally {
    fs.rmSync(lockPath, { recursive: true, force: true });
  }
}

function eventId(seq: number): string {
  return `evt_${String(seq).padStart(8, "0")}`;
}

function normalizeActor(actor: NoriEventActor | undefined): NoriEventActor {
  if (!actor) return { kind: "system", name: "OpenNori" };
  return {
    kind: actor.kind || "agent",
    name: actor.name || "Agent",
    skill: actor.skill || undefined
  };
}

function readSeq(root: string): number {
  try {
    const payload = readJson<{ next_seq?: number }>(eventSeqPath(root));
    return Number.isInteger(payload.next_seq) && Number(payload.next_seq) > 0 ? Number(payload.next_seq) : 1;
  } catch {
    return 1;
  }
}

export function appendEvent(root: string, input: NoriEventInput): NoriEvent {
  return withEventWriteLock(root, () => {
    fs.mkdirSync(eventsDir(root), { recursive: true });
    const seq = readSeq(root);
    const event: NoriEvent = {
      schema_version: EVENT_SCHEMA_VERSION,
      id: eventId(seq),
      seq,
      type: input.type,
      goal_id: input.goal_id,
      gap_id: input.gap_id,
      actor: normalizeActor(input.actor),
      summary: input.summary || "",
      data: (input.data || {}) as JsonObject,
      created_at: input.created_at || nowIso()
    };
    fs.appendFileSync(eventsPath(root), `${JSON.stringify(event)}\n`);
    writeJson(eventSeqPath(root), { next_seq: seq + 1, updated_at: nowIso() });
    return event;
  });
}

export function readEvents(root: string, options: { afterSeq?: number; limit?: number } = {}): NoriEvent[] {
  const filePath = eventsPath(root);
  if (!fs.existsSync(filePath)) return [];
  const afterSeq = Number(options.afterSeq || 0);
  const limit = Math.max(1, Math.min(Number(options.limit || MAX_EVENT_REPLAY), MAX_EVENT_REPLAY));
  const events: NoriEvent[] = [];
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const event = JSON.parse(trimmed) as NoriEvent;
      if (Number(event.seq || 0) > afterSeq) events.push(event);
    } catch {
      continue;
    }
  }
  return events.slice(-limit);
}

export function latestEvent(root: string): NoriEvent | null {
  return readEvents(root, { limit: 1 }).at(-1) || null;
}
