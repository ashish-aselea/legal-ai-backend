import { useEffect, useState, useCallback } from "react";
import { Eye, EyeOff, Save, ShieldCheck, ShieldAlert } from "lucide-react";
import { api } from "../lib/api";
import { Spinner, PageHeader, Badge, Th, Td } from "../components/ui/Shared";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getPaymentSettings()
      .then((r) => {
        setSettings(r.data.settings);
        setKeyId(r.data.settings.razorpayKeyId || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const save = async () => {
    setError("");
    setSuccess("");
    const changes = {};
    if (keyId.trim()) changes.razorpayKeyId = keyId.trim();
    if (keySecret.trim()) changes.razorpayKeySecret = keySecret.trim();

    if (Object.keys(changes).length === 0) {
      setError("Enter a Key ID and/or Key Secret to save");
      return;
    }

    setSaving(true);
    try {
      const r = await api.updatePaymentSettings(changes);
      setSettings(r.data.settings);
      setKeySecret(""); // never keep the secret sitting in the input after a successful save
      setSuccess("Payment settings saved");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
      <PageHeader title="Settings" subtitle="Platform-wide configuration." />

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 xl:col-span-3">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">Payment Gateway — Razorpay</h3>
              <Badge
                text={settings.isRazorpayKeySecretSet ? "Configured" : "Not configured"}
                tone={settings.isRazorpayKeySecretSet ? "green" : "amber"}
              />
            </div>
            <p className="mb-5 text-[12.5px] text-slate-500">
              Storage only for now — these credentials are saved for when the real payment flow is wired
              up later. They do not process any live payments yet.
            </p>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <ShieldCheck size={15} /> {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12.5px] font-medium text-slate-700">Key ID</label>
                <input
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder="rzp_test_xxxxxxxxxxxx"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-[11.5px] text-slate-400">Not secret — safe to display.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12.5px] font-medium text-slate-700">Key Secret</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    placeholder={
                      settings?.isRazorpayKeySecretSet
                        ? "Already set — leave blank to keep it, or type to replace"
                        : "Enter your Razorpay key secret"
                    }
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 pr-10 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-slate-400">
                  <ShieldAlert size={12} />
                  Never shown again once saved — the server only tells us whether one is set, not its
                  value.
                </p>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:col-span-2 sm:w-fit"
              >
                {saving ? <Spinner size={14} className="text-white" /> : <Save size={14} />}
                Save Settings
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 xl:col-span-2">
            <h3 className="mb-4 text-[15px] font-semibold text-slate-900">Current Configuration</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Field</Th>
                  <Th>Value</Th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50">
                  <Td className="text-slate-500">Key ID</Td>
                  <Td className="font-medium text-slate-800">{settings.razorpayKeyId || "Not set"}</Td>
                </tr>
                <tr>
                  <Td className="text-slate-500">Key Secret</Td>
                  <Td className="font-medium text-slate-800">
                    {settings.isRazorpayKeySecretSet ? "•••••••••••• (configured)" : "Not set"}
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
