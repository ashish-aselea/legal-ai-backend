import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "../lib/api";
import {
  Avatar, Badge, Spinner, EmptyState, PageHeader, SearchInput, FilterTabs,
  ReasonModal, Th, Td, formatDate,
} from "../components/ui/Shared";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_TONE = { approved: "green", pending: "amber", rejected: "red" };

export default function Lawyers() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listLawyers({ status: status || undefined })
      .then((r) => setLawyers(r.data.lawyers))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(load, [load]);

  const visible = search
    ? lawyers.filter((l) => {
        const re = new RegExp(search, "i");
        return re.test(l.user?.name || "") || re.test(l.practiceArea || "") || re.test(l.cityJurisdiction || "");
      })
    : lawyers;

  const approve = async (l) => {
    try {
      await api.approveLawyer(l._id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const confirmReject = async (reason) => {
    try {
      await api.rejectLawyer(rejectTarget._id, reason);
      setRejectTarget(null);
      load();
    } catch (e) {
      setError(e.message);
      setRejectTarget(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
      <PageHeader title="Lawyers" subtitle="All lawyer applications and their approval status." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs options={STATUS_TABS} value={status} onChange={setStatus} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, practice area, city..." />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState text="No lawyers found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Name</Th>
                  <Th>Practice Area</Th>
                  <Th>Experience</Th>
                  <Th>City</Th>
                  <Th>Price/Session</Th>
                  <Th>Status</Th>
                  <Th>Applied</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((l, i) => (
                  <tr key={l._id} className="border-b border-slate-50 last:border-0">
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={l.user?.name} i={i} />
                        <span className="font-medium text-slate-800">{l.user?.name || "—"}</span>
                        {l.user?.isBlocked && <Badge text="Blocked" tone="red" />}
                      </span>
                    </Td>
                    <Td className="text-slate-500">{l.practiceArea}</Td>
                    <Td className="text-slate-500">{l.yearsOfExperience} yrs</Td>
                    <Td className="text-slate-500">{l.cityJurisdiction}</Td>
                    <Td className="text-slate-500">{l.pricePerSession ? `₹${l.pricePerSession}` : "—"}</Td>
                    <Td>
                      <span title={l.rejectionReason || ""}>
                        <Badge text={l.approvalStatus.charAt(0).toUpperCase() + l.approvalStatus.slice(1)} tone={STATUS_TONE[l.approvalStatus]} />
                      </span>
                    </Td>
                    <Td className="text-slate-500">{formatDate(l.createdAt)}</Td>
                    <Td className="text-right">
                      {l.approvalStatus === "pending" ? (
                        <span className="inline-flex gap-1.5">
                          <button
                            onClick={() => approve(l)}
                            className="inline-flex items-center gap-1 rounded-md border border-green-200 px-2.5 py-1 text-[12px] font-medium text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget(l)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-[12px] font-medium text-red-600 hover:bg-red-50"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </span>
                      ) : (
                        <span className="text-[12px] text-slate-300">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectTarget && (
        <ReasonModal
          title={`Reject ${rejectTarget.user?.name || "this application"}?`}
          confirmLabel="Reject Application"
          tone="red"
          requireReason
          onCancel={() => setRejectTarget(null)}
          onConfirm={confirmReject}
        />
      )}
    </div>
  );
}
