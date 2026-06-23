import * as Tooltip from "@radix-ui/react-tooltip";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchSnapshot, subscribeToEvents } from "./api";
import { AcceptanceRadarNet } from "./components/AcceptanceRadarNet";
import { DashboardHeader } from "./components/DashboardHeader";
import { EventLogConsole } from "./components/EventLogConsole";
import { InspectDrawer } from "./components/InspectDrawer";
import { OutcomeHud } from "./components/OutcomeHud";
import type { ConnectionState, DrawerTab } from "./dashboard-view";
import {
  buildSuggestedAgentReply,
  findLatestAgentEvent,
  isAgentRunning,
  snapshotRenderKey,
  sortedRecentEvents
} from "./dashboard-view";
import type { RadarNode } from "./types";
import { gapIdFromFocusEvent, profileNodeFromSnapshot, renderedCriterionNodeFromSnapshot, syncSelectedNodeWithSnapshot } from "./selection";
import type { NoriSnapshot } from "./types";

export default function App() {
  const [snapshot, setSnapshot] = useState<NoriSnapshot | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [error, setError] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<RadarNode | null>(null);
  const [copied, setCopied] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("visual");
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

  const suggestedAgentReply = useMemo(() => {
    return buildSuggestedAgentReply(snapshot);
  }, [snapshot]);

  const recentEvents = useMemo(() => {
    return sortedRecentEvents(snapshot);
  }, [snapshot]);
  const latestAgentEvent = useMemo(() => {
    return findLatestAgentEvent(recentEvents);
  }, [recentEvents]);
  const agentRunning = isAgentRunning(snapshot);
  const inspectProfile = useCallback(() => {
    if (!snapshot) return;
    setSelectedNode(profileNodeFromSnapshot(snapshot));
    setDrawerTab("visual");
  }, [snapshot]);

  return (
    <Tooltip.Provider delayDuration={180}>
      <main className="relative h-screen max-h-screen overflow-hidden bg-[#080914] text-[#e2e8f0]">
        {/* 简体中文：赛博极光背景滤镜 */}
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(140deg,#080914_0%,#0c0f24_50%,#1a1129_100%)]" />
        <div className="pointer-events-none fixed inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(0,240,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />

        {/* 简体中文：限制 100vh 高度自适应并微调 padding 间距，消除滚动 */}
        <section className="relative z-10 grid h-full max-h-full grid-rows-[auto_1fr_auto] gap-3 p-3 lg:gap-4 lg:p-6 min-h-0 overflow-hidden">
          <DashboardHeader
            agentRunning={agentRunning}
            connection={connection}
            snapshot={snapshot}
            onInspectProfile={inspectProfile}
            onRefresh={() => void refresh()}
          />

          <section className="relative h-full max-h-full min-h-0 overflow-hidden">
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

                {snapshot ? (
                  <OutcomeHud
                    snapshot={snapshot}
                    suggestedAgentReply={suggestedAgentReply}
                    copied={copied}
                    latestAgentEvent={latestAgentEvent}
                    onCopySuggestedReply={() => copyToClipboard(suggestedAgentReply)}
                    onInspectProfile={inspectProfile}
                  />
                ) : null}
              </div>
            </div>

            <InspectDrawer
              selectedNode={selectedNode}
              drawerTab={drawerTab}
              onTabChange={setDrawerTab}
              onClose={() => setSelectedNode(null)}
            />
          </section>

          <EventLogConsole events={recentEvents} agentRunning={agentRunning} error={error} />
        </section>
      </main>
    </Tooltip.Provider>
  );
}
