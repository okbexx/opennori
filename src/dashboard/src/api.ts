import type { NoriEvent, NoriSnapshot, SnapshotResponse } from "./types";

export async function fetchSnapshot(): Promise<NoriSnapshot> {
  const response = await fetch("/api/snapshot", {
    cache: "no-store",
    headers: {
      accept: "application/json"
    }
  });
  const payload = await response.json() as SnapshotResponse;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "Snapshot request failed." : payload.error?.message || "Snapshot request failed.");
  }
  return payload.data;
}

export function subscribeToEvents(onEvent: (event: NoriEvent | null) => void, onError: () => void): () => void {
  const source = new EventSource("/api/events");
  let lastSeenSeq = 0;
  const handleEventMessage = (message: MessageEvent<string>) => {
    try {
      const event = JSON.parse(message.data) as NoriEvent;
      if (Number(event.seq || 0) <= lastSeenSeq) return;
      lastSeenSeq = Number(event.seq || 0);
      onEvent(event);
    } catch {
      onEvent(null);
    }
  };
  source.onopen = () => onEvent(null);
  source.onmessage = handleEventMessage;
  source.addEventListener("gap.changed", handleEventMessage);
  source.addEventListener("ac.started", handleEventMessage);
  source.addEventListener("ac.finished", handleEventMessage);
  source.addEventListener("activity.started", handleEventMessage);
  source.addEventListener("activity.heartbeat", handleEventMessage);
  source.addEventListener("activity.finished", handleEventMessage);
  source.addEventListener("evidence.added", handleEventMessage);
  source.addEventListener("architecture.changed", handleEventMessage);
  source.addEventListener("profile.changed", handleEventMessage);
  source.addEventListener("report.generated", handleEventMessage);
  source.onerror = onError;
  return () => source.close();
}
