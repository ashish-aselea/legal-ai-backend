import { ArrowUp, ArrowDown } from "lucide-react";

const TONES = {
  blue: { card: "bg-blue-50/70 border-blue-100", icon: "bg-blue-100 text-blue-600" },
  green: { card: "bg-green-50/70 border-green-100", icon: "bg-green-100 text-green-600" },
  purple: { card: "bg-purple-50/70 border-purple-100", icon: "bg-purple-100 text-purple-600" },
  orange: { card: "bg-orange-50/70 border-orange-100", icon: "bg-orange-100 text-orange-500" },
  red: { card: "bg-red-50/70 border-red-100", icon: "bg-red-100 text-red-500" },
};

export default function StatCard({ label, value, change, tone = "blue", icon: Icon, isMock }) {
  const t = TONES[tone];
  const up = change >= 0;

  return (
    <div className={`rounded-xl border p-5 ${t.card}`}>
      <div className="flex items-start gap-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${t.icon}`}>
          <Icon size={20} strokeWidth={1.9} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-slate-600">{label}</span>
            {isMock && (
              <span
                title="Sample data — no backend for this metric yet"
                className="rounded bg-slate-200/80 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-slate-500"
              >
                demo
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[27px] font-bold leading-tight text-slate-900">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[12.5px]">
            <span className={`flex items-center gap-0.5 font-semibold ${up ? "text-green-600" : "text-red-500"}`}>
              {up ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              {Math.abs(change)}%
            </span>
          </div>
          <div className="text-[11.5px] text-slate-500">from last week</div>
        </div>
      </div>
    </div>
  );
}
