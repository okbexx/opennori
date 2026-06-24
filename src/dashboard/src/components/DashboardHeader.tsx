import { Eye, ListChecks, Radio, RefreshCw } from "lucide-react";
import type { ConnectionState } from "../dashboard-view";
import type { NoriSnapshot } from "../types";
import { IconButton } from "./IconButton";

export function DashboardHeader({
  agentRunning,
  connection,
  snapshot,
  onInspectProfile,
  onRefresh
}: {
  agentRunning: boolean;
  connection: ConnectionState;
  snapshot: NoriSnapshot | null;
  onInspectProfile: () => void;
  onRefresh: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(0,240,255,0.08)] pb-3">
      <div className="flex items-center gap-3.5">
        <div className={`grid h-11 w-11 place-items-center rounded-lg border border-[#00f0ff]/35 bg-[#00f0ff]/12 text-lg font-black text-[#00f0ff] filter drop-shadow-[0_0_8px_rgba(0,240,255,0.35)] ${agentRunning ? "animate-pulse" : ""}`}>
          N
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">OpenNori Dashboard</p>
            <span className={`inline-block h-1.5 w-1.5 rounded-full bg-[#34d399] ${agentRunning ? "animate-ping" : ""}`} />
            <span className="text-[8px] font-mono text-slate-500 tracking-wider">READONLY LOCAL VIEW</span>
          </div>
          <h1 className="text-xl font-black tracking-wide bg-gradient-to-r from-[#00f0ff] to-[#bd93f9] bg-clip-text text-transparent filter drop-shadow-[0_0_8px_rgba(0,240,255,0.15)] sm:text-2xl">
            Goal Outcome Monitor
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[rgba(0,240,255,0.15)] bg-[#00f0ff]/8 px-3 text-xs font-bold uppercase tracking-wider text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.04)]">
          <Eye size={13} />
          Observation only
        </span>
        <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-mono font-semibold uppercase tracking-wider ${connection === "live" ? "border-[#34d399]/35 bg-[#34d399]/10 text-[#a7f3d0]" : connection === "retrying" ? "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fde68a]" : "border-slate-800 bg-slate-900/40 text-slate-300"}`}>
          <Radio size={13} className={agentRunning ? "animate-pulse" : ""} />
          {connection}
        </span>
        <IconButton label="Inspect Project Profile" onClick={snapshot ? onInspectProfile : undefined}>
          <ListChecks size={18} />
        </IconButton>
        <IconButton label="Refresh snapshot" onClick={onRefresh}>
          <RefreshCw size={18} />
        </IconButton>
      </div>
    </header>
  );
}
