import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api, getToken, clearToken } from "./lib/api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Lawyers from "./pages/Lawyers";
import Verifications from "./pages/Verifications";
import Consultations from "./pages/Consultations";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

const PAGES = {
  dashboard: Dashboard,
  users: Users,
  lawyers: Lawyers,
  verifications: Verifications,
  consultations: Consultations,
};

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!getToken()) {
      setChecking(false);
      return;
    }
    api
      .me()
      .then((r) => {
        if (r.data.user.role === "admin") setUser(r.data.user);
        else clearToken();
      })
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  const handleSelect = (key, ready) => {
    if (!ready) {
      setNotice("This section has no backend yet — coming soon.");
      setTimeout(() => setNotice(""), 2500);
      return;
    }
    setActive(key);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" size={26} />
      </div>
    );
  }

  if (!user) return <Login onLoggedIn={setUser} />;

  const Page = PAGES[active] || (() => (
    <div className="flex flex-1 items-center justify-center bg-slate-50 text-slate-400">
      <div className="text-center">
        <div className="text-lg font-medium text-slate-600">
          {active.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </div>
        <div className="mt-1 text-sm">This page is not built yet.</div>
      </div>
    </div>
  ));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar active={active} onSelect={handleSelect} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          onLogout={() => {
            clearToken();
            setUser(null);
          }}
        />

        {notice && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-[13px] text-amber-800">
            {notice}
          </div>
        )}

        <Page user={user} />
      </div>
    </div>
  );
}
