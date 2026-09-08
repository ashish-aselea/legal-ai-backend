import { useEffect, useState, useCallback } from "react";
import { Pencil, Check, X, Plus, Ban, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { Badge, Spinner, EmptyState, PageHeader, Th, Td } from "../components/ui/Shared";

export default function PracticeAreas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listPracticeAreas()
      .then((r) => setAreas(r.data.practiceAreas))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const addArea = async () => {
    if (!newName.trim()) {
      setError("Enter a name for the new practice area");
      return;
    }
    setSaving(true);
    try {
      await api.createPracticeArea(newName.trim());
      setNewName("");
      setError("");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setDraftName(row.name);
  };

  const saveEdit = async (id) => {
    if (!draftName.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await api.updatePracticeArea(id, { name: draftName.trim() });
      setEditingId(null);
      setError("");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      await api.updatePracticeArea(row.id, { isActive: !row.isActive });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
      <PageHeader
        title="Practice Areas"
        subtitle="Categories shown in the lawyer signup dropdown and the 'Find a lawyer' filter chips."
      />

      <div className="mb-4 flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add new practice area, e.g. Tax Law"
          className="w-72 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          onClick={addArea}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={14} /> Add
        </button>
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
        ) : areas.length === 0 ? (
          <EmptyState text="No practice areas yet — run `npm run seed:practice-areas` or add one above" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Name</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {areas.map((row) => {
                const isEditing = editingId === row.id;
                return (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0">
                    {isEditing ? (
                      <Td>
                        <input
                          autoFocus
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="w-64 rounded-md border border-slate-200 px-2 py-1 text-[12.5px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </Td>
                    ) : (
                      <Td className="font-medium text-slate-800">{row.name}</Td>
                    )}
                    <Td>
                      <Badge text={row.isActive ? "Active" : "Inactive"} tone={row.isActive ? "green" : "slate"} />
                    </Td>
                    <Td className="text-right">
                      {isEditing ? (
                        <span className="inline-flex gap-1.5">
                          <button
                            onClick={() => saveEdit(row.id)}
                            disabled={saving}
                            className="inline-flex items-center gap-1 rounded-md border border-green-200 px-2.5 py-1 text-[12px] font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            {saving ? <Spinner size={12} /> : <Check size={13} />} Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                          >
                            <X size={13} /> Cancel
                          </button>
                        </span>
                      ) : (
                        <span className="inline-flex gap-1.5">
                          <button
                            onClick={() => startEdit(row)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            onClick={() => toggleActive(row)}
                            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px] font-medium ${
                              row.isActive
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {row.isActive ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                            {row.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </span>
                      )}
                    </Td>
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
