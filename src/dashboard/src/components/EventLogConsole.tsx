import { Info, Terminal } from "lucide-react";
import { relativeTime } from "../dashboard-view";
import type { NoriEvent } from "../types";

export function EventLogConsole({
  events,
  agentRunning,
  error
}: {
  events: NoriEvent[];
  agentRunning: boolean;
  error: string;
}) {
  return (
    <footer className="grid gap-2 border-t border-[rgba(0,240,255,0.06)] pt-2">
      <div className="rounded-lg border border-slate-800 bg-black/30 p-3 shadow-inner">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-1.5 mb-1.5">
          <Terminal size={13} className="text-[#00f0ff]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Scrolling Event log console</span>
          <span className="inline-flex min-h-6 items-center gap-1.5 rounded-full border border-[#00f0ff]/35 bg-[#00f0ff]/10 px-2.5 text-xs font-semibold text-[#c7d2fe]">
            <span className={`h-1.5 w-1.5 rounded-full bg-[#00f0ff] ${agentRunning ? "animate-pulse" : ""}`} />
            live
          </span>
        </div>

        <div className="max-h-24 overflow-auto scroll-smooth scrollbar-hover-visible font-mono text-[11px] leading-relaxed text-slate-300 flex flex-col gap-1 select-text">
          {events.length > 0 ? (
            events.map((evt) => (
              <div key={evt.id || `${evt.seq}-${evt.created_at}-${evt.type}`} className="flex items-start gap-3 hover:bg-slate-900/30 p-1 rounded transition">
                <span className="text-slate-500 shrink-0">[{relativeTime(evt.created_at)}]</span>
                <span className="text-[#bd93f9] uppercase tracking-wider shrink-0 font-bold">
                  {evt.actor.kind === "agent" ? `${evt.actor.name}(${evt.actor.skill || "nori"})` : evt.actor.kind}:
                </span>
                <span className="text-[#00f0ff] font-bold shrink-0">{evt.type}</span>
                <span className="text-slate-200">{evt.summary}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 italic">No events recorded yet. Waiting for OpenNori activity.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Control boundary:</span>
          <strong className="text-slate-400">reply in agent chat</strong>
        </div>
        {error ? (
          <div className="flex items-center gap-1.5 text-[#f87171]">
            <Info size={14} />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </footer>
  );
}
