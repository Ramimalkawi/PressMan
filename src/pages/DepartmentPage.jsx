import React, { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useOrders, getStepStatuses } from "../state/orders";
import { useSettings } from "../state/settings";
import { useAuth } from "../state/auth";
import OrderTimeline from "../components/OrderTimeline";
import OrderDetails from "../components/OrderDetails";

export default function DepartmentPage() {
  const { dept } = useParams();
  const { canManage, profile } = useAuth();

  // Staff can only view their own department
  if (!canManage && profile?.department && dept?.toLowerCase() !== profile.department.toLowerCase()) {
    return <Navigate to={`/departments/${profile.department.toLowerCase()}`} replace />;
  }
  const { orders, getOrderSteps } = useOrders();
  const { pressMachines } = useSettings();
  const stepName = dept ? dept.charAt(0).toUpperCase() + dept.slice(1) : "";
  const isPress = stepName.toLowerCase() === "press";

  const visible = orders.filter((o) => {
    const orderSteps = getOrderSteps(o);
    const statuses = getStepStatuses(o, orderSteps);
    return orderSteps.some((s, i) => s.toLowerCase() === stepName.toLowerCase() && statuses[i] === "active");
  });

  const [expandedId, setExpandedId] = useState(null);
  const [machineFilter, setMachineFilter] = useState(null); // null = all

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const filteredOrders = isPress && machineFilter
    ? visible.filter((o) => o.pressMachine === machineFilter)
    : visible;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{stepName} Department</h2>
          <p>Orders currently in this department.</p>
        </div>
      </div>

      {isPress && pressMachines.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <button
            className={`button small ${machineFilter === null ? "" : "ghost"}`}
            onClick={() => { setMachineFilter(null); setExpandedId(null); }}
          >
            All Machines
          </button>
          {pressMachines.map((m) => {
            const count = visible.filter((o) => o.pressMachine === m.name).length;
            return (
              <button
                key={m.id}
                className={`button small ${machineFilter === m.name ? "" : "ghost"}`}
                onClick={() => { setMachineFilter(m.name); setExpandedId(null); }}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  <path d="M6 8h.01M6 12h.01"/>
                </svg>
                {m.name}
                {count > 0 && (
                  <span style={{
                    background: machineFilter === m.name ? "rgba(255,255,255,0.3)" : "var(--accent)",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <section className="panel">
        {filteredOrders.length === 0 && (
          <p>No orders {machineFilter ? `on ${machineFilter}` : `in ${stepName}`}.</p>
        )}
        {filteredOrders.map((o) => (
          <div key={o.id} style={{ cursor: "pointer", marginBottom: 4 }}>
            <div className="order-link" onClick={() => toggle(o.id)}>
              <OrderTimeline order={o} />
            </div>
            {expandedId === o.id && (
              <div style={{ marginTop: 4, marginBottom: 12 }}>
                <OrderDetails order={o} />
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
