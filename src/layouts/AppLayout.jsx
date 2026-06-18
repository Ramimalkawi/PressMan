import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/auth";
import { useLang } from "../state/lang";
import { t, stepNames } from "../utils/translations";
import logo from "../assets/logo.svg";

const departments = ["Design", "Prepress", "Press", "Postpress", "Delivery"];

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV_ICONS = {
  orders:      "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  customers:   "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 4a3 3 0 0 1 0 6",
  users:       "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  design:      "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  prepress:    "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  press:       "M6 4v16M18 4v16M4 8h4m8 0h4M4 16h4m8 0h4M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  postpress:   "M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5zm2.5 3.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v4c0 2.21-1.79 4-4 4h-5c-1.66 0-3.14-.91-3.87-2.26l-3.07-5.3A1.5 1.5 0 0 1 5.46 12c.7-.35 1.57-.12 1.99.55L9 14.5V3.5c0-.83.67-1.5 1.5-1.5S12 2.67 12 3.5v5.5",
  delivery:    "M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3M9 17h6m4 0h2M17 11l4 6m-4 0 4-6M13 17a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  settings:    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
};

function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      <span className="nav-icon">
        <Icon d={icon} size={16} />
      </span>
      <span className="nav-label">{label}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  const { signOut, session, profile, canManage } = useAuth();
  const { lang, toggle } = useLang();
  const tr = t[lang];
  const ar = lang === "ar";
  const deptLabel = (d) => ar ? (stepNames.ar[d] || d) : d;
  const userEmail = session?.user?.email || "";
  const userName = profile?.full_name || userEmail.split("@")[0] || "";
  const userInitials = userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const close = () => setSidebarOpen(false);

  const deptIcon = (d) => NAV_ICONS[d.toLowerCase()] || NAV_ICONS.press;

  return (
    <div className="shell">
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={close} />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} dir="ltr">

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src={logo} alt="PM" style={{ width: 28, height: 28, objectFit: "contain" }} />
          </div>
          <div>
            <div className="sidebar-brand-name">PressMan</div>
            <div className="sidebar-brand-sub">{ar ? "تتبع الطلبات" : "Order Tracker"}</div>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Main nav */}
        <nav className="sidebar-nav">
          {canManage && (
            <>
              <div className="nav-section-label">{ar ? "الرئيسية" : "Main"}</div>
              <NavItem to="/orders"    icon={NAV_ICONS.orders}    label={tr.nav_orders}    onClick={close} />
              <NavItem to="/customers" icon={NAV_ICONS.customers} label={tr.nav_customers} onClick={close} />
              <NavItem to="/users"     icon={NAV_ICONS.users}     label={tr.nav_users}     onClick={close} />

              <div className="nav-section-label" style={{ marginTop: 12 }}>{tr.nav_departments}</div>
              {departments.map((d) => (
                <NavItem
                  key={d}
                  to={`/departments/${d.toLowerCase()}`}
                  icon={deptIcon(d)}
                  label={deptLabel(d)}
                  onClick={close}
                />
              ))}
            </>
          )}

          {!canManage && profile?.department && (
            <NavItem
              to={`/departments/${profile.department.toLowerCase()}`}
              icon={deptIcon(profile.department)}
              label={deptLabel(profile.department)}
              onClick={close}
            />
          )}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-footer">
          {canManage && (
            <NavItem to="/settings" icon={NAV_ICONS.settings} label={tr.nav_settings} onClick={close} />
          )}

          <div className="sidebar-divider" style={{ margin: "10px 0" }} />

          {/* User chip */}
          <div className="sidebar-user">
            <div className="sidebar-avatar">{userInitials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-email">{userEmail}</div>
            </div>
          </div>

          {/* Actions row */}
          <div className="sidebar-actions">
            <button type="button" className="sidebar-action-btn" onClick={toggle} title={lang === "en" ? "العربية" : "English"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {lang === "en" ? "عربي" : "EN"}
            </button>
            <button type="button" className="sidebar-action-btn sidebar-signout" onClick={signOut}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              {tr.nav_signOut}
            </button>
          </div>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1>PressMan</h1>
        </header>
        <main className="content-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
