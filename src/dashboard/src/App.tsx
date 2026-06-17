import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Check,
  Copy,
  Eye,
  Info,
  Radio,
  RefreshCw,
  Terminal,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSnapshot, subscribeToEvents } from "./api";
import { AcceptanceRadarNet, type RadarNode } from "./components/AcceptanceRadarNet";
import { InspectNodePanel } from "./components/InspectNodePanel";
import type { NoriSnapshot } from "./types";

type ConnectionState = "connecting" | "live" | "retrying";
function isPassingStatus(status: string | undefined): boolean {
  return ["passing", "waived"].includes(String(status || "").toLowerCase());
}

function passedGroupRawData(criteria: NonNullable<NoriSnapshot["criteria"]>) {
  const passedCriteria = criteria.filter((criterion) => isPassingStatus(criterion.status));
  return {
    title: "Passed Acceptance Criteria List",
    description: "All criteria that have already satisfied the acceptance conditions.",
    total_completed: passedCriteria.length,
    criteria: passedCriteria.map((criterion) => ({
      id: criterion.id,
      user_story: criterion.user_story,
      measurement: criterion.measurement,
      threshold: criterion.threshold,
      status: criterion.status,
      confidence: criterion.confidence
    }))
  };
}

function syncSelectedNodeWithSnapshot(selectedNode: RadarNode | null, nextSnapshot: NoriSnapshot): RadarNode | null {
  if (!selectedNode) return null;

  if (selectedNode.type === "goal") {
    if (!nextSnapshot.goal) return null;
    return {
      ...selectedNode,
      id: nextSnapshot.goal.id,
      label: "Goal",
      status: nextSnapshot.goal.workflow_status,
      rawData: nextSnapshot.goal
    };
  }

  if (selectedNode.id === "passed-group") {
    const criteria = nextSnapshot.criteria || [];
    const passedCriteria = criteria.filter((criterion) => isPassingStatus(criterion.status));
    if (passedCriteria.length === 0) return null;
    return {
      ...selectedNode,
      label: "Passed",
      subLabel: String(passedCriteria.length),
      status: "passed_group",
      rawData: passedGroupRawData(criteria)
    };
  }

  if (selectedNode.id.startsWith("ac-")) {
    const criterionId = selectedNode.id.slice("ac-".length);
    const criterion = nextSnapshot.criteria?.find((item) => item.id === criterionId);
    if (!criterion) return null;
    return {
      ...selectedNode,
      label: criterion.id,
      status: criterion.status,
      rawData: criterion
    };
  }

  if (selectedNode.id.startsWith("ev-")) {
    const evidencePath = selectedNode.id.slice("ev-".length);
    const separatorIndex = evidencePath.lastIndexOf("-");
    if (separatorIndex < 1) return selectedNode;

    const criterionId = evidencePath.slice(0, separatorIndex);
    const evidenceIndex = Number.parseInt(evidencePath.slice(separatorIndex + 1), 10);
    const criterion = nextSnapshot.criteria?.find((item) => item.id === criterionId);
    const evidence = Number.isInteger(evidenceIndex) ? criterion?.evidence[evidenceIndex] : undefined;
    if (!evidence) return null;

    return {
      ...selectedNode,
      label: `E-${evidenceIndex + 1}`,
      status: evidence.result || "unknown",
      rawData: evidence
    };
  }

  return selectedNode;
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

  const refresh = useCallback(async () => {
    try {
      const nextSnapshot = await fetchSnapshot();
      setSnapshot(nextSnapshot);
      setConnection("live");
      setError("");
      setSelectedNode((prev) => syncSelectedNodeWithSnapshot(prev, nextSnapshot));
    } catch (refreshError) {
      setConnection("retrying");
      setError(refreshError instanceof Error ? refreshError.message : String(refreshError));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeToEvents(() => {
      void refresh();
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
    return snapshot?.events || [];
  }, [snapshot]);

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
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-[#00f0ff]/35 bg-[#00f0ff]/12 text-lg font-black text-[#00f0ff] filter drop-shadow-[0_0_8px_rgba(0,240,255,0.35)] animate-pulse">
                N
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">OpenNori Dashboard</p>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#34d399] animate-ping" />
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
                <Radio size={13} className={connection === "live" ? "animate-pulse" : ""} />
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

                {/* 2. 简体中文：悬浮的 Co-Pilot 协同引导舱 */}
                {snapshot?.need_user ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute left-6 bottom-6 z-20 max-w-sm rounded-lg border border-[#fbbf24]/30 bg-[#121008]/85 p-4 shadow-2xl backdrop-blur-md"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="grid h-6 w-6 place-items-center rounded bg-[#fbbf24]/20 text-[#fbbf24] font-bold text-xs">
                        i
                      </div>
                      <div className="flex-1 min-w-0">
                        <strong className="block text-sm font-semibold text-[#fde68a]">Co-Pilot Guide Boundary</strong>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">
                          {snapshot.user_action || "Waiting for user judgment in agent chat."}
                        </p>
                        <div className="mt-3 flex items-center gap-2 rounded border border-[#fbbf24]/20 bg-black/40 p-2">
                          <code className="flex-1 truncate text-[10px] text-[#fbbf24]">
                            {suggestedAgentReply}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(suggestedAgentReply)}
                            className="text-slate-400 hover:text-[#fbbf24] transition-colors"
                            title="Copy agent reply"
                          >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                        <span className="mt-2 block text-[10px] text-slate-400 leading-normal">
                          Actions cannot be executed on Dashboard. Please reply in agent chat.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
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
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
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
