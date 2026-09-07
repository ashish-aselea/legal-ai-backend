import { useEffect, useState, useCallback } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import {
  Avatar, Badge, Spinner, EmptyState, PageHeader, SearchInput, FilterTabs,
  ReasonModal, Th, Td, maskMobile, formatDate,
} from "../components/ui/Shared";

const ROLE_TABS = [
  { value: "", label: "All" },
  { value: "user", label: "Users" },
  { value: "lawyer", label: "Lawyers" },
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [blockTarget, setBlockTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listUsers({ role: role || undefined, search: search || undefined })
      .then((r) => setUsers(r.data.users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [role, search]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  const unblock = async (u) => {
    try {
      await api.unblockUser(u.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const confirmBlock = async (reason) => {
    try {
      await api.blockUser(blockTarget.id, reason);
      setBlockTarget(null);
      load();
    } catch (e) {
      setError(e.message);
      setBlockTarget(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
      <PageHeader title="Users" subtitle="Everyone with an account — users and lawyers." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs options={ROLE_TABS} value={role} onChange={setRole} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, mobile, email..." />
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
        ) : users.length === 0 ? (
          <EmptyState text="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Name</Th>
                  <Th>Mobile</Th>
                  <Th>Role</Th>
                  <Th>City</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0">
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={u.name} i={i} />
                        <span className="font-medium text-slate-800">{u.name || "—"}</span>
                      </span>
                    </Td>
                    <Td className="text-slate-500">{maskMobile(u.mobile)}</Td>
                    <Td>
                      <Badge text={u.role === "lawyer" ? "Lawyer" : u.role === "admin" ? "Admin" : "User"} tone={u.role === "lawyer" ? "green" : u.role === "admin" ? "blue" : "slate"} />
                    </Td>
                    <Td className="text-slate-500">{u.city || "—"}</Td>
                    <Td>
                      {u.isBlocked ? (
                        <span title={u.blockedReason || ""}>
                          <Badge text="Blocked" tone="red" />
                        </span>
                      ) : (
                        <Badge text="Active" tone="green" />
                      )}
                    </Td>
                    <Td className="text-slate-500">{formatDate(u.createdAt)}</Td>
                    <Td className="text-right">
                      {u.role === "admin" ? (
                        <span className="text-[12px] text-slate-300">—</span>
                      ) : u.isBlocked ? (
                        <button
                          onClick={() => unblock(u)}
                          className="inline-flex items-center gap-1 rounded-md border border-green-200 px-2.5 py-1 text-[12px] font-medium text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 size={13} /> Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => setBlockTarget(u)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-[12px] font-medium text-red-600 hover:bg-red-50"
                        >
                          <Ban size={13} /> Block
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {blockTarget && (
        <ReasonModal
          title={`Block ${blockTarget.name || "this user"}?`}
          confirmLabel="Block User"
          tone="red"
          requireReason={false}
          onCancel={() => setBlockTarget(null)}
          onConfirm={confirmBlock}
        />
      )}
    </div>
  );
}
