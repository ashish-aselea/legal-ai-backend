import {
  Scale, LayoutDashboard, Users, UserCheck, Phone, ShieldCheck,
  MessageSquare, FileSearch, Gavel, BookOpen, LayoutGrid, FileText,
  AlertTriangle, MapPin, Share2, Briefcase, Bell, BarChart3,
  Settings, UserCog, ScrollText, ChevronLeft,
} from "lucide-react";

// Items without a backend yet are marked so the UI can show them as inactive
// instead of pretending they work.
const SECTIONS = [
  {
    label: null,
    items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard, ready: true }],
  },
  {
    label: "Users & Lawyers",
    items: [
      { key: "users", label: "Users", icon: Users, ready: true },
      { key: "lawyers", label: "Lawyers", icon: UserCheck, ready: true },
      { key: "consultations", label: "Consultations", icon: Phone, ready: true },
      { key: "verifications", label: "Verifications", icon: ShieldCheck, ready: true },
    ],
  },
  {
    label: "AI Services",
    items: [
      { key: "ai-chat", label: "AI Chat", icon: MessageSquare },
      { key: "notice-analyzer", label: "Notice Analyzer", icon: FileSearch },
      { key: "courtroom", label: "Courtroom Simulation", icon: Gavel },
    ],
  },
  {
    label: "Legal Content",
    items: [
      { key: "rights-hub", label: "Rights Hub", icon: BookOpen },
      { key: "categories", label: "Categories", icon: LayoutGrid },
      { key: "articles", label: "Articles", icon: FileText },
      { key: "legal-mistakes", label: "Legal Mistakes", icon: AlertTriangle },
      { key: "state-rights", label: "State Rights", icon: MapPin },
      { key: "shareable-cards", label: "Shareable Cards", icon: Share2 },
    ],
  },
  {
    label: "Manage",
    items: [
      { key: "practice-areas", label: "Practice Areas", icon: Briefcase, ready: true },
      { key: "notifications", label: "Notifications", icon: Bell },
      { key: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { key: "settings", label: "Settings", icon: Settings },
      { key: "admin-users", label: "Admin Users", icon: UserCog },
      { key: "audit-logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
];

export default function Sidebar({ active = "dashboard", onSelect }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Scale size={26} className="text-slate-800" strokeWidth={1.6} />
        <div className="leading-tight">
          <div className="text-[17px] font-bold text-slate-900">Legal AI</div>
          <div className="text-[11px] text-slate-500">Admin Panel</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {SECTIONS.map((section, i) => (
          <div key={i} className={section.label ? "mt-5" : ""}>
            {section.label && (
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelect?.(item.key, item.ready)}
                  title={item.ready ? item.label : `${item.label} — backend not built yet`}
                  className={[
                    "mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] transition",
                    isActive
                      ? "bg-blue-600 font-medium text-white"
                      : item.ready
                        ? "text-slate-700 hover:bg-slate-100"
                        : "text-slate-400 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <button className="flex items-center gap-2.5 border-t border-slate-200 px-5 py-3.5 text-[13px] text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} />
        Collapse Menu
      </button>
    </aside>
  );
}
