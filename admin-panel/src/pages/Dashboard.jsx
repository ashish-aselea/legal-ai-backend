import { useEffect, useState } from "react";
import { Users, UserCheck, FileText, Phone, Clock, Calendar, ChevronDown, Scale } from "lucide-react";
import { api } from "../lib/api";
import StatCard from "../components/StatCard";
import UserGrowthChart from "../components/UserGrowthChart";
import AiUsageChart from "../components/AiUsageChart";
import SystemStatus from "../components/SystemStatus";
import { RecentUsersTable, RecentApplicationsTable, RecentAnalysesTable } from "../components/Tables";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const rangeLabel = (days) => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  const f = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${f(from)} - ${f(to)}`;
};

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [recent, setRecent] = useState({ recentUsers: [], recentLawyerApplications: [] });
  const [days, setDays] = useState(7);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .dashboardStats()
      .then((r) => setStats(r.data.stats))
      .catch((e) => setError(e.message));
    api
      .recentActivity()
      .then((r) => setRecent(r.data))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    api
      .userGrowth(days)
      .then((r) => setGrowth(r.data.points))
      .catch((e) => setError(e.message));
  }, [days]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900">
            {greeting()}, {user?.name?.split(" ")[0] || "Admin"}! <span className="ml-0.5">👋</span>
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Here's what's happening with your Legal AI platform today.
          </p>
        </div>
        <button className="flex shrink-0 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-700">
          <Calendar size={16} className="text-slate-400" />
          {rangeLabel(days)}
          <ChevronDown size={15} className="text-slate-400" />
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Users"
          value={stats ? stats.totalUsers.value : "—"}
          change={stats ? stats.totalUsers.changePercent : 0}
          tone="blue"
          icon={Users}
        />
        <StatCard
          label="Verified Lawyers"
          value={stats ? stats.verifiedLawyers.value : "—"}
          change={stats ? stats.verifiedLawyers.changePercent : 0}
          tone="green"
          icon={UserCheck}
        />
        <StatCard label="AI Analyses" value={8920} change={18.4} tone="purple" icon={FileText} isMock />
        <StatCard
          label="Consultations"
          value={stats ? stats.consultations.value : "—"}
          change={stats ? stats.consultations.changePercent : 0}
          tone="orange"
          icon={Phone}
        />
        <StatCard
          label="Pending Approvals"
          value={stats ? stats.pendingApprovals.value : "—"}
          change={stats ? stats.pendingApprovals.changePercent : 0}
          tone="red"
          icon={Clock}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <UserGrowthChart points={growth} days={days} onDaysChange={setDays} />
        </div>
        <div className="lg:col-span-4">
          <AiUsageChart />
        </div>
        <div className="lg:col-span-3">
          <SystemStatus apiOnline dbOnline />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <RecentUsersTable users={recent.recentUsers} />
        </div>
        <div className="xl:col-span-4">
          <RecentApplicationsTable applications={recent.recentLawyerApplications} />
        </div>
        <div className="xl:col-span-3">
          <RecentAnalysesTable />
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-5">
        <div className="flex items-center gap-3.5">
          <Scale size={30} className="text-blue-600" strokeWidth={1.6} />
          <div>
            <div className="text-[17px] font-bold text-slate-900">Legal AI</div>
            <div className="text-[13px] text-slate-600">
              Making Legal Support Accessible for Everyone
            </div>
          </div>
        </div>
        <div className="hidden text-right md:block">
          <div className="text-[13.5px] italic text-slate-600">
            "Knowledge is the first step to justice."
          </div>
          <div className="text-[12.5px] text-slate-500">— Legal AI</div>
        </div>
      </div>
    </div>
  );
}
