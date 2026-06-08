import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/auth";
import { useLang } from "../state/lang";
import { t, stepNames } from "../utils/translations";
import logo from "../assets/logo.svg";

const departments = ["Design", "Prepress", "Press", "Postpress", "Delivery"];

export default function AppLayout() {
  const { signOut, session, profile, canManage } = useAuth();
  const { lang, toggle } = useLang();
  const tr = t[lang];
  const ar = lang === "ar";
  const deptLabel = (d) => ar ? (stepNames.ar[d] || d) : d;
  const userEmail = session?.user?.email || "";

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="PM" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <div>
            <div className="brand-title">PressMan</div>
            <div className="brand-sub">{ar ? "تتبع الطلبات" : "Order Tracker"}</div>
          </div>
        </div>

        <nav className="menu">
          {canManage && (
            <>
              <NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : "")}>
                {tr.nav_orders}
              </NavLink>
              <NavLink to="/customers" className={({ isActive }) => (isActive ? "active" : "")}>
                {tr.nav_customers}
              </NavLink>
              <NavLink to="/users" className={({ isActive }) => (isActive ? "active" : "")}>
                {tr.nav_users}
              </NavLink>
              <div className="menu-section">{tr.nav_departments}</div>
              {departments.map((d) => (
                <NavLink
                  key={d}
                  to={`/departments/${d.toLowerCase()}`}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {deptLabel(d)}
                </NavLink>
              ))}
            </>
          )}

          {!canManage && profile?.department && (
            <NavLink
              to={`/departments/${profile.department.toLowerCase()}`}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {deptLabel(profile.department)}
            </NavLink>
          )}
        </nav>

        <div style={{ marginTop: "auto" }}>
          {canManage && (
            <NavLink
              to="/settings"
              className={({ isActive }) => `settings-link ${isActive ? "active" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              {tr.nav_settings}
            </NavLink>
          )}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border, #e5e7eb)", marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{profile?.full_name || ""}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted, #888)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</div>
            <button
              type="button"
              onClick={toggle}
              style={{
                width: "100%", marginBottom: 6, fontSize: 12, padding: "6px 0",
                borderRadius: 8, border: "1px solid var(--border, #e5e7eb)",
                background: "var(--bg, #f9fafb)", cursor: "pointer",
                fontWeight: 600, color: "var(--text-muted, #666)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              🌐 {lang === "en" ? "العربية" : "English"}
            </button>
            <button type="button" className="button ghost" style={{ width: "100%", fontSize: 12 }} onClick={signOut}>
              {tr.nav_signOut}
            </button>
          </div>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <h1>PressMan</h1>
        </header>
        <main className="content-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
