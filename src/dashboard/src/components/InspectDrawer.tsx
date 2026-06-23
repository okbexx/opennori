import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { DrawerTab } from "../dashboard-view";
import { inspectedNodeTitle } from "../dashboard-view";
import type { RadarNode } from "../types";
import { InspectNodePanel } from "./InspectNodePanel";

export function InspectDrawer({
  selectedNode,
  drawerTab,
  onTabChange,
  onClose
}: {
  selectedNode: RadarNode | null;
  drawerTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {selectedNode ? (
        <motion.div
          initial={{ opacity: 0, x: 260 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 260 }}
          transition={{ type: "spring", damping: 22, stiffness: 150 }}
          className="absolute right-4 top-4 bottom-4 z-30 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-[rgba(189,147,249,0.18)] bg-[rgba(16,20,38,0.78)] p-4 shadow-2xl backdrop-blur-md grid grid-rows-[auto_1fr] min-h-0 overflow-hidden"
        >
          <div className="border-b border-slate-800 pb-3 mb-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#bd93f9]">
                  Inspected Node
                </span>
                <h3 className="text-base font-semibold text-[#e2e8f0]">
                  {inspectedNodeTitle(selectedNode)}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close panel"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="inline-flex items-center rounded-lg bg-black/45 p-0.5 border border-slate-800/80 self-start">
              <button
                type="button"
                onClick={() => onTabChange("visual")}
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
                onClick={() => onTabChange("json")}
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
  );
}
