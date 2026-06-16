import type { NoriSnapshot, SnapshotResponse } from "./types";

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

export function subscribeToEvents(onEvent: () => void, onError: () => void): () => void {
  const source = new EventSource("/api/events");
  source.onopen = onEvent;
  source.onmessage = onEvent;
  source.onerror = onError;
  return () => source.close();
}
