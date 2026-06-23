import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useOrders, getStepStatuses } from "../state/orders";
import { useSettings } from "../state/settings";
import { useJobImages } from "../state/jobImages";
import { useAuth } from "../state/auth";
import { formatDateDMY, formatDateTimeDMY } from "../utils/date";
import { printOrder } from "../utils/printOrder";
import { printDeliveryNote } from "../utils/printDeliveryNote";
import { t, stepNames } from "../utils/translations";
import { useLang } from "../state/lang";
import OrderForm from "./OrderForm";
import pressMachineIcon from "../assets/press-machine.png";

/* ── Detail section card — mirrors OrderForm's SectionCard ── */
function DetailSection({ icon, title, accent = "#4f7bff", children }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 18px",
        borderBottom: "1px solid #f0f0f0",
        background: `linear-gradient(135deg, ${accent}08 0%, #fff 100%)`,
        borderLeft: `4px solid ${accent}`,
      }}>
        <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>
        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a2e", letterSpacing: 0.2 }}>{title}</h4>
      </div>
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

/* ── Label / value row ── */
function DRow({ label, value, full }) {
  if (value === null || value === undefined || value === "" || value === false) return null;
  return (
    <div style={{
      display: "flex", flexDirection: full ? "column" : "row",
      justifyContent: "space-between", gap: full ? 4 : 10,
      padding: "6px 0", borderBottom: "1px dashed #f0f2f7",
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>{label}</span>
      <strong style={{ fontSize: 13, color: "#1f2937", textAlign: full ? "left" : "right", maxWidth: full ? "100%" : "65%", wordBreak: "break-word" }}>{value}</strong>
    </div>
  );
}

/* ── Tag chip ── */
function Tag({ label, color = "#4f7bff" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 999,
      background: `${color}18`, color,
      fontSize: 11, fontWeight: 700, border: `1px solid ${color}30`,
    }}>{label}</span>
  );
}

function CopyLinkButton({ token, signed, signerName }) {
  const [copied, setCopied] = React.useState(false);
  const url = `${window.location.origin}/sign/${token}`;
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  if (signed) return (
    <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, whiteSpace: "nowrap", alignSelf: "center" }}>
      ✓ Signed{signerName ? ` by ${signerName}` : ""}
    </span>
  );
  return (
    <button className="button small ghost" onClick={copy} style={{ whiteSpace: "nowrap" }}>
      {copied ? "✓ Copied!" : "🔗 Share Link"}
    </button>
  );
}

function OrderSignLinkButton({ order }) {
  const { updateOrder } = useOrders();
  const [copied, setCopied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const copy = async () => {
    let token = order.orderSignToken;
    if (!token) {
      setBusy(true);
      token = crypto.randomUUID();
      await updateOrder(order.id, { orderSignToken: token });
      setBusy(false);
    }
    const url = `${window.location.origin}/order-sign/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (order.customerSignature && order.customerSignatureImage) {
    return (
      <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
        ✓ Signed by {order.customerSignature}
        {order.signatureDate ? ` — ${new Date(order.signatureDate).toLocaleDateString("en-GB")}` : ""}
      </span>
    );
  }
  return (
    <button className="button small ghost" onClick={copy} disabled={busy} style={{ whiteSpace: "nowrap" }}>
      {busy ? "…" : copied ? "✓ Copied!" : "🔗 Share Sign Link"}
    </button>
  );
}

export default function OrderDetails({ order }) {
  const { canManage, profile } = useAuth();
  const { activateNextStep, completeStep, logDelivery, addStageLog, getOrderSteps, orders, updateOrder } = useOrders();
  const { pressMachines, companyName, companyLogo } = useSettings();
  const { setJobImage, removeJobImage } = useJobImages();
  const steps = getOrderSteps(order);
  const statuses = getStepStatuses(order, steps);
  const activeIndices = steps.map((_, i) => i).filter((i) => statuses[i] === "active");
  const furthestActiveIdx = activeIndices.length > 0 ? Math.max(...activeIndices) : -1;
  const canPassToNext = furthestActiveIdx >= 0 && furthestActiveIdx < steps.length - 1 && steps[furthestActiveIdx + 1] !== "Completed" && steps[furthestActiveIdx] !== "Received";
  const nextStepName = canPassToNext ? steps[furthestActiveIdx + 1] : "";
  const isEnteringPress = nextStepName === "Press";

  const { lang } = useLang();
  const tr = t[lang];
  const ar = lang === "ar";
  const stepLabel = (s) => ar ? (stepNames.ar[s] || s) : s;

  const [editing, setEditing] = useState(false);
  // Stage logs — one text input per step
  const [logInputs, setLogInputs] = useState({});
  const [submittingLog, setSubmittingLog] = useState({});
  const handleAddLog = async (stepIdx) => {
    const text = (logInputs[stepIdx] || "").trim();
    if (!text) return;
    setSubmittingLog((p) => ({ ...p, [stepIdx]: true }));
    await addStageLog(order.id, stepIdx, text, profile?.full_name || "");
    setLogInputs((p) => ({ ...p, [stepIdx]: "" }));
    setSubmittingLog((p) => ({ ...p, [stepIdx]: false }));
  };

  // "pass" prompt — for activateNextStep
  const [showPassPrompt, setShowPassPrompt] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState("");
  // "complete" prompt — for completeStep
  const [completeIdx, setCompleteIdx] = useState(null);
  const [completeNotes, setCompleteNotes] = useState("");

  const fileInputRef = useRef(null);
  // Read directly from order data (instant, no async needed)
  const jobImage = order.jobImage || null;
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
    reader.onload = (ev) => {
      setJobImage(order.id, ev.target.result);
      updateOrder(order.id, { jobImage: ev.target.result });
    };
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
    <div className="order-details" dir={ar ? "rtl" : "ltr"}>
      <div className="detail-head">
        <div>
          <h3>
            {order.orderNumber ? `#${order.orderNumber} — ` : ""}
            {order.jobName} — {order.customerName}
          </h3>
          <div className="detail-meta">
            {tr.quantity}: {order.quantity} • {tr.product}: {order.productType || "N/A"}
          </div>
          {order.printSpecs && (
            <div className="detail-meta">{order.printSpecs}</div>
          )}
          {order.pressMachine && (
            <div className="detail-meta">
              {tr.pressMachine}: {order.pressMachine}
            </div>
          )}
          {order.linkedOrderId && (() => {
              // Build the full chain by walking linkedOrderId links
              const chain = [];
              const seen = new Set();
              let current = order;
              while (current?.linkedOrderId && !seen.has(String(current.linkedOrderId))) {
                seen.add(String(current.linkedOrderId));
                const next = orders.find((o) => String(o.id) === String(current.linkedOrderId));
                if (!next) break;
                chain.push({ order: next, reason: current.linkedReason });
                current = next;
              }
              if (!chain.length) return null;
              return (
                <div style={{ marginTop: 10, borderRadius: 8, border: "1px solid #c7d7ff", overflow: "hidden" }}>
                  {chain.map(({ order: o, reason }, idx) => (
                    <div key={o.id} style={{
                      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                      padding: "7px 12px",
                      background: idx === 0 ? "#f0f4ff" : "#f8faff",
                      borderTop: idx > 0 ? "1px solid #dce8ff" : "none",
                      borderLeft: `3px solid ${idx === 0 ? "#4f7bff" : "#a5b4fc"}`,
                    }}>
                      <span style={{ fontSize: 13, color: "#9ca3af", minWidth: 16 }}>
                        {idx === 0 ? "🔗" : "↳"}
                      </span>
                      {reason && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", background: "#eef2ff", padding: "2px 7px", borderRadius: 999 }}>
                          {reason}
                        </span>
                      )}
                      <Link to={`/orders/${o.id}`} style={{ color: "#4f7bff", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
                        #{o.orderNumber} — {o.jobName}
                      </Link>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{o.customerName}</span>
                      {o.history?.[0]?.ts && (
                        <span style={{ fontSize: 11, color: "#9ca3af", marginInlineStart: "auto" }}>
                          {formatDateDMY(o.history[0].ts)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="detail-pill">
            {activeIndices.length > 0
              ? activeIndices.map((i) => stepLabel(steps[i])).join(" · ")
              : stepLabel(steps[steps.length - 1])}
          </div>
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
                {tr.jobArtwork}
              </span>
              <button
                className="button small ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                {tr.replaceImage}
              </button>
              <button
                className="button small ghost"
                style={{ color: "#dc2626" }}
                onClick={() => { removeJobImage(order.id); updateOrder(order.id, { jobImage: null }); }}
              >
                {tr.remove}
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
              {tr.uploadJobArtwork}
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

        {/* ── Customer ── */}
        <DetailSection icon="👤" title={tr.customerInformation} accent="#4f7bff">
          <DRow label={tr.customerName}       value={order.customerName} />
          <DRow label={tr.companyName}        value={order.companyName} />
          <DRow label={tr.contactPerson}      value={order.contactPerson} />
          <DRow label={tr.phone}              value={order.phone} />
          <DRow label={tr.email}              value={order.email} />
          <DRow label={tr.address}            value={order.address} />
        </DetailSection>

        {/* ── Job Details ── */}
        <DetailSection icon="📋" title={tr.jobDetails} accent="#8b5cf6">
          <DRow label={tr.jobName}     value={order.jobName} />
          <DRow label={tr.productType} value={order.productType} />
          <DRow label={tr.qty}         value={order.quantity} />
          <DRow label={tr.versions}    value={order.versions} />
        </DetailSection>

        {/* ── Print Specifications ── */}
        <DetailSection icon="🖨️" title={tr.printSpecifications} accent="#0ea5e9">
          {order.printSpecs
            ? <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 13, color: "#374151" }}>{order.printSpecs}</p>
            : <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
          }
        </DetailSection>

        {/* ── Press Details ── */}
        <DetailSection
          icon={<img src={pressMachineIcon} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />}
          title={tr.pressDetails} accent="#f59e0b"
        >
          {order.pressProcess?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {order.pressProcess.map((p) => <Tag key={p} label={p} color="#f59e0b" />)}
            </div>
          )}
          <DRow label={tr.pressMachine}    value={order.pressMachine} />
          <DRow label={tr.numberOfColors}  value={order.numberOfColors} />
          <DRow label={tr.pressMoreDetails} value={order.pressNotes} full />
          {!order.pressProcess?.length && !order.pressMachine && !order.numberOfColors && !order.pressNotes && (
            <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
          )}
        </DetailSection>

        {/* ── Finishing Options ── */}
        <DetailSection icon="✨" title={tr.finishingOptions} accent="#ec4899">
          <DRow label={tr.lamination}   value={order.lamination} />
          <DRow label={tr.binding}      value={order.binding} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {order.spotUV      && <Tag label={tr.spotUV}      color="#ec4899" />}
            {order.emboss      && <Tag label={tr.emboss}      color="#ec4899" />}
            {order.foilStamping && <Tag label={tr.foilStamping} color="#ec4899" />}
            {order.dieCutting  && <Tag label={tr.dieCutting}  color="#ec4899" />}
            {order.folding     && <Tag label={tr.folding}     color="#ec4899" />}
          </div>
        </DetailSection>

        {/* ── Delivery & Deadline ── */}
        <DetailSection icon="🚚" title={tr.deliveryDeadline} accent="#f97316">
          <DRow label={tr.requiredDeliveryDate} value={formatDateDMY(order.deliveryDate)} />
          <DRow label={tr.deliveryMethod}       value={order.deliveryMethod} />
          <DRow label={tr.urgentJob}            value={order.urgent === "Yes" ? <Tag label={tr.yes} color="#ef4444" /> : tr.no} />
        </DetailSection>

        {/* ── Approval ── */}
        <DetailSection icon="✍️" title={tr.approval} accent="#6366f1">
          <DRow label={tr.customerSignature}    value={order.customerSignature} />
          <DRow label={tr.date}                 value={formatDateDMY(order.signatureDate)} />
          <DRow label={tr.companyRepresentative} value={order.companyRepresentative} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, marginTop: 4, borderTop: "1px dashed #f0f2f7" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>Online Signature</span>
            <OrderSignLinkButton order={order} />
          </div>
        </DetailSection>

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
            <span className="step-name">{stepLabel(s)}</span>
            {statuses[idx] === "active" && idx !== steps.length - 1 && (
              <span className="badge">{tr.inProgress}</span>
            )}
          </li>
        ))}
      </ol>

      {/* Stage logs — one panel per active (or completed) step that has logs or is active */}
      {steps.map((s, idx) => {
        const isActive = statuses[idx] === "active";
        const logs = (order.stageLogs?.[idx] || []);
        if (!isActive && logs.length === 0) return null;
        return (
          <div key={idx} className="detail-card" style={{ marginTop: 10, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ background: isActive ? "var(--accent,#4f7bff)" : "#e5e7eb", color: isActive ? "#fff" : "#888", borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                {stepLabel(s)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text,#111)" }}>
                {ar ? "سجل الأعمال" : "Work Log"}
              </span>
              <span style={{ fontSize: 11, color: "#aaa", marginInlineStart: "auto" }}>
                {logs.length} {ar ? "ملاحظة" : logs.length === 1 ? "note" : "notes"}
              </span>
            </div>

            {logs.length > 0 && (
              <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {logs.map((log) => (
                  <div key={log.id} style={{ background: "var(--bg,#f8faff)", border: "1px solid var(--border,#e5e7eb)", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent,#4f7bff)" }}>{log.author || "—"}</span>
                      <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>{formatDateTimeDMY(log.ts)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text,#222)", lineHeight: 1.5 }}>{log.text}</div>
                  </div>
                ))}
              </div>
            )}

            {isActive && (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={logInputs[idx] || ""}
                  onChange={(e) => setLogInputs((p) => ({ ...p, [idx]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddLog(idx)}
                  placeholder={ar ? "أضف ملاحظة…" : "Add a note…"}
                  style={{ flex: 1, padding: "8px 11px", borderRadius: 8, border: "1px solid var(--border,#e5e7eb)", fontSize: 13 }}
                />
                <button
                  onClick={() => handleAddLog(idx)}
                  disabled={submittingLog[idx] || !(logInputs[idx] || "").trim()}
                  style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--accent,#4f7bff)", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {submittingLog[idx] ? "…" : ar ? "+ إضافة" : "+ Add"}
                </button>
              </div>
            )}
          </div>
        );
      })}

      <div className="history">
        <h4>{tr.history}</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border, #e5e7eb)" }}>
              <th style={{ textAlign: ar ? "right" : "left", padding: "7px 10px", fontWeight: 600, color: "var(--text-muted, #888)", fontSize: 12 }}>#</th>
              <th style={{ textAlign: ar ? "right" : "left", padding: "7px 10px", fontWeight: 600, color: "var(--text-muted, #888)", fontSize: 12 }}>{tr.stage}</th>
              <th style={{ textAlign: ar ? "right" : "left", padding: "7px 10px", fontWeight: 600, color: "var(--text-muted, #888)", fontSize: 12 }}>{tr.action}</th>
              <th style={{ textAlign: ar ? "right" : "left", padding: "7px 10px", fontWeight: 600, color: "var(--text-muted, #888)", fontSize: 12 }}>{tr.dateTime}</th>
              <th style={{ textAlign: ar ? "right" : "left", padding: "7px 10px", fontWeight: 600, color: "var(--text-muted, #888)", fontSize: 12 }}>{tr.details}</th>
            </tr>
          </thead>
          <tbody>
            {(order.history || []).map((h, i) => {
              const actionLabel = h.action === "delivery_logged" ? tr.delivered : h.action === "completed" ? tr.completed : tr.activated;
              const actionColor = h.action === "completed" ? "#22c55e" : h.action === "delivery_logged" ? "#f59e0b" : "var(--accent, #4f7bff)";
              const details = [
                h.action === "delivery_logged" && `${tr.deliveryQty}: ${h.quantityDelivered}${h.boxes ? ` · ${h.boxes} ${tr.boxes}` : ""}${h.invoiceNumber ? ` · ${tr.invoiceNo} ${h.invoiceNumber}` : ""}`,
                h.pressMachine && `🖨 ${h.pressMachine}`,
                h.notes,
              ].filter(Boolean);
              return (
                <tr key={i} style={{ borderBottom: "1px solid var(--border, #f0f0f0)" }}>
                  <td style={{ padding: "8px 10px", color: "var(--text-muted, #aaa)", fontSize: 12 }}>{i + 1}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{
                      background: "var(--accent, #4f7bff)",
                      color: "#fff",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}>
                      {stepLabel(steps[h.step]) || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{
                      background: `${actionColor}22`,
                      color: actionColor,
                      borderRadius: 5,
                      padding: "2px 7px",
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}>
                      {actionLabel}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", color: "var(--text-muted, #888)" }}>
                    {formatDateTimeDMY(h.ts)}
                  </td>
                  <td style={{ padding: "8px 10px", color: "var(--text, #333)" }}>
                    {details.map((d, di) => (
                      <div key={di} style={{ fontSize: 12, lineHeight: 1.6 }}>{d}</div>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delivery log panel — visible while active or after completion if deliveries exist */}
      {(deliveryIsActive || deliveries.length > 0) && (
        <div className="detail-card" style={{ marginTop: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>{tr.deliveries}</h4>
            <div style={{ fontSize: 13, color: "var(--text-muted,#888)" }}>
              {tr.deliveredOf}: <strong>{totalDelivered}</strong> / {order.quantity}
            </div>
          </div>

          {deliveries.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border,#e5e7eb)" }}>
                  <th style={{ textAlign: ar ? "right" : "left", padding: "4px 8px", fontWeight: 600 }}>{tr.deliveryDate}</th>
                  <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: 600 }}>{tr.deliveryQty}</th>
                  <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: 600 }}>{tr.boxes}</th>
                  <th style={{ textAlign: ar ? "right" : "left", padding: "4px 8px", fontWeight: 600 }}>{tr.invoiceNo}</th>
                  <th style={{ textAlign: ar ? "right" : "left", padding: "4px 8px", fontWeight: 600 }}>{tr.notes}</th>
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
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="button small ghost"
                          onClick={() => printDeliveryNote({ order, delivery: d, companyName, companyLogo })}
                        >
                          {tr.printNote}
                        </button>
                        {d.signToken && (
                          <CopyLinkButton token={d.signToken} signed={!!d.signedAt} signerName={d.signedBy} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {showDeliveryForm ? (
            <form onSubmit={handleLogDelivery} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", paddingTop: 8, borderTop: "1px solid var(--border,#e5e7eb)" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 120px" }}>
                {tr.qtyDelivered}
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
                {tr.noOfBoxes}
                <input
                  type="number"
                  min="1"
                  value={deliveryForm.boxes}
                  onChange={(e) => setDF("boxes", e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "1 1 140px" }}>
                {tr.invoiceNumber}
                <input
                  value={deliveryForm.invoiceNumber}
                  onChange={(e) => setDF("invoiceNumber", e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, flex: "2 1 200px" }}>
                {tr.notes}
                <input
                  value={deliveryForm.notes}
                  onChange={(e) => setDF("notes", e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <div style={{ display: "flex", gap: 8, alignSelf: "flex-end" }}>
                <button type="submit" disabled={submittingDelivery}>
                  {submittingDelivery ? tr.saving : tr.logDelivery}
                </button>
                <button type="button" className="button ghost" onClick={() => setShowDeliveryForm(false)}>
                  {tr.cancel}
                </button>
              </div>
            </form>
          ) : deliveryIsActive ? (
            <button className="button ghost" onClick={() => setShowDeliveryForm(true)}>
              {tr.logDelivery}
            </button>
          ) : null}
        </div>
      )}

      {/* Pass to next department prompt */}
      {showPassPrompt && canPassToNext && (
        <div className="detail-card" style={{ marginTop: 12, padding: 14 }}>
          <h4 style={{ margin: "0 0 8px" }}>
            {tr.passTo}: {stepLabel(nextStepName)}
          </h4>
          {isEnteringPress && pressMachines.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                {tr.assignPressMachine}
              </label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 14 }}
              >
                <option value="">{tr.selectMachine}</option>
                {pressMachines.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={handlePass} disabled={isEnteringPress && pressMachines.length > 0 && !selectedMachine}>
              {tr.confirm}
            </button>
            <button className="button ghost" onClick={() => { setShowPassPrompt(false); setSelectedMachine(""); }}>
              {tr.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Complete step prompt */}
      {completeIdx !== null && (
        <div className="detail-card" style={{ marginTop: 12, padding: 14 }}>
          <h4 style={{ margin: "0 0 8px" }}>
            {tr.markComplete}: {stepLabel(steps[completeIdx])}
          </h4>
          <textarea
            placeholder={tr.addNotes}
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 14, resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={handleComplete}>{tr.confirmComplete}</button>
            <button className="button ghost" onClick={() => { setCompleteIdx(null); setCompleteNotes(""); }}>
              {tr.cancel}
            </button>
          </div>
        </div>
      )}

      <div style={{
        marginTop: 24,
        padding: "16px 20px",
        background: "var(--bg, #f8faff)",
        border: "1px solid var(--border, #e5e7eb)",
        borderRadius: 14,
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "center",
      }}>
        {/* Primary workflow actions */}
        {activeIndices.map((i) => {
          const isDeliveryStep = steps[i] === "Delivery";
          const deliveryIncomplete = isDeliveryStep && totalDelivered < Number(order.quantity);
          return (
            <button
              key={i}
              onClick={() => setCompleteIdx(i)}
              disabled={completeIdx !== null || showPassPrompt || deliveryIncomplete}
              title={deliveryIncomplete ? `${tr.stillNeedToDeliver} ${Number(order.quantity) - totalDelivered} ${tr.more}` : tr.hint_done}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 10, border: "none",
                background: deliveryIncomplete ? "#f1f5f9" : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: deliveryIncomplete ? "#94a3b8" : "#fff",
                fontWeight: 700, fontSize: 13, cursor: deliveryIncomplete ? "not-allowed" : "pointer",
                boxShadow: deliveryIncomplete ? "none" : "0 2px 8px rgba(34,197,94,0.3)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {tr.done}: {stepLabel(steps[i])}
            </button>
          );
        })}

        {canPassToNext && (
          <button
            onClick={() => setShowPassPrompt(true)}
            disabled={showPassPrompt || completeIdx !== null}
            title={tr.hint_pass}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #4f7bff, #6366f1)",
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(79,123,255,0.3)",
              opacity: (showPassPrompt || completeIdx !== null) ? 0.5 : 1,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
            {tr.passTo} {stepLabel(nextStepName)}
          </button>
        )}

        {/* Divider if there are workflow actions */}
        {(activeIndices.length > 0 || canPassToNext) && (canManage || true) && (
          <div style={{ width: 1, height: 28, background: "var(--border, #e5e7eb)", margin: "0 4px" }} />
        )}

        {canManage && statuses[steps.length - 1] !== "completed" && (
          <button
            onClick={() => setEditing(true)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 10,
              border: "1px solid var(--border, #e5e7eb)",
              background: "#fff", color: "var(--text, #374151)",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {tr.editOrder}
          </button>
        )}

        <button
          onClick={() => printOrder({ order, steps, jobImage, companyName, companyLogo, lang })}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 16px", borderRadius: 10,
            border: "1px solid var(--border, #e5e7eb)",
            background: "#fff", color: "var(--text, #374151)",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          {tr.printSavePDF}
        </button>
      </div>
    </div>
  );
}
