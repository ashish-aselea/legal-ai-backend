import { Server, Database, Cpu, Phone, HardDrive, Mail } from "lucide-react";

export default function SystemStatus({ apiOnline, dbOnline }) {
  // Only the API server and database are really observable from /health today;
  // the rest are placeholders until those services exist.
  const rows = [
    { label: "API Server", icon: Server, online: apiOnline, real: true },
    { label: "Database", icon: Database, online: dbOnline, real: true },
    { label: "AI Services", icon: Cpu, online: true },
    { label: "Agora (Calls)", icon: Phone, online: true },
    { label: "File Storage", icon: HardDrive, online: true },
    { label: "Email Service", icon: Mail, online: true },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900">System Status</h3>
        <button className="text-[12.5px] font-medium text-blue-600 hover:underline">View All</button>
      </div>

      <ul className="space-y-3.5">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <li key={r.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-[13px] text-slate-700">
                <Icon size={16} strokeWidth={1.8} className="text-slate-400" />
                {r.label}
                {!r.real && (
                  <span
                    title="Sample data — service not wired up yet"
                    className="rounded bg-slate-100 px-1.5 py-px text-[9px] font-semibold uppercase text-slate-400"
                  >
                    demo
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5 text-[12.5px]">
                <span
                  className={`h-2 w-2 rounded-full ${r.online ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className={r.online ? "text-green-600" : "text-red-500"}>
                  {r.online ? "Online" : "Offline"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
