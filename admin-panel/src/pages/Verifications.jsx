import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import { Avatar, Spinner, EmptyState, PageHeader, ReasonModal, formatDate } from "../components/ui/Shared";

export default function Verifications() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listLawyers({ status: "pending" })
      .then((r) => setLawyers(r.data.lawyers))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const approve = async (l) => {
    setBusyId(l._id);
    try {
      await api.approveLawyer(l._id);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
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
      <PageHeader
        title="Verifications"
        subtitle={`${lawyers.length} lawyer application${lawyers.length === 1 ? "" : "s"} waiting for review.`}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : lawyers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
            <ShieldCheck size={32} strokeWidth={1.5} />
            <EmptyState text="No pending applications — the queue is clear." />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {lawyers.map((l, i) => (
            <div key={l._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={l.user?.name} i={i} size={40} />
                  <div>
                    <div className="text-[14.5px] font-semibold text-slate-900">{l.user?.name || "—"}</div>
                    <div className="text-[12px] text-slate-500">
                      {l.user?.mobile} · Applied {formatDate(l.createdAt)}
                    </div>
                  </div>
                </div>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                  Pending
                </span>
              </div>

              <dl className="mb-4 grid grid-cols-2 gap-y-2 text-[12.5px]">
                <dt className="text-slate-400">I am a</dt>
                <dd className="text-slate-700">{l.iAmA}</dd>
                <dt className="text-slate-400">Practice area</dt>
                <dd className="text-slate-700">{l.practiceArea}</dd>
                <dt className="text-slate-400">Experience</dt>
                <dd className="text-slate-700">{l.yearsOfExperience} years</dd>
                <dt className="text-slate-400">City / Jurisdiction</dt>
                <dd className="text-slate-700">{l.cityJurisdiction}</dd>
                <dt className="text-slate-400">Bar Council No.</dt>
                <dd className="text-slate-700">{l.barCouncilEnrollmentNumber}</dd>
                <dt className="text-slate-400">Email</dt>
                <dd className="truncate text-slate-700">{l.user?.email || "—"}</dd>
              </dl>

              <div className="flex gap-2">
                <button
                  onClick={() => approve(l)}
                  disabled={busyId === l._id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2 text-[12.5px] font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {busyId === l._id ? <Spinner size={14} className="text-white" /> : <CheckCircle2 size={14} />}
                  Approve
                </button>
                <button
                  onClick={() => setRejectTarget(l)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-[12.5px] font-semibold text-red-600 hover:bg-red-50"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
