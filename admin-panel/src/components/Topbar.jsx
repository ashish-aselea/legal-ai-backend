import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";

export default function Topbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="relative w-full max-w-md">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search anything..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex items-center gap-5">
        <button className="relative text-slate-500 hover:text-slate-700">
          <Bell size={20} strokeWidth={1.8} />
          <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="text-[13.5px] font-semibold text-slate-900">
                {user?.name || "Admin"}
              </div>
              <div className="text-[11.5px] text-slate-500">Super Admin</div>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 z-20 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
