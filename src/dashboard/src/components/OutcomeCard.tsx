export function OutcomeCard({
  label,
  title,
  detail,
  badge,
  tone = "cyan",
  icon
}: {
  label: string;
  title: string;
  detail: string;
  badge?: string;
  tone?: "cyan" | "green" | "purple" | "amber" | "rose";
  icon?: React.ReactNode;
}) {
  const toneClass = {
    cyan: "border-l-[#00f0ff] border-[rgba(0,240,255,0.12)]",
    green: "border-l-[#34d399] border-[rgba(52,211,153,0.12)]",
    purple: "border-l-[#bd93f9] border-[rgba(189,147,249,0.12)]",
    amber: "border-l-[#fbbf24] border-[rgba(251,191,36,0.12)]",
    rose: "border-l-rose-400 border-rose-400/15"
  }[tone];
  const textClass = {
    cyan: "text-[#00f0ff] bg-[#00f0ff]/10",
    green: "text-[#34d399] bg-[#34d399]/10",
    purple: "text-[#bd93f9] bg-[#bd93f9]/10",
    amber: "text-[#fbbf24] bg-[#fbbf24]/10",
    rose: "text-rose-300 bg-rose-500/10"
  }[tone];
  return (
    <div className={`rounded-lg border-l-[3.5px] ${toneClass} bg-[rgba(8,9,20,0.85)] p-3 shadow-2xl backdrop-blur-md text-left`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${textClass}`}>
          {icon}
          {label}
        </span>
        {badge ? (
          <span className="shrink-0 rounded border border-slate-700/80 bg-black/30 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="text-[11px] font-bold leading-relaxed tracking-wide text-slate-100 break-words">
        {title}
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-400 break-words">
        {detail}
      </p>
    </div>
  );
}
