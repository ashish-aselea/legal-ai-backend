import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Sample data: the AI features in this chart have no backend yet.
const DATA = [
  { name: "Notice Analyzer", value: 42, color: "#3b82f6" },
  { name: "AI Chat", value: 28, color: "#22c55e" },
  { name: "Courtroom Simulation", value: 12, color: "#f59e0b" },
  { name: "Other", value: 18, color: "#cbd5e1" },
];

const TOTAL = 8920;

export default function AiUsageChart() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[15px] font-semibold text-slate-900">AI Usage by Feature</h3>
        <span
          title="Sample data — AI features have no backend yet"
          className="rounded bg-slate-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-slate-500"
        >
          demo
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative h-[200px] w-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DATA}
                dataKey="value"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={1}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {DATA.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[21px] font-bold text-slate-900">{TOTAL.toLocaleString("en-IN")}</div>
            <div className="text-[11.5px] text-slate-500">Total</div>
          </div>
        </div>

        <ul className="flex-1 space-y-3">
          {DATA.map((d) => (
            <li key={d.name} className="flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}
              </span>
              <span className="font-semibold text-slate-900">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
