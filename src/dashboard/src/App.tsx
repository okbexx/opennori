import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Eye,
  GitBranch,
  Info,
  RefreshCw,
  Radio,
  ShieldCheck,
  UserRound,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSnapshot, subscribeToEvents } from "./api";
import { AcceptanceLoop } from "./components/AcceptanceLoop";
import type { ActivityState, NoriSnapshot } from "./types";

type ConnectionState = "connecting" | "live" | "retrying";
type Tone = "neutral" | "good" | "warn" | "bad" | "accent";

const activeAgentStates = new Set<ActivityState>(["thinking", "working", "verifying", "waiting_user"]);

function shortText(value: string | null | undefined, maxLength = 120, fallback = "none"): string {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function primaryGoalText(value: string | null | undefined): string {
  return shortText(value, 92, "No active goal");
}

function statusTone(value: string | undefined): Tone {
  if (!value) return "neutral";
  if (["complete", "clear", "valid", "ready", "approved", "decided"].includes(value)) return "good";
  if (["review_risk", "review", "waiting_user", "needs_evidence", "draft", "not_complete"].includes(value)) return "warn";
  if (["blocked", "broken", "invalid", "missing", "challenged"].includes(value)) return "bad";
  return "neutral";
}

function decisionLabel(snapshot: NoriSnapshot | null): string {
  if (!snapshot) return "loading";
  if (snapshot.decision === "complete") return "complete";
  if (snapshot.decision === "review_risk") return "complete, review risk";
  if (snapshot.decision === "no_active_goal") return "no active goal";
  return "not complete yet";
}

function architectureLabel(snapshot: NoriSnapshot | null): string {
  if (!snapshot) return "loading";
  const profile = snapshot.architecture.profile_title || snapshot.architecture.profile || "no profile";
  const challengeCount = snapshot.architecture.open_challenges || 0;
  const suffix = challengeCount > 0 ? `${challengeCount} challenge${challengeCount === 1 ? "" : "s"}` : snapshot.architecture.decision;
  return `${profile} / ${suffix}`;
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

function toneClasses(tone: Tone): string {
  if (tone === "good") return "border-[#74d58a]/35 bg-[#74d58a]/10 text-[#c9f6d0]";
  if (tone === "warn") return "border-[#ffb15e]/40 bg-[#ffb15e]/10 text-[#ffe2bf]";
  if (tone === "bad") return "border-[#ff6b6b]/40 bg-[#ff6b6b]/10 text-[#ffd0d0]";
  if (tone === "accent") return "border-[#57c7ff]/35 bg-[#57c7ff]/10 text-[#d5f2ff]";
  return "border-[#f5f0e6]/14 bg-[#f5f0e6]/7 text-[#f5f0e6]";
}

function agentLabel(state: ActivityState): string {
  if (state === "thinking") return "thinking";
  if (state === "working") return "working";
  if (state === "verifying") return "verifying";
  if (state === "waiting_user") return "needs user";
  if (state === "blocked") return "blocked";
  return "idle";
}

function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-sm font-semibold ${toneClasses(tone)}`}>
      {children}
    </span>
  );
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="grid h-10 w-10 place-items-center rounded-md border border-[#f5f0e6]/14 bg-[#f5f0e6]/7 text-[#f5f0e6] transition hover:border-[#57c7ff]/40 hover:bg-[#57c7ff]/12"
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={8}
          className="rounded-md border border-[#f5f0e6]/14 bg-[#171914] px-3 py-2 text-xs font-semibold text-[#f5f0e6] shadow-2xl"
        >
          {label}
          <Tooltip.Arrow className="fill-[#171914]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function MetricPanel({
  icon,
  label,
  value,
  detail,
  tone = "neutral"
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  tone?: Tone;
}) {
  return (
    <article className={`min-w-0 rounded-lg border p-4 ${toneClasses(tone)}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-[#11130f]/55">{icon}</span>
        <span className="min-w-0 text-right text-xs font-bold uppercase tracking-normal text-[#aeb8aa]">{label}</span>
      </div>
      <strong className="block min-w-0 break-words text-xl font-semibold leading-tight text-[#f7f0e2] [overflow-wrap:anywhere]">{value}</strong>
      {detail ? <span className="mt-2 block min-w-0 break-words text-sm leading-snug text-[#bfc7ba] [overflow-wrap:anywhere]">{detail}</span> : null}
    </article>
  );
}

function SnapshotDialog({ snapshot }: { snapshot: NoriSnapshot | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={open ? "Hide snapshot" : "Inspect snapshot"}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="grid h-10 w-10 place-items-center rounded-md border border-[#f5f0e6]/14 bg-[#f5f0e6]/7 text-[#f5f0e6] transition hover:border-[#57c7ff]/40 hover:bg-[#57c7ff]/12"
          >
            <Eye size={18} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={8}
            className="rounded-md border border-[#f5f0e6]/14 bg-[#171914] px-3 py-2 text-xs font-semibold text-[#f5f0e6] shadow-2xl"
          >
            Inspect snapshot
          <Tooltip.Arrow className="fill-[#171914]" />
        </Tooltip.Content>
      </Tooltip.Portal>
      </Tooltip.Root>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 z-30 grid h-[min(520px,70vh)] w-[min(560px,calc(100vw-2rem))] grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-[#f5f0e6]/16 bg-[#11130f] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#f5f0e6]/10 p-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#f7f0e2]">Snapshot</h2>
                <p className="mt-1 text-sm text-[#aeb8aa]">Read-only projection from .opennori state.</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-md border border-[#f5f0e6]/14 bg-[#f5f0e6]/7 text-[#f5f0e6] transition hover:bg-[#f5f0e6]/12"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 overflow-auto p-4">
              <pre className="overflow-hidden whitespace-pre-wrap break-words rounded-md border border-[#f5f0e6]/10 bg-black/35 p-4 text-xs leading-relaxed text-[#dce5d9]">
                {JSON.stringify(snapshot, null, 2)}
              </pre>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [snapshot, setSnapshot] = useState<NoriSnapshot | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [error, setError] = useState<string>("");

  const refresh = useCallback(async () => {
    try {
      const nextSnapshot = await fetchSnapshot();
      setSnapshot(nextSnapshot);
      setConnection("live");
      setError("");
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

  const agentState = snapshot?.agent.state || "idle";
  const agentActive = activeAgentStates.has(agentState);
  const needUserTone: Tone = snapshot?.need_user ? "warn" : "good";
  const decisionTone = statusTone(snapshot?.decision);
  const architectureTone = statusTone(snapshot?.architecture.decision);
  const connectionTone: Tone = connection === "live" ? "good" : connection === "retrying" ? "warn" : "neutral";
  const latestEvent = snapshot?.last_event;
  const goalLabel = useMemo(() => primaryGoalText(snapshot?.goal?.label), [snapshot]);
  const gapLabel = shortText(snapshot?.current_gap?.label, 112, snapshot?.status === "no_active_goal" ? "No active Nori Contract" : "No current gap");
  const userAction = snapshot?.need_user ? shortText(snapshot.user_action, 96, "User decision required") : "No user action required";

  return (
    <Tooltip.Provider delayDuration={180}>
      <main className="relative min-h-screen overflow-hidden bg-[#11130f] text-[#f7f0e2]">
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(130deg,#11130f_0%,#171914_48%,#231b13_100%)]" />
        <div className="pointer-events-none fixed inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(245,240,230,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(245,240,230,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />

        <section className="relative z-10 grid min-h-screen grid-rows-[auto_1fr_auto] gap-4 p-4 sm:p-6 lg:p-8">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-[#57c7ff]/35 bg-[#57c7ff]/12 text-lg font-black text-[#d5f2ff]">
                N
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-normal text-[#aeb8aa]">OpenNori Dashboard</p>
                <h1 className="text-xl font-semibold leading-tight text-[#f7f0e2] sm:text-2xl">Acceptance Loop</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusPill tone="accent">
                <Eye size={15} />
                Observation surface
              </StatusPill>
              <StatusPill tone={connectionTone}>
                <Radio size={15} className={connection === "live" ? "animate-pulse" : ""} />
                {connection}
              </StatusPill>
              <IconButton label="Refresh snapshot" onClick={() => void refresh()}>
                <RefreshCw size={18} />
              </IconButton>
              <SnapshotDialog snapshot={snapshot} />
            </div>
          </header>

          <section className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <section className="grid min-h-[520px] min-w-0 grid-rows-[auto_1fr] gap-4 rounded-lg border border-[#f5f0e6]/14 bg-[#11130f]/72 p-4 shadow-2xl backdrop-blur sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <StatusPill tone={agentActive ? "good" : "neutral"}>
                      <span className={`h-2.5 w-2.5 rounded-full ${agentActive ? "animate-pulse bg-[#74d58a]" : "bg-[#6f776b]"}`} />
                      {shortText(snapshot?.agent.name, 28, "Agent")} / {agentLabel(agentState)}
                    </StatusPill>
                    {snapshot?.agent.skill ? (
                      <StatusPill tone="accent">
                        <Activity size={15} />
                        {snapshot.agent.skill}
                      </StatusPill>
                    ) : null}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={goalLabel}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="max-w-4xl break-words text-2xl font-black leading-tight tracking-normal text-[#f7f0e2] [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl"
                    >
                      {goalLabel}
                    </motion.h2>
                  </AnimatePresence>
                </div>
                <div className="rounded-lg border border-[#f5f0e6]/12 bg-black/20 px-3 py-2 text-right">
                  <span className="block text-xs font-bold uppercase tracking-normal text-[#aeb8aa]">last seen</span>
                  <strong className="block text-sm font-semibold text-[#f7f0e2]">{relativeTime(snapshot?.agent.last_seen_at || snapshot?.generated_at)}</strong>
                </div>
              </div>

              <AcceptanceLoop
                loop={snapshot?.loop}
                agentState={agentState}
                decision={snapshot?.decision || "not_complete"}
                needUser={snapshot?.need_user === true}
                hasGap={snapshot?.current_gap !== null && snapshot?.current_gap !== undefined}
                noActiveGoal={snapshot?.status === "no_active_goal"}
              />
            </section>

            <aside className="grid min-w-0 content-start gap-3">
              <MetricPanel
                icon={<CircleDot size={19} />}
                label="Current gap"
                value={gapLabel}
                detail={shortText(snapshot?.current_gap?.reason, 100, "Acceptance gap is clear.")}
                tone={snapshot?.current_gap ? "warn" : snapshot?.status === "no_active_goal" ? "neutral" : "good"}
              />
              <MetricPanel
                icon={<UserRound size={19} />}
                label="Need user"
                value={snapshot?.need_user ? "yes" : "no"}
                detail={userAction}
                tone={needUserTone}
              />
              <MetricPanel
                icon={snapshot?.decision === "complete" ? <CheckCircle2 size={19} /> : <AlertTriangle size={19} />}
                label="Decision"
                value={decisionLabel(snapshot)}
                detail={shortText(snapshot?.completion?.answer, 98, "Waiting for current acceptance state.")}
                tone={decisionTone}
              />
              <MetricPanel
                icon={<GitBranch size={19} />}
                label="Architecture"
                value={architectureLabel(snapshot)}
                detail={snapshot?.architecture.open_challenges ? "Architecture challenge needs review." : "Baseline state is projected separately from Product AC."}
                tone={architectureTone}
              />
            </aside>
          </section>

          <footer className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.35fr)]">
            <div className="grid gap-3 rounded-lg border border-[#f5f0e6]/14 bg-[#11130f]/72 p-4 sm:grid-cols-3">
              <div className="min-w-0">
                <span className="mb-1 block text-xs font-bold uppercase tracking-normal text-[#aeb8aa]">Latest event</span>
                <strong className="block truncate text-base font-semibold text-[#f7f0e2]">{latestEvent ? latestEvent.type : "none"}</strong>
                <span className="mt-1 block truncate text-sm text-[#bfc7ba]">{shortText(latestEvent?.summary, 96, "Waiting for OpenNori activity.")}</span>
              </div>
              <div className="min-w-0">
                <span className="mb-1 block text-xs font-bold uppercase tracking-normal text-[#aeb8aa]">Evidence health</span>
                <strong className="block truncate text-base font-semibold text-[#f7f0e2]">{snapshot?.evidence_health?.status || "unknown"}</strong>
                <span className="mt-1 block truncate text-sm text-[#bfc7ba]">{shortText(snapshot?.evidence_health?.summary, 96, "No evidence projection yet.")}</span>
              </div>
              <div className="min-w-0">
                <span className="mb-1 block text-xs font-bold uppercase tracking-normal text-[#aeb8aa]">Acceptance review</span>
                <strong className="block truncate text-base font-semibold text-[#f7f0e2]">{snapshot?.acceptance_review?.status || "unknown"}</strong>
                <span className="mt-1 block truncate text-sm text-[#bfc7ba]">{shortText(snapshot?.acceptance_review?.summary, 96, "No acceptance projection yet.")}</span>
              </div>
            </div>

            <div className="flex min-h-24 items-center gap-3 rounded-lg border border-[#f5f0e6]/14 bg-[#11130f]/72 p-4">
              <ShieldCheck className="shrink-0 text-[#74d58a]" size={24} />
              <div className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-normal text-[#aeb8aa]">Completion authority</span>
                <strong className="block text-base font-semibold text-[#f7f0e2]">status / report</strong>
              </div>
              {error ? (
                <Tooltip.Root>
                  <Tooltip.Trigger className="ml-auto text-[#ffb15e]">
                    <Info size={18} />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content sideOffset={8} className="max-w-72 rounded-md border border-[#ffb15e]/30 bg-[#171914] px-3 py-2 text-xs text-[#ffe2bf] shadow-2xl">
                      {error}
                      <Tooltip.Arrow className="fill-[#171914]" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ) : null}
            </div>
          </footer>
        </section>
      </main>
    </Tooltip.Provider>
  );
}
