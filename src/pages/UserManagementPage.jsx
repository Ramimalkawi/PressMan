import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/auth";

const departments = ["Design", "Prepress", "Press", "Postpress", "Delivery"];

const roleConfig = {
  admin:       { label: "Admin",        bg: "#ede9fe", color: "#7c3aed" },
  press_admin: { label: "Press Admin",  bg: "#dbeafe", color: "#1d4ed8" },
  staff:       { label: "Staff",        bg: "#f1f5f9", color: "#475569" },
};

const emptyForm = { fullName: "", email: "", password: "", role: "staff", department: departments[0] };

function Avatar({ name }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#4f7bff", "#a855f7", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];
  const color = colors[(name || "").charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: `${color}22`, color, fontWeight: 700,
      fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, border: `1.5px solid ${color}44`,
    }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  const cfg = roleConfig[role] || roleConfig.staff;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      background: cfg.bg, color: cfg.color, whiteSpace: "nowrap",
      letterSpacing: 0.3, textTransform: "uppercase",
    }}>
      {cfg.label}
    </span>
  );
}

export default function UserManagementPage() {
  const { isAdmin, orgId } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createMsg, setCreateMsg] = useState("");

  const [pwUserId, setPwUserId] = useState(null);
  const [pwValue, setPwValue] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
    setCreateMsg(`User "${form.fullName}" created successfully.`);
    setForm(emptyForm);
    setCreating(false);
    fetchUsers();
  };

  const updateField = async (userId, patch) => {
    await supabase.from("profiles").update(patch).eq("id", userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)));
  };

  const changePassword = async (userId) => {
    if (!pwValue || pwValue.length < 6) { setPwError("Minimum 6 characters."); return; }
    setPwLoading(true);
    setPwError("");
    const { error } = await supabase.rpc("admin_update_password", { p_user_id: userId, p_password: pwValue });
    if (error) { setPwError(error.message); setPwLoading(false); return; }
    setPwUserId(null);
    setPwValue("");
    setPwLoading(false);
  };

  const deleteUser = async (userId) => {
    setDeleteLoading(true);
    setDeleteError("");
    const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
    if (error) { setDeleteError(error.message); setDeleteLoading(false); return; }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setDeleteUserId(null);
    setDeleteLoading(false);
  };

  const staffCount = users.filter((u) => u.role === "staff").length;
  const adminCount = users.filter((u) => u.role === "press_admin").length;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "var(--text, #1a1a2e)" }}>Team Members</h2>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-muted, #888)" }}>
            {users.length} user{users.length !== 1 ? "s" : ""} · {adminCount} press admin{adminCount !== 1 ? "s" : ""} · {staffCount} staff
          </p>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); setCreateError(""); setCreateMsg(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 10, border: "none",
            background: showCreate ? "#f1f5f9" : "linear-gradient(135deg, #4f7bff, #a855f7)",
            color: showCreate ? "#475569" : "#fff",
            fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}
        >
          {showCreate ? "✕ Cancel" : "+ New User"}
        </button>
      </div>

      {/* Create user form */}
      {showCreate && (
        <div style={{
          background: "#fff", border: "1px solid var(--border, #e5e7eb)",
          borderRadius: 16, padding: 28, marginBottom: 24,
          boxShadow: "0 2px 12px rgba(0,0,0,.06)",
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, marginTop: 0, color: "var(--text, #1a1a2e)" }}>
            Create New User
          </h3>
          <form onSubmit={createUser} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
            <label style={labelStyle}>
              Full Name
              <input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} required placeholder="e.g. Ahmad Khalil" style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Email
              <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required placeholder="user@example.com" style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Password
              <input type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} required minLength={6} placeholder="Min 6 characters" style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Role
              <select value={form.role} onChange={(e) => setField("role", e.target.value)} style={inputStyle}>
                <option value="staff">Staff</option>
                <option value="press_admin">Press Admin</option>
              </select>
            </label>
            {form.role === "staff" && (
              <label style={labelStyle}>
                Department
                <select value={form.department} onChange={(e) => setField("department", e.target.value)} style={inputStyle}>
                  {departments.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
            )}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="submit" disabled={creating} style={{
                width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #4f7bff, #a855f7)",
                color: "#fff", fontWeight: 700, fontSize: 14, cursor: creating ? "not-allowed" : "pointer",
                opacity: creating ? 0.7 : 1,
              }}>
                {creating ? "Creating…" : "Create User"}
              </button>
            </div>
          </form>
          {createMsg && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#166534", fontSize: 13 }}>
              ✓ {createMsg}
            </div>
          )}
          {createError && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
              {createError}
            </div>
          )}
        </div>
      )}

      {/* Users grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted, #888)" }}>Loading…</div>
      ) : users.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted, #888)" }}>No users found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {users.map((u) => {
            const isMainAdmin = u.role === "admin";
            const isChangingPw = pwUserId === u.id;
            const isConfirmingDelete = deleteUserId === u.id;
            return (
              <div key={u.id} style={{
                background: "#fff",
                border: "1px solid var(--border, #e5e7eb)",
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                {/* User info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={u.full_name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isMainAdmin ? (
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{u.full_name || "—"}</div>
                    ) : (
                      <input
                        defaultValue={u.full_name || ""}
                        onBlur={(e) => {
                          if (e.target.value.trim() !== (u.full_name || ""))
                            updateField(u.id, { full_name: e.target.value.trim() });
                        }}
                        style={{ fontWeight: 700, fontSize: 15, border: "none", outline: "none", background: "transparent", width: "100%", color: "var(--text, #1a1a2e)" }}
                      />
                    )}
                    <RoleBadge role={u.role} />
                  </div>
                </div>

                {/* Role & Department selectors */}
                {!isMainAdmin && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={miniLabel}>Role</div>
                      <select
                        value={u.role}
                        onChange={(e) => updateField(u.id, { role: e.target.value })}
                        style={miniSelect}
                        disabled={!isAdmin && u.role === "press_admin"}
                      >
                        <option value="staff">Staff</option>
                        <option value="press_admin">Press Admin</option>
                        {isAdmin && <option value="admin">Admin</option>}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={miniLabel}>Department</div>
                      <select
                        value={u.department || ""}
                        onChange={(e) => updateField(u.id, { department: e.target.value })}
                        style={miniSelect}
                      >
                        <option value="">— Unassigned —</option>
                        {departments.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {isMainAdmin && (
                  <div style={{ fontSize: 13, color: "var(--text-muted, #888)" }}>All departments</div>
                )}

                {/* Actions */}
                {!isMainAdmin && (
                  <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border, #f0f0f0)", paddingTop: 12 }}>
                    <button
                      onClick={() => { setPwUserId(isChangingPw ? null : u.id); setPwValue(""); setPwError(""); setDeleteUserId(null); }}
                      style={{ ...actionBtn, color: "#1d4ed8", background: "#eff6ff", borderColor: "#bfdbfe" }}
                    >
                      🔑 Change Password
                    </button>
                    <button
                      onClick={() => { setDeleteUserId(isConfirmingDelete ? null : u.id); setDeleteError(""); setPwUserId(null); }}
                      style={{ ...actionBtn, color: "#dc2626", background: "#fef2f2", borderColor: "#fecaca" }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}

                {/* Password change panel */}
                {isChangingPw && (
                  <div style={{ background: "#f8faff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#1d4ed8" }}>
                      Set new password
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input
                        type="password"
                        value={pwValue}
                        onChange={(e) => setPwValue(e.target.value)}
                        placeholder="Min 6 characters"
                        minLength={6}
                        style={{ ...inputStyle, flex: 1, minWidth: 140 }}
                      />
                      <button onClick={() => changePassword(u.id)} disabled={pwLoading} style={saveBtn}>
                        {pwLoading ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => { setPwUserId(null); setPwValue(""); setPwError(""); }} style={cancelBtn}>
                        Cancel
                      </button>
                    </div>
                    {pwError && <div style={{ marginTop: 8, fontSize: 12, color: "#dc2626" }}>{pwError}</div>}
                  </div>
                )}

                {/* Delete confirm panel */}
                {isConfirmingDelete && (
                  <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#dc2626" }}>
                      Delete {u.full_name}? This cannot be undone.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => deleteUser(u.id)} disabled={deleteLoading} style={{ ...saveBtn, background: "#dc2626" }}>
                        {deleteLoading ? "Deleting…" : "Yes, Delete"}
                      </button>
                      <button onClick={() => { setDeleteUserId(null); setDeleteError(""); }} style={cancelBtn}>
                        Cancel
                      </button>
                    </div>
                    {deleteError && <div style={{ marginTop: 8, fontSize: 12, color: "#dc2626" }}>{deleteError}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "flex", flexDirection: "column", gap: 5, fontSize: 13, fontWeight: 600, color: "var(--text, #374151)" };
const inputStyle = { padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border, #d1d5db)", fontSize: 13, background: "#fff", color: "var(--text, #1a1a2e)" };
const miniLabel = { fontSize: 11, fontWeight: 600, color: "var(--text-muted, #888)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 };
const miniSelect = { width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", fontSize: 13, background: "#f9fafb" };
const actionBtn = { flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const saveBtn = { padding: "8px 16px", borderRadius: 8, border: "none", background: "#4f7bff", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const cancelBtn = { padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", background: "#fff", color: "var(--text, #555)", fontWeight: 600, fontSize: 13, cursor: "pointer" };
