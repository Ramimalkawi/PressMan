export function printDeliveryNote({ order, delivery, companyName, companyLogo }) {
  const fmtDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const fmtDateTime = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d)) return val;
    return (
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const logoHtml = companyLogo
    ? `<img src="${companyLogo}" alt="Logo" class="logo-img" />`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Delivery Note — #${order.orderNumber || ""}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 32px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .logo-img { max-height: 56px; max-width: 160px; object-fit: contain; }
    .company-name { font-size: 22px; font-weight: 700; color: #1a1a2e; }
    .doc-label { font-size: 12px; color: #666; margin-top: 2px; }
    .header-right { text-align: right; }
    .order-num { font-size: 26px; font-weight: 800; color: #4f7bff; }
    .order-date { font-size: 11px; color: #666; margin-top: 3px; }
    .section { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
    .section h4 { background: #f3f4f6; padding: 7px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #555; border-bottom: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 7px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    td.label { color: #666; width: 40%; }
    td.value { font-weight: 600; }
    tr:last-child td { border-bottom: none; }
    .highlight-box { background: #f0f4ff; border: 1px solid #c7d7ff; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; display: flex; gap: 32px; align-items: center; }
    .highlight-item { text-align: center; }
    .highlight-num { font-size: 32px; font-weight: 800; color: #4f7bff; line-height: 1; }
    .highlight-label { font-size: 11px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: .5px; }
    .sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
    .sig-box { border-top: 1px solid #1a1a2e; padding-top: 8px; }
    .sig-label { font-size: 11px; color: #666; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }
    @media print { body { padding: 16px; } @page { margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div>
        <div class="company-name">${companyName || "PressMan"}</div>
        <div class="doc-label">Delivery Note</div>
      </div>
    </div>
    <div class="header-right">
      <div class="order-num">Order #${order.orderNumber || "—"}</div>
      <div class="order-date">Delivery Date: ${fmtDateTime(delivery.ts)}</div>
      ${delivery.invoiceNumber ? `<div class="order-date">Invoice #: <strong>${delivery.invoiceNumber}</strong></div>` : ""}
    </div>
  </div>

  <div class="section">
    <h4>Customer &amp; Job</h4>
    <table>
      <tr><td class="label">Customer</td><td class="value">${order.customerName || "—"}</td></tr>
      ${order.companyName ? `<tr><td class="label">Company</td><td class="value">${order.companyName}</td></tr>` : ""}
      ${order.phone ? `<tr><td class="label">Phone</td><td class="value">${order.phone}</td></tr>` : ""}
      ${order.address ? `<tr><td class="label">Address</td><td class="value">${order.address}</td></tr>` : ""}
      <tr><td class="label">Job Name</td><td class="value">${order.jobName || "—"}</td></tr>
      ${order.productType ? `<tr><td class="label">Product Type</td><td class="value">${order.productType}</td></tr>` : ""}
      <tr><td class="label">Total Order Quantity</td><td class="value">${order.quantity || "—"}</td></tr>
    </table>
  </div>

  <div class="highlight-box">
    <div class="highlight-item">
      <div class="highlight-num">${delivery.quantityDelivered}</div>
      <div class="highlight-label">Qty Delivered</div>
    </div>
    ${delivery.boxes ? `
    <div class="highlight-item">
      <div class="highlight-num">${delivery.boxes}</div>
      <div class="highlight-label">Boxes</div>
    </div>` : ""}
    ${delivery.invoiceNumber ? `
    <div class="highlight-item" style="text-align:left">
      <div style="font-size:18px;font-weight:700;color:#1a1a2e">${delivery.invoiceNumber}</div>
      <div class="highlight-label">Invoice Number</div>
    </div>` : ""}
  </div>

  ${delivery.notes ? `
  <div class="section">
    <h4>Notes</h4>
    <p style="padding:10px 12px;white-space:pre-wrap;line-height:1.6">${delivery.notes}</p>
  </div>` : ""}

  <div class="sig-row">
    <div class="sig-box">
      <div class="sig-label">Delivered by (Signature)</div>
    </div>
    <div class="sig-box">
      ${delivery.signature ? `
        <img src="${delivery.signature}" alt="Customer Signature" style="max-width:220px;max-height:90px;object-fit:contain;display:block;margin-bottom:6px;" />
        <div style="font-size:13px;font-weight:700;color:#1a1a2e;margin-bottom:2px;">${delivery.signedBy || ""}</div>
        <div style="font-size:11px;color:#888;">Signed on: ${fmtDateTime(delivery.signedAt)}</div>
      ` : `<div class="sig-label">Received by (Signature &amp; Stamp)</div>`}
    </div>
  </div>

  <div class="footer">
    <span>${companyName || "PressMan"} — Printed ${new Date().toLocaleDateString("en-GB")}</span>
    <span>Order #${order.orderNumber || "—"} · ${order.customerName || ""}</span>
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}
