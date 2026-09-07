import { FileText, Briefcase, ScrollText, ShieldAlert, FileWarning } from "lucide-react";

const AVATAR_TONES = [
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-purple-100 text-purple-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
];

const Avatar = ({ name, i }) => (
  <span
    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold ${
      AVATAR_TONES[i % AVATAR_TONES.length]
    }`}
  >
    {(name || "?").charAt(0).toUpperCase()}
  </span>
);

const Badge = ({ text, tone }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11.5px] font-medium ${tones[tone] || tones.slate}`}>
      {text}
    </span>
  );
};

const Card = ({ title, isMock, children }) => (
  <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {isMock && (
          <span
            title="Sample data — no backend for this yet"
            className="rounded bg-slate-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-slate-500"
          >
            demo
          </span>
        )}
      </div>
      <button className="text-[12.5px] font-medium text-blue-600 hover:underline">View All</button>
    </div>
    {/* Long names/cities would otherwise push the last column outside the card. */}
    <div className="overflow-x-auto">{children}</div>
  </div>
);

const Th = ({ children, className = "" }) => (
  <th
    className={`whitespace-nowrap pb-2.5 pr-2 text-left text-[11.5px] font-medium text-slate-500 last:pr-0 ${className}`}
  >
    {children}
  </th>
);

const Td = ({ children, className = "" }) => (
  <td className={`whitespace-nowrap py-2.5 pr-2 text-[12.5px] text-slate-700 last:pr-0 ${className}`}>
    {children}
  </td>
);

const maskMobile = (m) => (m && m.length === 10 ? `${m.slice(0, 2)}XXXX${m.slice(6)}` : m || "—");

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

// The AI Analyses card is the narrowest column, so it drops the year.
const formatDateShort = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

export function RecentUsersTable({ users = [] }) {
  return (
    <Card title="Recent Users">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <Th>Name</Th>
            <Th>Mobile</Th>
            <Th>Role</Th>
            <Th>City</Th>
            <Th>Joined At</Th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <Td className="text-slate-400" colSpan={5}>
                No users yet
              </Td>
            </tr>
          )}
          {users.map((u, i) => (
            <tr key={u.id} className="border-b border-slate-50 last:border-0">
              <Td>
                <span className="flex items-center gap-2.5">
                  <Avatar name={u.name} i={i} />
                  <span className="block max-w-[110px] truncate font-medium text-slate-800">
                    {u.name || "—"}
                  </span>
                </span>
              </Td>
              <Td className="text-slate-500">{maskMobile(u.mobile)}</Td>
              <Td>
                <Badge text={u.role === "lawyer" ? "Lawyer" : "User"} tone={u.role === "lawyer" ? "green" : "blue"} />
              </Td>
              <Td className="text-slate-500">
                <span className="block max-w-[80px] truncate" title={u.city || ""}>
                  {u.city || "—"}
                </span>
              </Td>
              <Td className="text-slate-500">{formatDate(u.joinedAt)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

const STATUS_TONE = { approved: "green", pending: "amber", rejected: "red" };

export function RecentApplicationsTable({ applications = [] }) {
  return (
    <Card title="Recent Lawyer Applications">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <Th>Name</Th>
            <Th>Practice Area</Th>
            <Th>Status</Th>
            <Th>Applied At</Th>
          </tr>
        </thead>
        <tbody>
          {applications.length === 0 && (
            <tr>
              <Td className="text-slate-400" colSpan={4}>
                No applications yet
              </Td>
            </tr>
          )}
          {applications.map((a, i) => (
            <tr key={a.id} className="border-b border-slate-50 last:border-0">
              <Td>
                <span className="flex items-center gap-2.5">
                  <Avatar name={a.name} i={i} />
                  <span className="block max-w-[100px] truncate font-medium text-slate-800">
                    {a.name || "—"}
                  </span>
                </span>
              </Td>
              <Td className="text-slate-500">{a.practiceArea}</Td>
              <Td>
                <Badge
                  text={a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  tone={STATUS_TONE[a.status]}
                />
              </Td>
              <Td className="text-slate-500">{formatDate(a.appliedAt)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// Placeholder rows — there is no AI analysis feature in the backend yet.
const MOCK_ANALYSES = [
  { icon: FileText, type: "Property Notice", urgency: "High", at: "2026-08-31" },
  { icon: Briefcase, type: "Employment Notice", urgency: "Medium", at: "2026-08-31" },
  { icon: ScrollText, type: "Rent Agreement", urgency: "Low", at: "2026-08-30" },
  { icon: ShieldAlert, type: "Legal Summons", urgency: "High", at: "2026-08-30" },
  { icon: FileWarning, type: "Consumer Complaint", urgency: "Medium", at: "2026-08-29" },
];

const URGENCY_TONE = { High: "red", Medium: "amber", Low: "blue" };

export function RecentAnalysesTable() {
  return (
    <Card title="Recent AI Analyses" isMock>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <Th>Notice Type</Th>
            <Th>Urgency</Th>
            <Th>Created At</Th>
          </tr>
        </thead>
        <tbody>
          {MOCK_ANALYSES.map((a) => {
            const Icon = a.icon;
            return (
              <tr key={a.type} className="border-b border-slate-50 last:border-0">
                <Td>
                  <span className="flex items-center gap-2">
                    <Icon size={16} strokeWidth={1.7} className="shrink-0 text-slate-400" />
                    <span className="block max-w-[118px] truncate text-slate-700" title={a.type}>
                      {a.type}
                    </span>
                  </span>
                </Td>
                <Td>
                  <Badge text={a.urgency} tone={URGENCY_TONE[a.urgency]} />
                </Td>
                <Td className="text-slate-500">{formatDateShort(a.at)}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
