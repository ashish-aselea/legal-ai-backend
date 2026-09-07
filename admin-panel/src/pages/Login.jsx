import { useState } from "react";
import { Scale, Loader2 } from "lucide-react";
import { api, setToken } from "../lib/api";

export default function Login({ onLoggedIn }) {
  const [step, setStep] = useState("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitMobile = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.sendOtp(mobile.trim());
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.verifyOtp(mobile.trim(), otp.trim());
      const { token, user } = res.data;
      if (!token || !user || user.role !== "admin") {
        throw new Error("This number is not an admin account.");
      }
      setToken(token);
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Scale size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Legal AI</h1>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
        </div>

        {step === "mobile" ? (
          <form onSubmit={submitMobile} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mobile number</label>
              <input
                autoFocus
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              disabled={loading || mobile.trim().length !== 10}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Enter OTP sent to {mobile}
              </label>
              <input
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                inputMode="numeric"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              disabled={loading || otp.trim().length < 4}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Verify &amp; Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("mobile");
                setOtp("");
                setError("");
              }}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
            >
              Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
