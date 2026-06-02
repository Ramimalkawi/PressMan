import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useOrders, getStepStatuses } from "../state/orders";
import { useSettings } from "../state/settings";
import { useJobImages } from "../state/jobImages";
import { useAuth } from "../state/auth";
import { formatDateDMY, formatDateTimeDMY } from "../utils/date";
import { printOrder } from "../utils/printOrder";
import { printDeliveryNote } from "../utils/printDeliveryNote";
import OrderForm from "./OrderForm";

export default function OrderDetails({ order }) {
  const { canManage } = useAuth();
  const { activateNextStep, completeStep, logDelivery, getOrderSteps, orders } = useOrders();
  const { pressMachines, companyName, companyLogo } = useSettings();
  const { getJobImage, setJobImage, removeJobImage } = useJobImages();
  const steps = getOrderSteps(order);
  const statuses = getStepStatuses(order, steps);
  const activeIndices = steps.map((_, i) => i).filter((i) => statuses[i] === "active");
  const furthestActiveIdx = activeIndices.length > 0 ? Math.max(...activeIndices) : -1;
  const canPassToNext = furthestActiveIdx >= 0 && furthestActiveIdx < steps.length - 1 && steps[furthestActiveIdx + 1] !== "Completed" && steps[furthestActiveIdx] !== "Received";
  const nextStepName = canPassToNext ? steps[furthestActiveIdx + 1] : "";
  const isEnteringPress = nextStepName === "Press";

  const [editing, setEditing] = useState(false);
  // "pass" prompt — for activateNextStep
  const [showPassPrompt, setShowPassPrompt] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState("");
  // "complete" prompt — for completeStep
  const [completeIdx, setCompleteIdx] = useState(null);
  const [completeNotes, setCompleteNotes] = useState("");

  const fileInputRef = useRef(null);
  const [jobImage, setJobImageUrl] = useState(null);
  useEffect(() => { getJobImage(order.id).then(setJobImageUrl); }, [order.id]);
  const hasDesignActive = activeIndices.some((i) => steps[i] === "Design");

  // Delivery step
  const deliveryStepIdx = steps.indexOf("Delivery");
  const deliveryIsActive = deliveryStepIdx >= 0 && statuses[deliveryStepIdx] === "active";
  const deliveries = order.deliveries || [];
  const totalDelivered = deliveries.reduce((s, d) => s + (d.quantityDelivered || 0), 0);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ quantityDelivered: "", boxes: "", invoiceNumber: "", notes: "" });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const setDF = (k, v) => setDeliveryForm((p) => ({ ...p, [k]: v }));

  const handleLogDelivery = async (e) => {
    e.preventDefault();
    setSubmittingDelivery(true);
    await logDelivery(order.id, deliveryForm);
    setDeliveryForm({ quantityDelivered: "", boxes: "", invoiceNumber: "", notes: "" });
    setShowDeliveryForm(false);
    setSubmittingDelivery(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJobImage(order.id, ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePass = () => {
    if (!canPassToNext) return;
    if (isEnteringPress && pressMachines.length > 0 && !selectedMachine) return;
    activateNextStep(order.id, furthestActiveIdx, isEnteringPress ? selectedMachine : undefined);
    setSelectedMachine("");
    setShowPassPrompt(false);
  };

  const handleComplete = () => {
    if (completeIdx === null) return;
    completeStep(order.id, completeIdx, completeNotes);
    setCompleteNotes("");
    setCompleteIdx(null);
  };

  if (editing) {
    return (
      <div className="order-details">
        <OrderForm
          order={order}
          onCreated={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="order-details">
      <div className="detail-head">
        <div>
          <h3>
            {order.orderNumber ? `#${order.orderNumber} — ` : ""}
            {order.jobName} — {order.customerName}
          </h3>
          <div className="detail-meta">
            Quantity: {order.quantity} • Product: {order.productType || "N/A"}
          </div>
          {order.printSpecs && (
            <div className="detail-meta">{order.printSpecs}</div>
          )}
          {order.pressMachine && (
            <div className="detail-meta">
              Press Machine: {order.pressMachine}
            </div>
          )}
          {order.linkedOrderId &&
            (() => {
              const linked = orders.find(
                (o) => String(o.id) === String(order.linkedOrderId),
              );
              return linked ? (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    background: "var(--bg-muted, #f0f4ff)",
                    border: "1px solid var(--accent-light, #c7d7ff)",
                    borderLeft: "3px solid var(--accent, #4f7bff)",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 16 }}>🔗</span>
                  <span
                    style={{ color: "var(--text-muted, #666)", fontSize: 13 }}
                  >
                    {order.linkedReason
                      ? order.linkedReason + " of"
                      : "Linked to"}
                  </span>
                  <Link
                    to={`/orders/${linked.id}`}
                    style={{
                      color: "var(--accent, #4f7bff)",
                      fontWeight: 600,
                      textDecoration: "none",
                      fontSize: 14,
                    }}
                  >
                    #{linked.orderNumber} — {linked.jobName}
                  </Link>
                  {linked.history?.[0]?.ts && (
                    <span
                      style={{
                        color: "var(--text-muted, #888)",
                        fontSize: 12,
                        marginLeft: "auto",
                      }}
                    >
                      Ordered {formatDateDMY(linked.history[0].ts)}
                    </span>
                  )}
                </div>
              ) : null;
            })()}
        </div>
        <div className="detail-pill">
          {activeIndices.length > 0
            ? activeIndices.map((i) => steps[i]).join(" · ")
            : steps[steps.length - 1]}
        </div>
      </div>

      {/* Job Image */}
      <div style={{ marginBottom: 16 }}>
        {jobImage ? (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <img
              src={jobImage}
              alt="Job artwork"
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
                borderRadius: 10,
                border: "1px solid var(--border)",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                paddingTop: 4,
              }}
            >
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                Job Artwork
              </span>
              <button
                className="button small ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace Image
              </button>
              <button
                className="button small ghost"
                style={{ color: "#dc2626" }}
                onClick={() => removeJobImage(order.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          hasDesignActive && (
            <button
              className="button small ghost"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Upload Job Artwork
            </button>
          )
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageUpload}
        />
      </div>

      <div className="detail-grid">
        <section className="detail-card">
          <h4>Customer Information</h4>
          <div className="detail-row">
            <span>Customer Name</span>
            <strong>{order.customerName || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Company Name</span>
            <strong>{order.companyName || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Contact Person</span>
            <strong>{order.contactPerson || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Phone</span>
            <strong>{order.phone || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Email</span>
            <strong>{order.email || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Address</span>
            <strong>{order.address || "—"}</strong>
          </div>
        </section>

        <section className="detail-card">
          <h4>Job Details</h4>
          <div className="detail-row">
            <span>Job Name / Project Title</span>
            <strong>{order.jobName || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Print Product Type</span>
            <strong>{order.productType || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Quantity</span>
            <strong>{order.quantity || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Number of Versions</span>
            <strong>{order.versions || "—"}</strong>
          </div>
        </section>

        <section className="detail-card">
          <h4>Print Specifications</h4>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {order.printSpecs || "—"}
          </p>
        </section>

        <section className="detail-card">
          <h4>Finishing Options</h4>
          <div className="detail-row">
            <span>Lamination</span>
            <strong>{order.lamination || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Spot UV</span>
            <strong>{order.spotUV ? "Yes" : "No"}</strong>
          </div>
          <div className="detail-row">
            <span>Emboss</span>
            <strong>{order.emboss ? "Yes" : "No"}</strong>
          </div>
          <div className="detail-row">
            <span>Foil Stamping</span>
            <strong>{order.foilStamping ? "Yes" : "No"}</strong>
          </div>
          <div className="detail-row">
            <span>Die Cutting</span>
            <strong>{order.dieCutting ? "Yes" : "No"}</strong>
          </div>
          <div className="detail-row">
            <span>Folding</span>
            <strong>{order.folding ? "Yes" : "No"}</strong>
          </div>
          <div className="detail-row">
            <span>Binding</span>
            <strong>{order.binding || "—"}</strong>
          </div>
        </section>

        <section className="detail-card">
          <h4>Delivery & Deadline</h4>
          <div className="detail-row">
            <span>Required Delivery Date</span>
            <strong>{formatDateDMY(order.deliveryDate)}</strong>
          </div>
          <div className="detail-row">
            <span>Delivery Method</span>
            <strong>{order.deliveryMethod || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Urgent Job</span>
            <strong>{order.urgent || "No"}</strong>
          </div>
        </section>

        <section className="detail-card">
          <h4>Approval</h4>
          <div className="detail-row">
            <span>Customer Signature</span>
            <strong>{order.customerSignature || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Date</span>
            <strong>{formatDateDMY(order.signatureDate)}</strong>
          </div>
          <div className="detail-row">
            <span>Company Representative</span>
            <strong>{order.companyRepresentative || "—"}</strong>
          </div>
        </section>
      </div>

      <ol className="steps">
        {steps.map((s, idx) => (
          <li
            key={s}
            className={
              statuses[idx] === "completed"
                ? "done"
                : statuses[idx] === "active"
                  ? "active"
                  : ""
            }
          >
            <span className="step-name">{s}</span>
            {statuses[idx] === "active" && idx !== steps.length - 1 && (
              <span className="badge">In Progress</span>
            )}
          </li>
        ))}
      </ol>

      <div className="history">
        <h4>History</h4>
        <ul>
          {(order.history || []).map((h, i) => (
            <li key={i} style={{ marginBottom: h.notes ? 10 : 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h.action === "delivery_logged" ? `${steps[h.step]} ↓` : steps[h.step]}
                </span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>
                  {formatDateTimeDMY(h.ts)}
                </span>
              </div>
              {(h.notes || h.pressMachine || h.action === "delivery_logged") && (
                <div
                  style={{
                    marginTop: 4,
                    marginLeft: 4,
                    paddingLeft: 10,
                    borderLeft: "2px solid var(--border)",
                    fontSize: 13,
                    color: "var(--text)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {h.action === "delivery_logged" && (
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      Qty: <strong>{h.quantityDelivered}</strong>
                      {h.boxes ? ` · ${h.boxes} boxes` : ""}
                      {h.invoiceNumber ? ` · Invoice #${h.invoiceNumber}` : ""}
                    </span>
                  )}
                  {h.pressMachine && (
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      🖨 {h.pressMachine}
                    </span>
                  )}
                  {h.notes && <span>{h.notes}</span>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Delivery log panel */}
      {deliveryIsActive && (
        <div className="detail-card" style={{ marginTop: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>Deliveries</h4>
            <div style={{ fontSize: 13, color: "var(--text-muted,#888)" }}>
              Delivered: <strong>{totalDelivered}</strong> / {order.quantity}
            </div>
          </div>

          {deliveries.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border,#e5e7eb)" }}>
                  <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>Date</th>
                  <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: 600 }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: 600 }}>Boxes</th>
                  <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>Invoice #</th>
                  <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>Notes</th>
                  <th style={{ padding: "4px 8px" }} />
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--border,#f0f0f0)" }}>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{formatDateTimeDMY(d.ts)}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600 }}>{d.quantityDelivered}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right" }}>{d.boxes ?? "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{d.invoiceNumber || "—"}</td>
                    <td style={{ padding: "6px 8px", color: "var(--text-muted,#888)" }}>{d.notes || "—"}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <button
                        className="button small ghost"
                        onClick={() => printDeliveryNote({ order, delivery: d, companyName, companyLogo })}
                      >
                        🖨 Note
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {showDeliveryForm ? (
            <form onSubmit={handleLogDelivery} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", paddingTop: 8, borderTop: "1px solid var(--border,#e5e7eb)" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 120px" }}>
                Qty Delivered *
                <input
                  type="number"
                  min="1"
                  value={deliveryForm.quantityDelivered}
                  onChange={(e) => setDF("quantityDelivered", e.target.value)}
                  required
                  placeholder="e.g. 500"
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 100px" }}>
                No. of Boxes
                <input
                  type="number"
                  min="1"
                  value={deliveryForm.boxes}
                  onChange={(e) => setDF("boxes", e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 140px" }}>
                Invoice Number
                <input
                  value={deliveryForm.invoiceNumber}
                  onChange={(e) => setDF("invoiceNumber", e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "2 1 200px" }}>
                Notes
                <input
                  value={deliveryForm.notes}
                  onChange={(e) => setDF("notes", e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <div style={{ display: "flex", gap: 8, alignSelf: "flex-end" }}>
                <button type="submit" disabled={submittingDelivery}>
                  {submittingDelivery ? "Saving…" : "Log Delivery"}
                </button>
                <button type="button" className="button ghost" onClick={() => setShowDeliveryForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button className="button ghost" onClick={() => setShowDeliveryForm(true)}>
              + Log Delivery
            </button>
          )}
        </div>
      )}

      {/* Pass to next department prompt */}
      {showPassPrompt && canPassToNext && (
        <div className="detail-card" style={{ marginTop: 12, padding: 14 }}>
          <h4 style={{ margin: "0 0 8px" }}>
            Pass to: {nextStepName}
          </h4>
          {isEnteringPress && pressMachines.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                Assign Press Machine *
              </label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 14 }}
              >
                <option value="">Select a machine…</option>
                {pressMachines.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={handlePass} disabled={isEnteringPress && pressMachines.length > 0 && !selectedMachine}>
              Confirm
            </button>
            <button className="button ghost" onClick={() => { setShowPassPrompt(false); setSelectedMachine(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Complete step prompt */}
      {completeIdx !== null && (
        <div className="detail-card" style={{ marginTop: 12, padding: 14 }}>
          <h4 style={{ margin: "0 0 8px" }}>
            Mark Complete: {steps[completeIdx]}
          </h4>
          <textarea
            placeholder="Add notes (optional)…"
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 14, resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={handleComplete}>Confirm Complete</button>
            <button className="button ghost" onClick={() => { setCompleteIdx(null); setCompleteNotes(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="detail-actions">
        {activeIndices.map((i) => {
          const isDeliveryStep = steps[i] === "Delivery";
          const deliveryIncomplete = isDeliveryStep && totalDelivered < Number(order.quantity);
          return (
          <button
            key={i}
            className="button ghost"
            onClick={() => setCompleteIdx(i)}
            disabled={completeIdx !== null || showPassPrompt || deliveryIncomplete}
            title={deliveryIncomplete ? `Still need to deliver ${Number(order.quantity) - totalDelivered} more` : undefined}
            style={{ marginRight: 8 }}
          >
            Done: {steps[i]}
          </button>
          );
        })}
        {canPassToNext && (
          <button
            onClick={() => setShowPassPrompt(true)}
            disabled={showPassPrompt || completeIdx !== null}
          >
            Pass to {nextStepName}
          </button>
        )}
        {canManage && statuses[steps.length - 1] !== "completed" && (
          <button
            className="button ghost"
            onClick={() => setEditing(true)}
            style={{ marginLeft: 8 }}
          >
            Edit Order
          </button>
        )}
        <button
          className="button ghost"
          onClick={() => printOrder({ order, steps, jobImage, companyName, companyLogo })}
          style={{ marginLeft: 8 }}
        >
          🖨 Print / Save PDF
        </button>
      </div>
    </div>
  );
}
