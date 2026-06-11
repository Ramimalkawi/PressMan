import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/auth";

const emptyForm = { fullName: "", email: "", password: "", orgId: "" };

export default function AdminPanelPage() {
  const { signOut } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [pressAdmins, setPressAdmins] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // New org form
  const [orgName, setOrgName] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgMsg, setOrgMsg] = useState("");
  const [orgError, setOrgError] = useState("");

  // New press admin form
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [createError, setCreateError] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const fetchOrgs = async () => {
    // Admin bypasses RLS via service role — we need to use a direct query
    // Since admin has no org, we fetch all orgs via a special approach
    const { data } = await supabase.from("organizations").select("*").order("created_at");
    setOrgs(data || []);
    setLoadingOrgs(false);
  };

  const fetchPressAdmins = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, organization_id")
      .eq("role", "press_admin")
      .order("full_name");
    setPressAdmins(data || []);
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchOrgs();
    fetchPressAdmins();
  }, []);

  const createOrg = async (e) => {
    e.preventDefault();
    setCreatingOrg(true);
    setOrgMsg(""); setOrgError("");
    const { data: newId, error } = await supabase.rpc("admin_create_organization", { p_name: orgName.trim() });
    if (error) { setOrgError(error.message); setCreatingOrg(false); return; }
    const newOrg = { id: newId, name: orgName.trim() };
    setOrgs((prev) => [...prev, newOrg]);
    setOrgName("");
    setOrgMsg(`Organization "${newOrg.name}" created.`);
    setCreatingOrg(false);
  };

  const createPressAdmin = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(""); setCreateError("");

    const selectedOrg = orgs.find((o) => String(o.id) === String(form.orgId));

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: "press_admin",
          organization_id: String(form.orgId),
        },
      },
    });

    if (error) { setCreateError(error.message); setCreating(false); return; }

    setCreateMsg(`Press admin created for "${selectedOrg?.name}". They will receive a confirmation email.`);
    setForm(emptyForm);
    setCreating(false);
    fetchPressAdmins();
  };

  const orgName_ = (orgId) => orgs.find((o) => o.id === orgId)?.name || "—";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg,#f3f4f6)", padding: 32 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Pressman Admin Panel</h1>
            <p style={{ color: "var(--text-muted,#888)", fontSize: 13, marginTop: 4 }}>Manage organizations and press admins</p>
          </div>
          <button className="button ghost" onClick={signOut}>Sign Out</button>
        </div>

        {/* Organizations */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Organizations</h2>
          <form onSubmit={createOrg} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="New organization name…"
              required
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={creatingOrg}>
              {creatingOrg ? "Creating…" : "Create Org"}
            </button>
          </form>
          {orgMsg && <p style={{ color: "#22c55e", fontSize: 13, marginBottom: 10 }}>{orgMsg}</p>}
          {orgError && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>{orgError}</p>}

          {loadingOrgs ? <p style={{ color: "var(--text-muted,#888)" }}>Loading…</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border,#e5e7eb)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>#</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Press Admins</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border,#f0f0f0)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted,#888)" }}>{o.id}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{o.name}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {pressAdmins.filter((u) => u.organization_id === o.id).map((u) => u.full_name || u.id).join(", ") || <span style={{ color: "var(--text-muted,#888)" }}>None</span>}
                    </td>
                  </tr>
                ))}
                {orgs.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: "10px 12px", color: "var(--text-muted,#888)" }}>No organizations yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Press Admins */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Press Admins</h2>
            <button className="button" onClick={() => { setShowCreateUser((v) => !v); setCreateMsg(""); setCreateError(""); }}>
              {showCreateUser ? "Cancel" : "+ New Press Admin"}
            </button>
          </div>

          {showCreateUser && (
            <form onSubmit={createPressAdmin} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 20, padding: 16, background: "var(--bg,#f9fafb)", borderRadius: 8 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 150px" }}>
                Full Name
                <input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} required placeholder="e.g. Khalid Omar" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 190px" }}>
                Email
                <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required placeholder="admin@printshop.com" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 150px" }}>
                Password
                <input type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} required minLength={6} placeholder="Min 6 characters" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 160px" }}>
                Organization
                <select value={form.orgId} onChange={(e) => setField("orgId", e.target.value)} required>
                  <option value="">— Select org —</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
              <button type="submit" disabled={creating} style={{ alignSelf: "flex-end" }}>
                {creating ? "Creating…" : "Create"}
              </button>
              {createMsg && <p style={{ width: "100%", color: "#22c55e", fontSize: 13, margin: 0 }}>{createMsg}</p>}
              {createError && <p style={{ width: "100%", color: "#ef4444", fontSize: 13, margin: 0 }}>{createError}</p>}
            </form>
          )}

          {loadingUsers ? <p style={{ color: "var(--text-muted,#888)" }}>Loading…</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border,#e5e7eb)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Organization</th>
                </tr>
              </thead>
              <tbody>
                {pressAdmins.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border,#f0f0f0)" }}>
                    <td style={{ padding: "10px 12px" }}>{u.full_name || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>{orgName_(u.organization_id)}</td>
                  </tr>
                ))}
                {pressAdmins.length === 0 && (
                  <tr><td colSpan={2} style={{ padding: "10px 12px", color: "var(--text-muted,#888)" }}>No press admins yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
