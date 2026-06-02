import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/auth";

const departments = ["Design", "Prepress", "Press", "Postpress", "Delivery"];

const roleColors = {
  admin: { background: "#4f7bff22", color: "#4f7bff" },
  press_admin: { background: "#a855f722", color: "#a855f7" },
  staff: { background: "#f3f4f6", color: "#555" },
};

const emptyForm = { fullName: "", email: "", password: "", role: "staff", department: departments[0] };

export default function UserManagementPage() {
  const { isAdmin, orgId } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createMsg, setCreateMsg] = useState("");

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const fetchUsers = async () => {
    const query = supabase
      .from("profiles")
      .select("id, full_name, role, department, organization_id")
      .eq("organization_id", orgId)
      .order("role");

    if (!isAdmin) query.neq("role", "admin");

    const { data, error } = await query;
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [orgId]);

  const createUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateMsg("");

    // Pass all profile fields in metadata so the DB trigger sets them immediately
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: form.role,
          department: form.role === "staff" ? form.department : null,
          organization_id: String(orgId),
        },
      },
    });

    if (error) { setCreateError(error.message); setCreating(false); return; }

    setCreateMsg(`User created. They will receive a confirmation email at ${form.email}.`);
    setForm(emptyForm);
    setCreating(false);
    fetchUsers();
  };

  const updateField = async (userId, patch) => {
    await supabase.from("profiles").update(patch).eq("id", userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>User Management</h2>
        <button className="button" onClick={() => { setShowCreate((v) => !v); setCreateError(""); setCreateMsg(""); }}>
          {showCreate ? "Cancel" : "+ New User"}
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Create New User</h3>
          <form onSubmit={createUser} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 160px" }}>
              Full Name
              <input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} required placeholder="e.g. Ahmad Khalil" />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 190px" }}>
              Email
              <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required placeholder="user@example.com" />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 150px" }}>
              Password
              <input type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} required minLength={6} placeholder="Min 6 characters" />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 130px" }}>
              Role
              <select value={form.role} onChange={(e) => setField("role", e.target.value)}>
                <option value="staff">staff</option>
                <option value="press_admin">press_admin</option>
              </select>
            </label>
            {form.role === "staff" && (
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 140px" }}>
                Department
                <select value={form.department} onChange={(e) => setField("department", e.target.value)}>
                  {departments.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
            )}
            <button type="submit" disabled={creating} style={{ alignSelf: "flex-end" }}>
              {creating ? "Creating…" : "Create User"}
            </button>
          </form>
          {createMsg && <p style={{ marginTop: 10, color: "#22c55e", fontSize: 13 }}>{createMsg}</p>}
          {createError && <p style={{ marginTop: 10, color: "#ef4444", fontSize: 13 }}>{createError}</p>}
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        {loading ? (
          <p style={{ color: "var(--text-muted,#888)" }}>Loading…</p>
        ) : users.length === 0 ? (
          <p style={{ color: "var(--text-muted,#888)" }}>No users found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border,#e5e7eb)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Name</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Role</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Department</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMainAdmin = u.role === "admin";
                const colors = roleColors[u.role] || roleColors.staff;
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border,#f0f0f0)" }}>
                    <td style={{ padding: "10px 12px" }}>
                      {isMainAdmin ? u.full_name || "—" : (
                        <input
                          defaultValue={u.full_name || ""}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== (u.full_name || ""))
                              updateField(u.id, { full_name: e.target.value.trim() });
                          }}
                          style={{ fontSize: 13, width: "100%" }}
                        />
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isMainAdmin ? (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, ...colors }}>
                          admin
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => updateField(u.id, { role: e.target.value })}
                          style={{ fontSize: 13 }}
                          disabled={!isAdmin && u.role === "press_admin"}
                        >
                          <option value="staff">staff</option>
                          <option value="press_admin">press_admin</option>
                          {isAdmin && <option value="admin">admin</option>}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isMainAdmin ? (
                        <span style={{ color: "var(--text-muted,#888)", fontSize: 13 }}>All departments</span>
                      ) : (
                        <select
                          value={u.department || ""}
                          onChange={(e) => updateField(u.id, { department: e.target.value })}
                          style={{ fontSize: 13 }}
                        >
                          <option value="">— Unassigned —</option>
                          {departments.map((d) => <option key={d}>{d}</option>)}
                        </select>
                      )}
                    </td>
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
