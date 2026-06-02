export function printOrder({
  order,
  steps,
  jobImage,
  companyName,
  companyLogo,
}) {
  const fmt = (val) => val || "—";
  const fmtDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const fmtDateTime = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d)) return val;
    return (
      d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const row = (label, value) =>
    `<tr><td class="label">${label}</td><td>${fmt(value)}</td></tr>`;

  const finishingFlags = [
    order.spotUV && "Spot UV",
    order.emboss && "Emboss",
    order.foilStamping && "Foil Stamping",
    order.dieCutting && "Die Cutting",
    order.folding && "Folding",
  ].filter(Boolean);

  const historyRows = (order.history || [])
    .map(
      (h, i) => `
    <tr>
      <td><span class="badge">${steps[h.step] || h.step}</span></td>
      <td>${fmtDateTime(h.ts)}</td>
      <td>${h.pressMachine ? `🖨 ${h.pressMachine}` : ""}${h.pressMachine && h.notes ? "<br>" : ""}${h.notes || ""}</td>
    </tr>
  `,
    )
    .join("");

  const logoHtml = companyLogo
    ? `<img src="${companyLogo}" alt="Logo" class="logo-img" />`
    : "";

  const artworkHtml = jobImage
    ? `<div class="artwork"><img src="${jobImage}" alt="Job Artwork" /><div class="artwork-label">Job Artwork</div></div>`
    : "";

  const urgentBadge =
    order.urgent && order.urgent !== "No"
      ? `<span class="urgent-badge">⚡ URGENT</span>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Job Sheet — #${order.orderNumber || ""} ${order.jobName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 32px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .logo-img { max-height: 56px; max-width: 160px; object-fit: contain; }
    .company-name { font-size: 22px; font-weight: 700; color: #1a1a2e; }
    .header-right { text-align: right; }
    .order-num { font-size: 26px; font-weight: 800; color: #4f7bff; }
    .order-date { font-size: 11px; color: #666; margin-top: 2px; }
    .urgent-badge { background: #ef4444; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; margin-left: 8px; }
    .doc-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #555; }
    .top-row { display: flex; gap: 20px; margin-bottom: 20px; align-items: flex-start; }
    .artwork { flex-shrink: 0; text-align: center; }
    .artwork img { width: 110px; height: 110px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; display: block; }
    .artwork-label { font-size: 10px; color: #999; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .section { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .section h4 { background: #f3f4f6; padding: 7px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #555; border-bottom: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 12px; font-size: 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    td.label { color: #666; width: 45%; white-space: nowrap; }
    tr:last-child td { border-bottom: none; }
    .steps-row { display: flex; gap: 0; margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .step-item { flex: 1; padding: 7px 6px; font-size: 11px; text-align: center; background: #f9fafb; color: #888; border-right: 1px solid #e5e7eb; }
    .step-item:last-child { border-right: none; }
    .step-item.done { background: #dcfce7; color: #166534; font-weight: 600; }
    .step-item.active { background: #4f7bff; color: #fff; font-weight: 700; }
    .history-section { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
    .history-section h4 { background: #f3f4f6; padding: 7px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #555; border-bottom: 1px solid #e5e7eb; }
    .history-section table td { font-size: 11px; }
    .badge { background: #4f7bff; color: #fff; border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 700; white-space: nowrap; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }
    @media print {
      body { padding: 16px; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div>
        <div class="company-name">${companyName}</div>
        <div class="meta">Job Sheet</div>
      </div>
    </div>
    <div class="header-right">
      <div class="order-num">#${order.orderNumber || "—"}${urgentBadge}</div>
      <div class="order-date">Created: ${fmtDateTime(order.history?.[0]?.ts)}</div>
      <div class="order-date">Delivery: ${fmtDate(order.deliveryDate)}</div>
    </div>
  </div>

  <div class="top-row">
    ${artworkHtml}
    <div style="flex:1">
      <div class="doc-title">${order.jobName}${order.productType ? " — " + order.productType : ""}</div>
      <div class="meta" style="margin-top:4px">Customer: ${order.customerName}${order.companyName ? " · " + order.companyName : ""}</div>
      ${order.linkedOrderId ? `<div class="meta" style="margin-top:4px">🔗 ${order.linkedReason || "Linked to"} previous order</div>` : ""}
    </div>
  </div>

  <div class="steps-row">
    ${steps.map((s, i) => `<div class="step-item ${i < order.currentStep ? "done" : i === order.currentStep ? "active" : ""}">${s}</div>`).join("")}
  </div>

  <div class="grid">
    <div class="section">
      <h4>Customer Information</h4>
      <table>
        ${row("Customer Name", order.customerName)}
        ${row("Company Name", order.companyName)}
        ${row("Contact Person", order.contactPerson)}
        ${row("Phone", order.phone)}
        ${row("Email", order.email)}
        ${row("Address", order.address)}
      </table>
    </div>
    <div class="section">
      <h4>Job Details</h4>
      <table>
        ${row("Job Name", order.jobName)}
        ${row("Product Type", order.productType)}
        ${row("Quantity", order.quantity)}
        ${row("Versions", order.versions)}
      </table>
    </div>
    <div class="section">
      <h4>Print Specifications</h4>
      <p style="white-space:pre-wrap;line-height:1.6;margin:0">${order.printSpecs || "—"}</p>
    </div>
    <div class="section">
      <h4>Finishing Options</h4>
      <table>
        ${row("Lamination", order.lamination)}
        ${row("Binding", order.binding)}
        <tr><td class="label">Options</td><td>${finishingFlags.length ? finishingFlags.join(", ") : "None"}</td></tr>
      </table>
    </div>
    <div class="section">
      <h4>Delivery & Deadline</h4>
      <table>
        ${row("Required Delivery Date", fmtDate(order.deliveryDate))}
        ${row("Delivery Method", order.deliveryMethod)}
        ${row("Urgent Job", order.urgent)}
      </table>
    </div>
    <div class="section">
      <h4>Approval</h4>
      <table>
        ${row("Customer Signature", order.customerSignature)}
        ${row("Signature Date", fmtDate(order.signatureDate))}
        ${row("Company Representative", order.companyRepresentative)}
      </table>
    </div>
  </div>

  <div class="history-section">
    <h4>Production History</h4>
    <table>
      <thead><tr><td class="label">Step</td><td class="label">Date / Time</td><td>Notes</td></tr></thead>
      <tbody>${historyRows}</tbody>
    </table>
  </div>

  <div class="footer">
    <span>${companyName} — Printed ${new Date().toLocaleDateString("en-GB")}</span>
    <span>Order #${order.orderNumber || "—"} · ${order.customerName}</span>
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}
