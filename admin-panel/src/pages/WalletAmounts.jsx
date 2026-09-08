import { useEffect, useState, useCallback } from "react";
import { Pencil, Check, X, Plus, Ban, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { Badge, Spinner, EmptyState, PageHeader, Th, Td } from "../components/ui/Shared";

export default function WalletAmounts() {
  const [amounts, setAmounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listWalletAmounts()
      .then((r) => setAmounts(r.data.presetAmounts))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const addAmount = async () => {
    const value = Number(newAmount);
    if (!value || value <= 0) {
      setError("Enter a valid positive amount");
      return;
    }
    setSaving(true);
    try {
      await api.createWalletAmount(value);
      setNewAmount("");
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
    setDraftAmount(String(row.amount));
  };

  const saveEdit = async (id) => {
    const value = Number(draftAmount);
    if (!value || value <= 0) {
      setError("Enter a valid positive amount");
      return;
    }
    setSaving(true);
    try {
      await api.updateWalletAmount(id, { amount: value });
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
      await api.updateWalletAmount(row.id, { isActive: !row.isActive });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
      <PageHeader
        title="Wallet Amounts"
        subtitle="Quick-select amounts shown on the app's 'My Wallet' add-money screen."
      />

      <div className="mb-4 flex items-center gap-2">
        <input
          type="number"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="Add new amount, e.g. 25000"
          className="w-64 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          onClick={addAmount}
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
        ) : amounts.length === 0 ? (
          <EmptyState text="No amounts yet — run `npm run seed:wallet-amounts` or add one above" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {amounts.map((row) => {
                const isEditing = editingId === row.id;
                return (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0">
                    {isEditing ? (
                      <Td>
                        <input
                          type="number"
                          autoFocus
                          value={draftAmount}
                          onChange={(e) => setDraftAmount(e.target.value)}
                          className="w-28 rounded-md border border-slate-200 px-2 py-1 text-[12.5px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </Td>
                    ) : (
                      <Td className="font-medium text-slate-800">₹{row.amount.toLocaleString("en-IN")}</Td>
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
