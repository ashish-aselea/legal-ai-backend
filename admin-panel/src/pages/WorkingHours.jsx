import { useEffect, useState, useCallback } from "react";
import { Pencil, Check, X } from "lucide-react";
import { api } from "../lib/api";
import { Spinner, EmptyState, PageHeader, Th, Td } from "../components/ui/Shared";

export default function WorkingHours() {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingDay, setEditingDay] = useState(null);
  const [draft, setDraft] = useState({ startTime: "", endTime: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listWorkingHours()
      .then((r) => setHours(r.data.workingHours))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const startEdit = (row) => {
    setEditingDay(row.day);
    setDraft({ startTime: row.startTime, endTime: row.endTime });
  };

  const cancelEdit = () => {
    setEditingDay(null);
    setError("");
  };

  const save = async (day) => {
    if (!draft.startTime.trim() || !draft.endTime.trim()) {
      setError("Both start and end time are required");
      return;
    }
    setSaving(true);
    try {
      await api.updateWorkingHours(day, draft.startTime.trim(), draft.endTime.trim());
      setEditingDay(null);
      setError("");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
      <PageHeader
        title="Working Hours"
        subtitle="Per-day time range shown on the lawyer's 'Set availability' screen — not linked to booking time slots."
      />

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
        ) : hours.length === 0 ? (
          <EmptyState text="Not seeded yet — run `npm run seed:working-hours` on the backend" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Day</Th>
                <Th>Start Time</Th>
                <Th>End Time</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {hours.map((row) => {
                const isEditing = editingDay === row.day;
                return (
                  <tr key={row.day} className="border-b border-slate-50 last:border-0">
                    <Td className="font-medium text-slate-800">{row.day}</Td>
                    {isEditing ? (
                      <>
                        <Td>
                          <input
                            value={draft.startTime}
                            onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))}
                            placeholder="10:00 AM"
                            className="w-28 rounded-md border border-slate-200 px-2 py-1 text-[12.5px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </Td>
                        <Td>
                          <input
                            value={draft.endTime}
                            onChange={(e) => setDraft((d) => ({ ...d, endTime: e.target.value }))}
                            placeholder="6:00 PM"
                            className="w-28 rounded-md border border-slate-200 px-2 py-1 text-[12.5px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </Td>
                        <Td className="text-right">
                          <span className="inline-flex gap-1.5">
                            <button
                              onClick={() => save(row.day)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 rounded-md border border-green-200 px-2.5 py-1 text-[12px] font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              {saving ? <Spinner size={12} /> : <Check size={13} />} Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                            >
                              <X size={13} /> Cancel
                            </button>
                          </span>
                        </Td>
                      </>
                    ) : (
                      <>
                        <Td className="text-slate-600">{row.startTime}</Td>
                        <Td className="text-slate-600">{row.endTime}</Td>
                        <Td className="text-right">
                          <button
                            onClick={() => startEdit(row)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                        </Td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
