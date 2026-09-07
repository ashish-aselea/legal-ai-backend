import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Phone, Video } from "lucide-react";
import { api } from "../lib/api";
import { Badge, Spinner, EmptyState, PageHeader, SearchInput, FilterTabs, Th, Td, formatDate } from "../components/ui/Shared";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_LABEL = { pending_payment: "Pending Payment", confirmed: "Confirmed", cancelled: "Cancelled" };
const STATUS_TONE = { pending_payment: "amber", confirmed: "green", cancelled: "red" };

const TYPE_ICON = { Chat: MessageSquare, Audio: Phone, Video: Video };

export default function Consultations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .listConsultations({ status: status || undefined, search: search || undefined })
      .then((r) => setItems(r.data.consultations))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
      <PageHeader title="Consultations" subtitle="Every booking made between a user and a lawyer." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs options={STATUS_TABS} value={status} onChange={setStatus} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search user or lawyer name..." />
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
        ) : items.length === 0 ? (
          <EmptyState text="No consultations found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>User</Th>
                  <Th>Lawyer</Th>
                  <Th>Type</Th>
                  <Th>Date</Th>
                  <Th>Time Slot</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const TypeIcon = TYPE_ICON[c.consultationType] || MessageSquare;
                  return (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0">
                      <Td>
                        <div className="font-medium text-slate-800">{c.user?.name || "—"}</div>
                        <div className="text-[11.5px] text-slate-400">{c.user?.mobile}</div>
                      </Td>
                      <Td>
                        <div className="font-medium text-slate-800">{c.lawyer?.name || "—"}</div>
                        <div className="text-[11.5px] text-slate-400">{c.lawyer?.practiceArea}</div>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <TypeIcon size={14} strokeWidth={1.8} className="text-slate-400" />
                          {c.consultationType}
                        </span>
                      </Td>
                      <Td className="text-slate-500">{formatDate(c.date)}</Td>
                      <Td className="text-slate-500">{c.timeSlot}</Td>
                      <Td className="font-medium text-slate-800">₹{c.amount}</Td>
                      <Td>
                        <Badge text={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
