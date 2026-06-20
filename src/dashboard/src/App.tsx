import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Check,
  Copy,
  Eye,
  Info,
  Radio,
  RefreshCw,
  Terminal,
  X,
  Compass
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchSnapshot, subscribeToEvents } from "./api";
import { AcceptanceRadarNet, type RadarNode } from "./components/AcceptanceRadarNet";
import { InspectNodePanel } from "./components/InspectNodePanel";
import { gapIdFromFocusEvent, renderedCriterionNodeFromSnapshot, syncSelectedNodeWithSnapshot } from "./selection";
import type { NoriSnapshot } from "./types";

type ConnectionState = "connecting" | "live" | "retrying";

const RUNNING_AGENT_STATES = new Set(["thinking", "working", "verifying"]);

function isAgentRunning(snapshot: NoriSnapshot | null): boolean {
  return !!snapshot && RUNNING_AGENT_STATES.has(String(snapshot.agent.state));
}

function snapshotRenderKey(snapshot: NoriSnapshot): string {
  return JSON.stringify({
    ...snapshot,
    generated_at: undefined
  });
}

function formatSignal(value: string | undefined): string {
  const clean = String(value || "").trim();
  return clean ? clean.replace(/[-_]+/g, " ").toUpperCase() : "UNKNOWN";
}

function architectureDecisionClass(decision: string): string {
  const clean = String(decision || "").toLowerCase();
  if (["valid", "active", "approved", "complete"].includes(clean)) return "text-[#34d399]";
  if (["challenged", "invalid", "broken"].includes(clean)) return "text-rose-400 animate-pulse";
  return "text-[#fbbf24]";
}

function relativeTime(value: string | undefined): string {
  if (!value) return "not seen";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "not seen";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 5) return "now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="grid h-10 w-10 place-items-center rounded-md border border-slate-800 bg-slate-950/40 text-slate-300 transition hover:border-[#00f0ff]/40 hover:bg-[#00f0ff]/12"
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={8}
          className="rounded-md border border-slate-800 bg-[#080914] px-3 py-2 text-xs font-semibold text-[#e2e8f0] shadow-2xl"
        >
          {label}
          <Tooltip.Arrow className="fill-[#080914]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function App() {
  const [snapshot, setSnapshot] = useState<NoriSnapshot | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [error, setError] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<RadarNode | null>(null);
  const [copied, setCopied] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"visual" | "json">("visual");
  const snapshotKeyRef = useRef("");

  const refresh = useCallback(async (focusGapId?: string | null) => {
    try {
      const nextSnapshot = await fetchSnapshot();
      const nextSnapshotKey = snapshotRenderKey(nextSnapshot);
      if (nextSnapshotKey !== snapshotKeyRef.current) {
        snapshotKeyRef.current = nextSnapshotKey;
        setSnapshot(nextSnapshot);
        setSelectedNode((prev) => {
          if (focusGapId) {
            return renderedCriterionNodeFromSnapshot(nextSnapshot, focusGapId) || syncSelectedNodeWithSnapshot(prev, nextSnapshot);
          }
          return syncSelectedNodeWithSnapshot(prev, nextSnapshot);
        });
      } else if (focusGapId) {
        setSelectedNode((prev) => renderedCriterionNodeFromSnapshot(nextSnapshot, focusGapId) || prev);
      }
      setConnection("live");
      setError("");
    } catch (refreshError) {
      setConnection("retrying");
      setError(refreshError instanceof Error ? refreshError.message : String(refreshError));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeToEvents((event) => {
      void refresh(gapIdFromFocusEvent(event));
    }, () => {
      setConnection("retrying");
      window.setTimeout(() => {
        void refresh();
      }, 900);
    });
    const interval = window.setInterval(() => {
      void refresh();
    }, 5000);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [refresh]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 简体中文：仅供复制的对话提示，Dashboard 不暴露底层状态写入命令
  const suggestedAgentReply = useMemo(() => {
    if (!snapshot) return "";
    if (snapshot.need_user) {
      return snapshot.user_action || "Please use OpenNori to record my decision in this agent conversation.";
    }
    return "Use OpenNori to continue from the current gap and record reviewable evidence.";
  }, [snapshot]);

  // 简体中文：只读事件历史过滤
  const recentEvents = useMemo(() => {
    return [...(snapshot?.events || [])].sort((left, right) => Number(right.seq || 0) - Number(left.seq || 0));
  }, [snapshot]);
  const latestAgentEvent = useMemo(() => {
    return recentEvents.find((event) => event.actor.kind === "agent");
  }, [recentEvents]);
  const agentRunning = isAgentRunning(snapshot);

  return (
    <Tooltip.Provider delayDuration={180}>
      <main className="relative h-screen max-h-screen overflow-hidden bg-[#080914] text-[#e2e8f0]">
        {/* 简体中文：赛博极光背景滤镜 */}
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(140deg,#080914_0%,#0c0f24_50%,#1a1129_100%)]" />
        <div className="pointer-events-none fixed inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(0,240,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />

        {/* 简体中文：限制 100vh 高度自适应并微调 padding 间距，消除滚动 */}
        <section className="relative z-10 grid h-full max-h-full grid-rows-[auto_1fr_auto] gap-3 p-3 lg:gap-4 lg:p-6 min-h-0 overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(0,240,255,0.08)] pb-3">
            <div className="flex items-center gap-3.5">
              <div className={`grid h-11 w-11 place-items-center rounded-lg border border-[#00f0ff]/35 bg-[#00f0ff]/12 text-lg font-black text-[#00f0ff] filter drop-shadow-[0_0_8px_rgba(0,240,255,0.35)] ${agentRunning ? "animate-pulse" : ""}`}>
                N
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">OpenNori Dashboard</p>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full bg-[#34d399] ${agentRunning ? "animate-ping" : ""}`} />
                  <span className="text-[8px] font-mono text-slate-500 tracking-wider">OBS.NODE_CONNECTED</span>
                </div>
                <h1 className="text-xl font-black tracking-wide bg-gradient-to-r from-[#00f0ff] to-[#bd93f9] bg-clip-text text-transparent filter drop-shadow-[0_0_8px_rgba(0,240,255,0.15)] sm:text-2xl">
                  Acceptance Radar Net
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
              <IconButton label="Refresh snapshot" onClick={() => void refresh()}>
                <RefreshCw size={18} />
              </IconButton>
            </div>
          </header>

          <section className="grid min-h-0 gap-4 lg:grid-cols-[1fr_auto] h-full max-h-full overflow-hidden">
            {/* 1. 简体中文：核心雷达网画布 */}
            <div className="relative flex flex-col h-full max-h-full min-h-0 min-w-0">
              <div className="relative flex-1 grid place-items-center min-h-0 min-w-0 h-full max-h-full overflow-hidden">
                <AcceptanceRadarNet
                  snapshot={snapshot}
                  onSelectNode={(node) => {
                    setSelectedNode(node);
                    setDrawerTab("visual"); // 点选节点时，默认重置为可视化 UI tab
                  }}
                  selectedNodeId={selectedNode?.id || null}
                />

                {/* 2. 简体中文：左侧悬浮式多维验收决策舱 (Acceptance Telemetry HUD Deck) */}
                {snapshot && (
                  <div className="absolute left-4 top-4 bottom-4 z-20 w-[min(340px,calc(100vw-2rem))] overflow-y-auto scrollbar-hover-visible flex flex-col gap-3 pointer-events-auto pr-1">
                    {/* A. GOAL & DIRECTIVE 舱 */}
                    {snapshot.goal && (
                      <div className="rounded-lg border-l-[3.5px] border-l-[#00f0ff] border border-[rgba(0,240,255,0.12)] bg-[rgba(8,9,20,0.85)] p-3 shadow-2xl backdrop-blur-md text-left">
                        <div className="absolute top-0 right-0 px-2 py-0.5 bg-[rgba(0,240,255,0.06)] text-[8px] font-mono tracking-widest text-[#00f0ff]/80 border-b border-l border-[rgba(0,240,255,0.08)] rounded-bl">
                          SYS.DIRECTIVE / GOAL
                        </div>

                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap mt-2.5">
                          <span className="inline-flex items-center gap-1 rounded bg-[#00f0ff]/10 px-2 py-0.5 text-[9px] font-mono font-bold text-[#00f0ff]">
                            GOAL_ID: {snapshot.goal.id}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-mono font-bold ${snapshot.goal.workflow_status === "complete" ? "bg-[#34d399]/10 text-[#34d399]" : "bg-[#fbbf24]/10 text-[#fbbf24]"}`}>
                            STATUS: {snapshot.goal.workflow_status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 mt-1">
                          <div className="mt-0.5 text-[#00f0ff] shrink-0">
                            <Compass size={13} />
                          </div>
                          <h2 className="text-[11px] font-bold leading-relaxed tracking-wide text-slate-200 break-words">
                            {snapshot.goal.label}
                          </h2>
                        </div>
                      </div>
                    )}

                    {/* B. AGENT ACTIVITY 舱 */}
                    <div className="rounded-lg border-l-[3.5px] border-l-[#34d399] border border-[rgba(52,211,153,0.12)] bg-[rgba(8,9,20,0.85)] p-3 shadow-2xl backdrop-blur-md text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="inline-flex items-center gap-1 rounded bg-[#34d399]/10 px-2 py-0.5 text-[9px] font-mono font-bold text-[#34d399]">
                          AGENT ACTIVITY
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-slate-400">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            snapshot.agent.state === "working" ? "bg-[#34d399] animate-spin" :
                            snapshot.agent.state === "thinking" ? "bg-[#00f0ff] animate-ping" :
                            snapshot.agent.state === "verifying" ? "bg-[#bd93f9] animate-pulse" :
                            "bg-slate-600"
                          }`} style={{ animationDuration: "3s" }} />
                          {snapshot.agent.state.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        {snapshot.agent.summary || (latestAgentEvent ? `Last agent event: ${latestAgentEvent.actor.name}${latestAgentEvent.actor.skill ? ` / ${latestAgentEvent.actor.skill}` : ""} ${latestAgentEvent.type}.` : "No recent OpenNori agent activity.")}
                      </p>
                      {snapshot.current_gap && (
                        <div className="mt-2 border-t border-slate-800/80 pt-1.5">
                          <span className="block text-[8px] font-mono font-bold text-[#ff00a0] uppercase tracking-wider">🎯 LOCKED GAP (CURRENT AC)</span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-300 font-semibold mt-0.5">
                            <span className="text-[#ff00a0] font-mono shrink-0">[{snapshot.current_gap.id}]</span>
                            <span className="truncate">{snapshot.current_gap.label}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* C. ARCHITECTURE COMPLIANCE 舱 */}
                    <div className="rounded-lg border-l-[3.5px] border-l-[#bd93f9] border border-[rgba(189,147,249,0.12)] bg-[rgba(8,9,20,0.85)] p-3 shadow-2xl backdrop-blur-md text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="inline-flex items-center gap-1 rounded bg-[#bd93f9]/10 px-2 py-0.5 text-[9px] font-mono font-bold text-[#bd93f9]">
                          ARCHITECTURE COMPLIANCE
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-[8.5px] font-mono font-bold ${architectureDecisionClass(snapshot.architecture.decision)}`}>
                          {formatSignal(snapshot.architecture.decision)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 leading-normal flex flex-col gap-1">
                        <div>
                          <span className="text-slate-500 font-mono text-[8px] block">ACTIVE PROFILE</span>
                          <strong className="text-slate-200 font-bold">{snapshot.architecture.profile_title || snapshot.architecture.profile || "none"}</strong>
                        </div>
                        {Number(snapshot.architecture.open_challenges || 0) > 0 && (
                          <div className="mt-1 rounded bg-rose-500/10 border border-rose-500/20 p-1.5 text-[9px] text-rose-400 font-semibold flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                            <span>{snapshot.architecture.open_challenges} ACTIVE ARCHITECTURE CHALLENGES</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* D. COMPLETION AUDITOR 舱 */}
                    <div className="rounded-lg border-l-[3.5px] border-l-[#fbbf24] border border-[rgba(251,191,36,0.12)] bg-[rgba(8,9,20,0.85)] p-3 shadow-2xl backdrop-blur-md text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="inline-flex items-center gap-1 rounded bg-[#fbbf24]/10 px-2 py-0.5 text-[9px] font-mono font-bold text-[#fbbf24]">
                          COMPLETION AUDITOR
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[8.5px] font-mono font-bold ${
                          snapshot.completion?.complete ? "bg-[#34d399]/15 text-[#34d399]" : "bg-rose-500/15 text-rose-400"
                        }`}>
                          {snapshot.completion?.complete ? "READY" : "INCOMPLETE"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 leading-normal">
                        <span className="text-slate-500 font-mono text-[8px] block">AUDIT DECISION</span>
                        <p className="text-slate-200 font-medium italic mt-0.5">"{snapshot.completion?.answer || "Pending final criteria audit."}"</p>

                        {snapshot.completion?.confidence && (
                          <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono border-t border-slate-800/80 pt-1.5">
                            <span className="text-slate-500">CONFIDENCE:</span>
                            <span className={`font-bold ${
                              snapshot.completion.confidence === "confident" ? "text-[#34d399]" :
                              snapshot.completion.confidence === "review-risk" ? "text-[#fbbf24] animate-pulse" :
                              "text-rose-400"
                            }`}>
                              {formatSignal(snapshot.completion.confidence)}
                            </span>
                          </div>
                        )}

                        {snapshot.completion?.review_risks && snapshot.completion.review_risks.length > 0 && (
                          <div className="mt-2 rounded bg-[#fbbf24]/8 border border-[#fbbf24]/15 p-1.5 text-[8.5px] text-[#fbbf24] leading-normal font-semibold">
                            ⚠️ {snapshot.completion.review_risks.length} REVIEW RISKS PENDING JUDGMENT
                          </div>
                        )}
                      </div>
                    </div>

                    {/* E. CO-PILOT DECISION 舱 */}
                    {snapshot.need_user && (
                      <div className="rounded-lg border border-[#fbbf24]/30 bg-[#121008]/85 p-3 shadow-2xl backdrop-blur-md text-left">
                        <div className="flex items-start gap-2.5">
                          <div className="grid h-5 w-5 place-items-center rounded bg-[#fbbf24]/20 text-[#fbbf24] font-mono font-bold text-[10px] shrink-0 mt-0.5">
                            !
                          </div>
                          <div className="flex-1 min-w-0">
                            <strong className="block text-[11px] font-semibold text-[#fde68a]">Co-Pilot Decision Needed</strong>
                            <p className="mt-1 text-[10px] leading-relaxed text-slate-300">
                              {snapshot.user_action || "Waiting for user judgment in agent chat."}
                            </p>
                            <div className="mt-2.5 flex items-center gap-2 rounded border border-[#fbbf24]/20 bg-black/40 p-1.5">
                              <code className="flex-1 truncate text-[9px] text-[#fbbf24]">
                                {suggestedAgentReply}
                              </code>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(suggestedAgentReply)}
                                className="text-slate-400 hover:text-[#fbbf24] transition-colors shrink-0"
                                title="Copy reply command"
                              >
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. 简体中文：右侧滑出只读 Inspect 抽屉 */}
            <AnimatePresence>
              {selectedNode ? (
                <motion.div
                  initial={{ opacity: 0, x: 260 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 260 }}
                  transition={{ type: "spring", damping: 22, stiffness: 150 }}
                  className="w-[min(420px,calc(100vw-2rem))] rounded-lg border border-[rgba(189,147,249,0.18)] bg-[rgba(16,20,38,0.72)] p-4 shadow-2xl backdrop-blur-md grid grid-rows-[auto_1fr] h-full max-h-full min-h-0 overflow-hidden"
                >
                  <div className="border-b border-slate-800 pb-3 mb-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#bd93f9]">
                          Inspected Node
                        </span>
                        <h3 className="text-base font-semibold text-[#e2e8f0]">
                        {selectedNode.type === "goal" ? `GOAL: ${selectedNode.id}` : `${selectedNode.type.toUpperCase()}: ${selectedNode.label}`}
                      </h3>
                    </div>
                    <button
                      type="button"
                      aria-label="Close panel"
                      onClick={() => setSelectedNode(null)}
                      className="grid h-8 w-8 place-items-center rounded border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* 简体中文：精细的分段胶囊式切换栏 (Segmented Control)，提供完美的对齐与大屏科技质感 */}
                  <div className="inline-flex items-center rounded-lg bg-black/45 p-0.5 border border-slate-800/80 self-start">
                    <button
                      type="button"
                      onClick={() => setDrawerTab("visual")}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        drawerTab === "visual"
                          ? "bg-[#00f0ff]/15 text-[#00f0ff] shadow-[0_1px_3px_rgba(0,240,255,0.1)]"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      UI Panel
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerTab("json")}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        drawerTab === "json"
                          ? "bg-[#bd93f9]/15 text-[#bd93f9] shadow-[0_1px_3px_rgba(189,147,249,0.1)]"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Raw JSON
                    </button>
                  </div>
                </div>

                  <div className="overflow-auto min-h-0 h-full max-h-full flex flex-col scrollbar-hover-visible">
                    {drawerTab === "visual" ? (
                      <InspectNodePanel node={selectedNode} />
                    ) : (
                      <>
                        <span className="block text-xs font-semibold text-slate-400 mb-2">Readonly Data (JSON)</span>
                        <pre className="flex-1 overflow-auto whitespace-pre-wrap break-all scrollbar-hover-visible rounded border border-slate-800/80 bg-black/40 p-3 text-[11px] leading-relaxed text-[#bd93f9] select-text">
                          {JSON.stringify(selectedNode.rawData, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>

          {/* 4. 简体中文：底部滚动终端日志栏 */}
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
                {recentEvents.length > 0 ? (
                  recentEvents.map((evt) => (
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
        </section>
      </main>
    </Tooltip.Provider>
  );
}
