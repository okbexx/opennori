import * as Tooltip from "@radix-ui/react-tooltip";

export function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
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
