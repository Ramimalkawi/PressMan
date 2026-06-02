import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/auth";

export default function OrgSetupPage() {
  const { session, reloadProfile, signOut } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setLoading(true);
    setError("");

    // Create org
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .insert({ name: orgName.trim() })
      .select()
      .single();

    if (orgErr) { setError(orgErr.message); setLoading(false); return; }

    // Link admin profile to org
    const { error: profErr } = await supabase
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", session.user.id);

    if (profErr) { setError(profErr.message); setLoading(false); return; }

    // Also create settings and counter rows for this org
    await supabase.from("settings").upsert({
      user_id: session.user.id,
      organization_id: org.id,
      company_name: orgName.trim(),
      press_machines: [],
    });
    await supabase.from("order_counter").upsert({
      user_id: session.user.id,
      organization_id: org.id,
      counter: 0,
    });

    await reloadProfile();
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg, #f3f4f6)" }}>
      <div style={{ background: "var(--bg-card, #fff)", border: "1px solid var(--border, #e5e7eb)", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}>
        <h2 style={{ marginBottom: 4, fontSize: 22, fontWeight: 700 }}>Set Up Your Organization</h2>
        <p style={{ marginBottom: 28, color: "var(--text-muted, #888)", fontSize: 14 }}>
          Enter your print shop name to get started.
        </p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14, fontWeight: 500 }}>
            Print Shop Name
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Al Noor Printing Press"
              required
              autoFocus
            />
          </label>
          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Setting up…" : "Create Organization"}
          </button>
        </form>
        <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--text-muted,#888)" }}>
          <button type="button" className="button ghost" style={{ fontSize: 13 }} onClick={signOut}>Sign Out</button>
        </p>
      </div>
    </div>
  );
}
