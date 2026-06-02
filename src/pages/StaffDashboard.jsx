import React, { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../state/auth";
import { useOrders } from "../state/orders";
import { formatDateDMY } from "../utils/date";

export default function StaffDashboard() {
  const { dept } = useParams();
  const { profile, signOut } = useAuth();
  const { orders, advanceStep, getOrderSteps } = useOrders();
  const department = profile?.department;

  // Redirect if they try to access another department's URL
  if (dept && department && dept.toLowerCase() !== department.toLowerCase()) {
    return <Navigate to={`/departments/${department.toLowerCase()}`} replace />;
  }

  const [notes, setNotes] = useState({});
  const [completing, setCompleting] = useState(null);

  // Orders currently sitting in this staff member's department
  const myOrders = orders.filter((order) => {
    const steps = getOrderSteps(order);
    const currentStepName = steps[order.currentStep];
    return currentStepName === department;
  });

  const handleComplete = async (orderId) => {
    await advanceStep(orderId, notes[orderId] || "", "");
    setCompleting(null);
    setNotes((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
  };

  if (!department) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <h2>No Department Assigned</h2>
        <p style={{ color: "var(--text-muted, #888)", marginTop: 8 }}>
          Your account has not been assigned to a department yet. Please contact your administrator.
        </p>
        <button className="button ghost" style={{ marginTop: 16 }} onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{department} Department</h2>
        <p style={{ color: "var(--text-muted, #888)", fontSize: 14, marginTop: 4 }}>
          {myOrders.length} order{myOrders.length !== 1 ? "s" : ""} currently in your department
        </p>
      </div>

      {myOrders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted, #888)" }}>
          No orders in your department right now.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {myOrders.map((order) => {
            const steps = getOrderSteps(order);
            const nextStep = steps[order.currentStep + 1];
            const isCompleting = completing === order.id;

            return (
              <div key={order.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>#{order.orderNumber} — {order.jobName}</span>
                      {order.urgent && order.urgent !== "No" && (
                        <span style={{ background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>URGENT</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted, #888)" }}>
                      {order.customerName}{order.companyName ? ` · ${order.companyName}` : ""}
                    </div>
                    {order.productType && (
                      <div style={{ fontSize: 13, color: "var(--text-muted, #888)", marginTop: 2 }}>{order.productType} · Qty: {order.quantity}</div>
                    )}
                    {order.deliveryDate && (
                      <div style={{ fontSize: 13, color: "var(--text-muted, #888)", marginTop: 2 }}>
                        Delivery: {formatDateDMY(order.deliveryDate)}
                      </div>
                    )}
                    {order.printSpecs && (
                      <div style={{ fontSize: 13, marginTop: 8, padding: "8px 12px", background: "var(--bg, #f3f4f6)", borderRadius: 6, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                        {order.printSpecs}
                      </div>
                    )}
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {!isCompleting ? (
                      <button
                        className="button"
                        onClick={() => setCompleting(order.id)}
                      >
                        Mark as Done → {nextStep}
                      </button>
                    ) : (
                      <button
                        className="button ghost"
                        onClick={() => setCompleting(null)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {isCompleting && (
                  <div style={{ marginTop: 16, borderTop: "1px solid var(--border, #e5e7eb)", paddingTop: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500 }}>
                      Notes (optional)
                      <textarea
                        value={notes[order.id] || ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [order.id]: e.target.value }))}
                        placeholder="Add any notes before passing to the next department…"
                        rows={3}
                        style={{ width: "100%", marginTop: 6, resize: "vertical" }}
                      />
                    </label>
                    <button
                      className="button"
                      style={{ marginTop: 10 }}
                      onClick={() => handleComplete(order.id)}
                    >
                      Confirm — Send to {nextStep}
                    </button>
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
