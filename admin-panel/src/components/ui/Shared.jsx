import { useState } from "react";
import { Loader2, X } from "lucide-react";

const AVATAR_TONES = [
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-purple-100 text-purple-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
];

export const Avatar = ({ name, i = 0, photoUrl, size = 32 }) => {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name || ""}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
};

const BADGE_TONES = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
};

export const Badge = ({ text, tone = "slate" }) => (
  <span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-medium ${BADGE_TONES[tone]}`}>
    {text}
  </span>
);

export const Spinner = ({ size = 20, className = "" }) => (
  <Loader2 size={size} className={`animate-spin text-slate-400 ${className}`} />
);

export const EmptyState = ({ text = "Nothing here yet" }) => (
  <div className="flex h-40 items-center justify-center text-sm text-slate-400">{text}</div>
);

export const PageHeader = ({ title, subtitle }) => (
  <div className="mb-5">
    <h1 className="text-[22px] font-bold text-slate-900">{title}</h1>
    {subtitle && <p className="mt-1 text-[13.5px] text-slate-500">{subtitle}</p>}
  </div>
);

export const SearchInput = ({ value, onChange, placeholder = "Search..." }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-[13px] outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
  />
);

export const FilterTabs = ({ options, value, onChange }) => (
  <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition ${
          value === opt.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// A small modal that asks for a reason before an action (block, reject) — Cancel or Confirm.
// requireReason=false lets Confirm fire with an empty reason (used for optional-reason blocks).
export function ReasonModal({ title, confirmLabel, tone = "red", requireReason = true, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={requireReason ? "Reason (required)" : "Reason (optional)"}
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy || (requireReason && !reason.trim())}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
              tone === "red" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {busy && <Spinner size={14} className="text-white" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export const Th = ({ children, className = "" }) => (
  <th className={`whitespace-nowrap pb-2.5 pr-3 text-left text-[11.5px] font-medium text-slate-500 last:pr-0 ${className}`}>
    {children}
  </th>
);

export const Td = ({ children, className = "" }) => (
  <td className={`whitespace-nowrap py-3 pr-3 text-[13px] text-slate-700 last:pr-0 ${className}`}>{children}</td>
);

export const maskMobile = (m) => (m && m.length === 10 ? `${m.slice(0, 2)}XXXX${m.slice(6)}` : m || "—");

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
