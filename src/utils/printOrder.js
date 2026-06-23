const labels = {
  en: {
    jobSheet: "Job Sheet",
    created: "Created",
    delivery: "Delivery",
    customer: "Customer Information",
    customerName: "Customer Name",
    companyName: "Company Name",
    contactPerson: "Contact Person",
    phone: "Phone",
    email: "Email",
    address: "Address",
    jobDetails: "Job Details",
    jobName: "Job Name",
    productType: "Product Type",
    quantity: "Quantity",
    versions: "Versions",
    printSpecs: "Print Specifications",
    pressDetails: "Press Details",
    printProcess: "Print Process",
    pressMachine: "Press Machine",
    numColors: "Number of Colors",
    pressNotes: "Press Notes",
    finishing: "Finishing Options",
    lamination: "Lamination",
    binding: "Binding",
    options: "Options",
    none: "None",
    deliverySection: "Delivery & Deadline",
    deliveryDate: "Required Delivery Date",
    deliveryMethod: "Delivery Method",
    urgent: "Urgent",
    approval: "Approval & Signatures",
    customerSig: "Customer Signature",
    companyRep: "Company Representative",
    companyStamp: "Company Stamp",
    signatureName: "Signature & Name",
    history: "Production History",
    step: "Step",
    dateTime: "Date & Time",
    notes: "Notes",
    printed: "Printed",
    order: "Order",
    preview: "Preview",
    print: "Print",
    saveAsPdf: "Save as PDF",
    close: "Close",
    linkedTo: "Linked to previous order",
  },
  ar: {
    jobSheet: "ورقة العمل",
    created: "تاريخ الإنشاء",
    delivery: "التسليم",
    customer: "بيانات العميل",
    customerName: "اسم العميل",
    companyName: "اسم الشركة",
    contactPerson: "الشخص المسؤول",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    jobDetails: "تفاصيل المهمة",
    jobName: "اسم المهمة",
    productType: "نوع المنتج",
    quantity: "الكمية",
    versions: "عدد النسخ",
    printSpecs: "مواصفات الطباعة",
    pressDetails: "تفاصيل الطباعة",
    printProcess: "طريقة الطباعة",
    pressMachine: "آلة الطباعة",
    numColors: "عدد الألوان",
    pressNotes: "ملاحظات الطباعة",
    finishing: "خيارات التشطيب",
    lamination: "التلميع",
    binding: "التجليد",
    options: "الخيارات",
    none: "لا شيء",
    deliverySection: "التسليم والموعد النهائي",
    deliveryDate: "تاريخ التسليم المطلوب",
    deliveryMethod: "طريقة التسليم",
    urgent: "عاجل",
    approval: "الموافقة والتوقيعات",
    customerSig: "توقيع العميل",
    companyRep: "ممثل الشركة",
    companyStamp: "ختم الشركة",
    signatureName: "التوقيع والاسم",
    history: "سجل الإنتاج",
    step: "المرحلة",
    dateTime: "التاريخ والوقت",
    notes: "ملاحظات",
    printed: "طُبع في",
    order: "طلب",
    preview: "معاينة",
    print: "طباعة",
    saveAsPdf: "حفظ كـ PDF",
    close: "إغلاق",
    linkedTo: "مرتبط بطلب سابق",
  },
};

const stepNamesAr = {
  Received: "استلام", Design: "تصميم", Prepress: "ما قبل الطباعة",
  Press: "طباعة", Postpress: "ما بعد الطباعة", Delivery: "تسليم", Completed: "مكتمل",
};

export function printOrder({
  order,
  steps,
  jobImage,
  companyName,
  companyLogo,
  lang = "en",
}) {
  const L = labels[lang] || labels.en;
  const ar = lang === "ar";
  const stepLabel = (s) => ar ? (stepNamesAr[s] || s) : s;
  const fmt = (val) => val || "—";
  const locale = ar ? "ar-JO" : "en-GB";
  const fmtDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const fmtDateTime = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })
      + " " + d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  const row = (label, value) =>
    `<tr><td class="label">${label}</td><td>${fmt(value)}</td></tr>`;

  const finishingFlags = [
    order.spotUV      && (ar ? "UV موضعي"        : "Spot UV"),
    order.emboss      && (ar ? "نقش بارز"         : "Emboss"),
    order.foilStamping && (ar ? "طباعة بالرقائق" : "Foil Stamping"),
    order.dieCutting  && (ar ? "قطع بالقالب"     : "Die Cutting"),
    order.folding     && (ar ? "طي"               : "Folding"),
  ].filter(Boolean);

  const historyRows = (order.history || [])
    .map((h) => `
    <tr>
      <td><span class="badge">${stepLabel(steps[h.step]) || h.step}</span></td>
      <td>${fmtDateTime(h.ts)}</td>
      <td>${h.pressMachine ? `🖨 ${h.pressMachine}` : ""}${h.pressMachine && h.notes ? "<br>" : ""}${h.notes || ""}</td>
    </tr>`)
    .join("");

  const logoHtml = companyLogo
    ? `<img src="${companyLogo}" alt="Logo" class="logo-img" />`
    : "";

  const artworkHtml = jobImage
    ? `<div class="artwork"><img src="${jobImage}" alt="Job Artwork" /><div class="artwork-label">${ar ? "صورة الملف" : "Job Artwork"}</div></div>`
    : "";

  const urgentBadge = order.urgent && order.urgent !== "No"
    ? `<span class="urgent-badge">⚡ ${ar ? "عاجل" : "URGENT"}</span>`
    : "";

  const dir = ar ? "rtl" : "ltr";

  const html = `<!DOCTYPE html>
<html lang="${ar ? "ar" : "en"}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>${L.jobSheet} — #${order.orderNumber || ""} ${order.jobName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${ar ? "'Tahoma', 'Arial Unicode MS'," : "'Helvetica Neue',"} Arial, sans-serif; font-size: 13px; color: #1a1a1a; direction: ${dir}; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .logo-img { max-height: 56px; max-width: 160px; object-fit: contain; }
    .company-name { font-size: 22px; font-weight: 700; color: #1a1a2e; }
    .header-right { text-align: ${ar ? "left" : "right"}; }
    .order-num { font-size: 26px; font-weight: 800; color: #4f7bff; }
    .order-date { font-size: 11px; color: #666; margin-top: 2px; }
    .urgent-badge { background: #ef4444; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; margin-${ar ? "right" : "left"}: 8px; }
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
    td { padding: 6px 12px; font-size: 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; text-align: ${ar ? "right" : "left"}; }
    td.label { color: #666; width: 45%; white-space: nowrap; }
    tr:last-child td { border-bottom: none; }
    .steps-row { display: flex; flex-direction: ${ar ? "row-reverse" : "row"}; gap: 0; margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .step-item { flex: 1; padding: 7px 6px; font-size: 11px; text-align: center; background: #f9fafb; color: #888; border-${ar ? "left" : "right"}: 1px solid #e5e7eb; }
    .step-item:last-child { border-${ar ? "left" : "right"}: none; }
    .step-item.done { background: #dcfce7; color: #166534; font-weight: 600; }
    .step-item.active { background: #4f7bff; color: #fff; font-weight: 700; }
    .history-section { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
    .history-section h4 { background: #f3f4f6; padding: 7px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #555; border-bottom: 1px solid #e5e7eb; }
    .history-section table td { font-size: 11px; }
    .badge { background: #4f7bff; color: #fff; border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 700; white-space: nowrap; }
    .approval-box { display: flex; gap: 20px; padding: 12px; }
    .sig-block { flex: 1; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; min-height: 100px; display: flex; flex-direction: column; gap: 6px; }
    .sig-block .sig-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .5px; font-weight: 700; }
    .sig-block .sig-name { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .sig-block .sig-date { font-size: 11px; color: #666; }
    .sig-block img { max-height: 70px; max-width: 100%; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 6px; margin-top: 4px; }
    .sig-block .sig-line { border-bottom: 1px solid #ccc; height: 50px; margin-top: auto; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }
    /* ── Preview toolbar ── */
    .toolbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: #1a1a2e; direction: ltr;
      display: flex; align-items: center; gap: 10px;
      padding: 10px 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,.3);
    }
    .toolbar-title { color: #94a3b8; font-size: 13px; flex: 1; }
    .toolbar-title strong { color: #e2e8f0; }
    .btn-toolbar {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 18px; border-radius: 8px; border: none;
      font-size: 13px; font-weight: 700; cursor: pointer;
      font-family: inherit;
    }
    .btn-print { background: #4f7bff; color: #fff; }
    .btn-print:hover { background: #3b65e8; }
    .btn-pdf { background: #10b981; color: #fff; }
    .btn-pdf:hover { background: #059669; }
    .btn-close { background: rgba(255,255,255,0.08); color: #94a3b8; }
    .btn-close:hover { background: rgba(255,255,255,0.14); color: #e2e8f0; }
    body { padding-top: 68px; background: #e5e7eb; }
    .page { background: #fff; max-width: 860px; margin: 24px auto 48px; padding: 32px; box-shadow: 0 4px 32px rgba(0,0,0,.15); border-radius: 4px; }
    @media print {
      .toolbar { display: none !important; }
      body { padding-top: 0; background: #fff; }
      .page { box-shadow: none; margin: 0; padding: 0; border-radius: 0; max-width: none; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-title">${L.preview} — <strong>#${order.orderNumber || "—"} ${order.jobName}</strong></div>
    <button class="btn-toolbar btn-print" onclick="window.print()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      ${L.print}
    </button>
    <button class="btn-toolbar btn-pdf" onclick="window.print()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      ${L.saveAsPdf}
    </button>
    <button class="btn-toolbar btn-close" onclick="window.close()">✕ ${L.close}</button>
  </div>
<div class="page">
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div>
        <div class="company-name">${companyName}</div>
        <div class="meta">${L.jobSheet}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="order-num">#${order.orderNumber || "—"}${urgentBadge}</div>
      <div class="order-date">${L.created}: ${fmtDateTime(order.history?.[0]?.ts)}</div>
      <div class="order-date">${L.delivery}: ${fmtDate(order.deliveryDate)}</div>
    </div>
  </div>

  <div class="top-row">
    ${artworkHtml}
    <div style="flex:1">
      <div class="doc-title">${order.jobName}${order.productType ? " — " + order.productType : ""}</div>
      <div class="meta" style="margin-top:4px">${order.customerName}${order.companyName ? " · " + order.companyName : ""}</div>
      ${order.linkedOrderId ? `<div class="meta" style="margin-top:4px">🔗 ${order.linkedReason || L.linkedTo}</div>` : ""}
    </div>
  </div>

  <div class="steps-row">
    ${steps.map((s, i) => `<div class="step-item ${i < order.currentStep ? "done" : i === order.currentStep ? "active" : ""}">${stepLabel(s)}</div>`).join("")}
  </div>

  <div class="grid">
    <div class="section">
      <h4>${L.customer}</h4>
      <table>
        ${row(L.customerName, order.customerName)}
        ${row(L.companyName, order.companyName)}
        ${row(L.contactPerson, order.contactPerson)}
        ${row(L.phone, order.phone)}
        ${row(L.email, order.email)}
        ${row(L.address, order.address)}
      </table>
    </div>
    <div class="section">
      <h4>${L.jobDetails}</h4>
      <table>
        ${row(L.jobName, order.jobName)}
        ${row(L.productType, order.productType)}
        ${row(L.quantity, order.quantity)}
        ${row(L.versions, order.versions)}
      </table>
    </div>
    <div class="section">
      <h4>${L.printSpecs}</h4>
      <p style="padding:10px 12px;white-space:pre-wrap;line-height:1.6;margin:0">${order.printSpecs || "—"}</p>
    </div>
    <div class="section">
      <h4>${L.pressDetails}</h4>
      <table>
        ${order.pressProcess?.length ? row(L.printProcess, order.pressProcess.join(", ")) : ""}
        ${row(L.pressMachine, order.pressMachine)}
        ${row(L.numColors, order.numberOfColors)}
        ${order.pressNotes ? `<tr><td class="label">${L.pressNotes}</td><td style="white-space:pre-wrap">${order.pressNotes}</td></tr>` : ""}
      </table>
    </div>
    <div class="section">
      <h4>${L.finishing}</h4>
      <table>
        ${row(L.lamination, order.lamination)}
        ${row(L.binding, order.binding)}
        <tr><td class="label">${L.options}</td><td>${finishingFlags.length ? finishingFlags.join(", ") : L.none}</td></tr>
      </table>
    </div>
    <div class="section">
      <h4>${L.deliverySection}</h4>
      <table>
        ${row(L.deliveryDate, fmtDate(order.deliveryDate))}
        ${row(L.deliveryMethod, order.deliveryMethod)}
        ${row(L.urgent, order.urgent)}
      </table>
    </div>
  </div>

  <div class="section" style="margin-bottom:20px">
    <h4>${L.approval}</h4>
    <div class="approval-box">
      <div class="sig-block">
        <div class="sig-label">${L.customerSig}</div>
        ${order.customerSignatureImage
          ? `<img src="${order.customerSignatureImage}" alt="sig" /><div class="sig-name">${order.customerSignature || ""}</div><div class="sig-date">${fmtDate(order.signatureDate)}</div>`
          : `<div class="sig-line"></div><div style="font-size:11px;color:#aaa;margin-top:4px">${order.customerSignature ? order.customerSignature + (order.signatureDate ? " — " + fmtDate(order.signatureDate) : "") : L.signatureName}</div>`
        }
      </div>
      <div class="sig-block">
        <div class="sig-label">${L.companyRep}</div>
        <div class="sig-line"></div>
        <div style="font-size:11px;color:#aaa;margin-top:4px">${order.companyRepresentative || L.signatureName}</div>
      </div>
      <div class="sig-block">
        <div class="sig-label">${L.companyStamp}</div>
        <div class="sig-line"></div>
      </div>
    </div>
  </div>

  <div class="history-section">
    <h4>${L.history}</h4>
    <table>
      <thead><tr><td class="label">${L.step}</td><td class="label">${L.dateTime}</td><td>${L.notes}</td></tr></thead>
      <tbody>${historyRows}</tbody>
    </table>
  </div>

  <div class="footer">
    <span>${companyName} — ${L.printed} ${new Date().toLocaleDateString(locale)}</span>
    <span>${L.order} #${order.orderNumber || "—"} · ${order.customerName}</span>
  </div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
