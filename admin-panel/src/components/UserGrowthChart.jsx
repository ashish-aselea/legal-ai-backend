import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const formatDay = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function UserGrowthChart({ points = [], days, onDaysChange }) {
  const data = points.map((p) => ({ label: formatDay(p.date), users: p.totalUsers }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900">User Growth</h3>
        <select
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] text-slate-600 outline-none focus:border-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11.5, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 11.5, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 12.5,
                boxShadow: "0 4px 12px rgb(15 23 42 / 0.08)",
              }}
              labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              formatter={(v) => [v, "Total users"]}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#6366f1"
              strokeWidth={2.2}
              fill="url(#growthFill)"
              dot={{ r: 3.2, fill: "#6366f1", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
