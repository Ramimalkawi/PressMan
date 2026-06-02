import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./state/auth";
import { OrdersProvider } from "./state/orders";
import { SettingsProvider } from "./state/settings";
import { CustomersProvider } from "./state/customers";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import OrgSetupPage from "./pages/OrgSetupPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import OrdersPage from "./pages/OrdersPage";
import NewOrderPage from "./pages/NewOrderPage";
import CustomersPage from "./pages/CustomersPage";
import DepartmentPage from "./pages/DepartmentPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import CustomerDetailsPage from "./pages/CustomerDetailsPage";
import SettingsPage from "./pages/SettingsPage";
import UserManagementPage from "./pages/UserManagementPage";

function ProtectedApp() {
  const { session, profile, isAdmin, isPressAdmin, canManage, orgId, signOut } = useAuth();

  // Still loading
  if (session === undefined || (session && !profile)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading…
      </div>
    );
  }

  if (!session) return <LoginPage />;

  // Main admin — dedicated panel, no org needed
  if (isAdmin) return <AdminPanelPage />;

  // Press admin with no org yet — set up org
  if (isPressAdmin && !orgId) return <OrgSetupPage />;

  // Staff with no org yet
  if (!canManage && !orgId) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <p>Your account is not yet linked to an organization. Please contact your administrator.</p>
        <button className="button ghost" onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  // Staff — department view only
  if (!canManage) {
    const dept = profile?.department?.toLowerCase() || "";
    return (
      <SettingsProvider>
        <OrdersProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="*" element={<Navigate to={`/departments/${dept}`} replace />} />
                <Route path="/departments/:dept" element={<DepartmentPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </OrdersProvider>
      </SettingsProvider>
    );
  }

  // Press admin — full app
  return (
    <SettingsProvider>
      <CustomersProvider>
        <OrdersProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/orders" replace />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/new" element={<NewOrderPage />} />
                <Route path="/orders/:id" element={<OrderDetailsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailsPage />} />
                <Route path="/departments/:dept" element={<DepartmentPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/users" element={<UserManagementPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </OrdersProvider>
      </CustomersProvider>
    </SettingsProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}
