import React, { useMemo, useState } from "react";
import { useOrders } from "../state/orders";
import { useCustomers } from "../state/customers";
import { useSettings } from "../state/settings";
import { useLang } from "../state/lang";
import { t, stepNames } from "../utils/translations";
import pressMachineIcon from "../assets/press-machine.png";

/* ── Shared sub-components ── */
function SectionCard({ icon, title, accent = "#4f7bff", children }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 20,
      boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 20px",
        borderBottom: "1px solid #f0f0f0",
        background: `linear-gradient(135deg, ${accent}08 0%, #fff 100%)`,
        borderLeft: `4px solid ${accent}`,
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a2e", letterSpacing: 0.2 }}>{title}</h3>
      </div>
      <div style={{ padding: "18px 20px" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, span2 }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: span2 ? "span 2" : undefined }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  padding: "9px 12px", borderRadius: 8,
  border: "1px solid #e5e7eb", fontSize: 14,
  background: "#f9fafb", transition: "border 0.15s, box-shadow 0.15s",
  outline: "none",
};

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
      padding: "10px 14px", borderRadius: 10,
      border: `2px solid ${checked ? "#4f7bff" : "#e5e7eb"}`,
      background: checked ? "#eef2ff" : "#f9fafb",
      transition: "all 0.15s", userSelect: "none",
    }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? "#4f7bff" : "#d1d5db"}`,
        background: checked ? "#4f7bff" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: checked ? "#3730a3" : "#374151" }}>{label}</span>
    </label>
  );
}

export default function OrderForm({ onCreated, order: editOrder, onCancel }) {
  const { addOrder, updateOrder, allDepartments, orders, getOrderSteps } = useOrders();
  const { customers, addCustomer } = useCustomers();
  const { pressMachines } = useSettings();
  const { lang } = useLang();
  const tr = t[lang];
  const ar = lang === "ar";
  const deptLabel = (d) => ar ? (stepNames.ar[d] || d) : d;
  const isEdit = !!editOrder;

  const [customerMode, setCustomerMode] = useState("new");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(editOrder?.customerId || null);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) => c.customer_name.toLowerCase().includes(q) || (c.company_name || "").toLowerCase().includes(q),
    );
  }, [customers, customerSearch]);

  const [form, setForm] = useState({
    customerName: editOrder?.customerName || "",
    companyName: editOrder?.companyName || "",
    contactPerson: editOrder?.contactPerson || "",
    phone: editOrder?.phone || "",
    email: editOrder?.email || "",
    address: editOrder?.address || "",
    jobName: editOrder?.jobName || "",
    productType: editOrder?.productType || "",
    quantity: editOrder?.quantity || 1,
    versions: editOrder?.versions || 1,
    printSpecs: editOrder?.printSpecs || "",
    lamination: editOrder?.lamination || "",
    spotUV: editOrder?.spotUV || false,
    emboss: editOrder?.emboss || false,
    foilStamping: editOrder?.foilStamping || false,
    dieCutting: editOrder?.dieCutting || false,
    folding: editOrder?.folding || false,
    binding: editOrder?.binding || "",
    deliveryDate: editOrder?.deliveryDate || "",
    deliveryMethod: editOrder?.deliveryMethod || "Pickup",
    urgent: editOrder?.urgent || "No",
    customerSignature: editOrder?.customerSignature || "",
    signatureDate: editOrder?.signatureDate || "",
    companyRepresentative: editOrder?.companyRepresentative || "",
    departments: editOrder?.departments || [],
    linkedOrderId: editOrder?.linkedOrderId || "",
    linkedReason: editOrder?.linkedReason || "",
    pressProcess: editOrder?.pressProcess || [],
    pressMachine: editOrder?.pressMachine || "",
    numberOfColors: editOrder?.numberOfColors || "",
    pressNotes: editOrder?.pressNotes || "",
  });

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectCustomer = (c) => {
    setSelectedCustomerId(c.id);
    setForm((prev) => ({
      ...prev,
      customerName: c.customer_name, companyName: c.company_name || "",
      contactPerson: c.contact_person || "", phone: c.phone || "",
      email: c.email || "", address: c.address || "",
    }));
    setCustomerSearch(c.customer_name);
    setShowDropdown(false);
  };

  const completedCustomerOrders = useMemo(() => {
    if (!form.customerName.trim()) return [];
    return orders.filter((o) => {
      if ((o.customerName || "").trim() !== form.customerName.trim()) return false;
      const stps = getOrderSteps(o);
      return o.currentStep === stps.length - 1;
    });
  }, [orders, form.customerName, getOrderSteps]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.jobName.trim()) return;

    let customerId = selectedCustomerId;
    if (customerMode === "new" && !isEdit) {
      const newCustomer = await addCustomer({
        customer_name: form.customerName.trim(), company_name: form.companyName.trim(),
        contact_person: form.contactPerson.trim(), phone: form.phone.trim(),
        email: form.email.trim(), address: form.address.trim(),
      });
      if (newCustomer) customerId = newCustomer.id;
    }

    if (isEdit) {
      updateOrder(editOrder.id, { ...form, customerId });
      if (onCreated) onCreated();
      return;
    }

    addOrder({ ...form, customerId });
    setForm({
      customerName: "", companyName: "", contactPerson: "", phone: "", email: "", address: "",
      jobName: "", productType: "", quantity: 1, versions: 1, printSpecs: "",
      lamination: "", spotUV: false, emboss: false, foilStamping: false, dieCutting: false,
      folding: false, binding: "", deliveryDate: "", deliveryMethod: "Pickup", urgent: "No",
      customerSignature: "", signatureDate: "", companyRepresentative: "",
      departments: [], linkedOrderId: "", linkedReason: "",
      pressProcess: [], pressMachine: "", numberOfColors: "", pressNotes: "",
    });
    setCustomerMode("new");
    setCustomerSearch("");
    setSelectedCustomerId(null);
    setShowDropdown(false);
    if (onCreated) onCreated();
  };

  const grid2 = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 };
  const grid3 = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 };

  return (
    <form onSubmit={submit} dir={ar ? "rtl" : "ltr"} style={{ maxWidth: 860, margin: "0 auto" }}>

      {/* ── 1. Customer Information ── */}
      <SectionCard icon="👤" title={tr.customerInformation} accent="#4f7bff">
        {customers.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button type="button"
              onClick={() => setCustomerMode("existing")}
              style={{
                padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: "1px solid #e5e7eb", transition: "all 0.15s",
                background: customerMode === "existing" ? "#4f7bff" : "#f3f4f6",
                color: customerMode === "existing" ? "#fff" : "#374151",
              }}>
              {tr.selectExistingCustomer}
            </button>
            <button type="button"
              onClick={() => { setCustomerMode("new"); setCustomerSearch(""); setSelectedCustomerId(null); setShowDropdown(false); }}
              style={{
                padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: "1px solid #e5e7eb", transition: "all 0.15s",
                background: customerMode === "new" ? "#4f7bff" : "#f3f4f6",
                color: customerMode === "new" ? "#fff" : "#374151",
              }}>
              {tr.newCustomer}
            </button>
          </div>
        )}

        {customerMode === "existing" && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              placeholder={tr.searchCustomer}
              value={customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
            />
            {showDropdown && (
              <ul style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
                maxHeight: 220, overflowY: "auto", margin: "4px 0 0", padding: 0,
                listStyle: "none", boxShadow: "0 8px 24px rgba(0,0,0,.12)",
              }}>
                {filteredCustomers.length === 0 && (
                  <li style={{ padding: "10px 14px", color: "#9ca3af", fontSize: 13 }}>{tr.noMatchingCustomers}</li>
                )}
                {filteredCustomers.map((c) => (
                  <li key={c.id} onMouseDown={() => selectCustomer(c)}
                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{c.customer_name}</span>
                    {c.company_name && <span style={{ fontSize: 12, color: "#9ca3af" }}>{c.company_name}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div style={grid2}>
          <Field label={tr.customerName}><input style={inputStyle} value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} readOnly={customerMode === "existing" && !!selectedCustomerId} /></Field>
          <Field label={tr.companyName}><input style={inputStyle} value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} readOnly={customerMode === "existing" && !!selectedCustomerId} /></Field>
          <Field label={tr.contactPerson}><input style={inputStyle} value={form.contactPerson} onChange={(e) => setField("contactPerson", e.target.value)} readOnly={customerMode === "existing" && !!selectedCustomerId} /></Field>
          <Field label={tr.phone}><input style={inputStyle} value={form.phone} onChange={(e) => setField("phone", e.target.value)} readOnly={customerMode === "existing" && !!selectedCustomerId} /></Field>
          <Field label={tr.email}><input style={inputStyle} value={form.email} onChange={(e) => setField("email", e.target.value)} readOnly={customerMode === "existing" && !!selectedCustomerId} /></Field>
          <Field label={tr.address}><input style={inputStyle} value={form.address} onChange={(e) => setField("address", e.target.value)} readOnly={customerMode === "existing" && !!selectedCustomerId} /></Field>
        </div>

        {form.customerName.trim() && completedCustomerOrders.length > 0 && (
          <div style={{ marginTop: 16, padding: "14px 16px", background: "#f0f4ff", borderRadius: 10, border: "1px solid #c7d7ff", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Field label={tr.linkToPreviousOrder} style={{ flex: 1, minWidth: 200 }}>
              <select style={inputStyle} value={form.linkedOrderId} onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) { setForm((prev) => ({ ...prev, linkedOrderId: "", linkedReason: "" })); return; }
                const linked = orders.find((o) => String(o.id) === String(selectedId));
                if (linked) {
                  setForm((prev) => ({
                    ...prev, linkedOrderId: selectedId,
                    productType: linked.productType || prev.productType, quantity: linked.quantity || prev.quantity,
                    versions: linked.versions || prev.versions, printSpecs: linked.printSpecs || prev.printSpecs,
                    lamination: linked.lamination || prev.lamination, spotUV: linked.spotUV ?? prev.spotUV,
                    emboss: linked.emboss ?? prev.emboss, foilStamping: linked.foilStamping ?? prev.foilStamping,
                    dieCutting: linked.dieCutting ?? prev.dieCutting, folding: linked.folding ?? prev.folding,
                    binding: linked.binding || prev.binding, deliveryMethod: linked.deliveryMethod || prev.deliveryMethod,
                    departments: linked.departments?.length ? linked.departments : prev.departments,
                  }));
                } else { setField("linkedOrderId", selectedId); }
              }}>
                <option value="">{tr.linkNone}</option>
                {completedCustomerOrders.map((o) => <option key={o.id} value={o.id}>#{o.orderNumber} — {o.jobName}</option>)}
              </select>
            </Field>
            {form.linkedOrderId && (
              <Field label={tr.reasonForLinking} style={{ flex: 1, minWidth: 160 }}>
                <select style={inputStyle} value={form.linkedReason} onChange={(e) => setField("linkedReason", e.target.value)}>
                  <option value="">{tr.selectReason}</option>
                  <option value="Reprint">{tr.reason_reprint}</option>
                  <option value="Modify Design">{tr.reason_modifyDesign}</option>
                  <option value="New Version">{tr.reason_newVersion}</option>
                  <option value="Follow-up Order">{tr.reason_followUp}</option>
                  <option value="Color Correction">{tr.reason_colorCorrection}</option>
                  <option value="Other">{tr.reason_other}</option>
                </select>
              </Field>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── 2. Job Details ── */}
      <SectionCard icon="📋" title={tr.jobDetails} accent="#8b5cf6">
        <div style={grid2}>
          <Field label={tr.jobName}><input style={inputStyle} value={form.jobName} onChange={(e) => setField("jobName", e.target.value)} /></Field>
          <Field label={tr.productType}><input style={inputStyle} value={form.productType} onChange={(e) => setField("productType", e.target.value)} /></Field>
          <Field label={tr.qty}><input style={inputStyle} type="number" min="1" value={form.quantity} onChange={(e) => setField("quantity", Number(e.target.value) || 1)} /></Field>
          <Field label={tr.versions}><input style={inputStyle} type="number" min="1" value={form.versions} onChange={(e) => setField("versions", Number(e.target.value) || 1)} /></Field>
        </div>
      </SectionCard>

      {/* ── 3. Print Specifications ── */}
      <SectionCard icon="🖨️" title={tr.printSpecifications} accent="#0ea5e9">
        <Field label={tr.jobDescSpecs}>
          <textarea
            value={form.printSpecs}
            onChange={(e) => setField("printSpecs", e.target.value)}
            placeholder={tr.jobDescPlaceholder}
            rows={5}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
        </Field>
      </SectionCard>

      {/* ── 4. Press Details ── */}
      <SectionCard icon={<img src={pressMachineIcon} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />} title={tr.pressDetails} accent="#f59e0b">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{tr.pressProcess}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {[
              { key: "Digital",         label: tr.pressProcessDigital },
              { key: "Metallic Colors", label: tr.pressProcessMetalic },
              { key: "PANTONE",         label: tr.pressProcessPantone },
              { key: "CMYK",            label: tr.pressProcessCMYK },
            ].map(({ key, label }) => (
              <Checkbox key={key}
                checked={form.pressProcess.includes(key)}
                onChange={(e) => setField("pressProcess", e.target.checked
                  ? [...form.pressProcess, key]
                  : form.pressProcess.filter((p) => p !== key)
                )}
                label={label}
              />
            ))}
          </div>
        </div>

        <div style={grid2}>
          <Field label={tr.pressDetailsPressMachine}>
            <select style={inputStyle} value={form.pressMachine} onChange={(e) => setField("pressMachine", e.target.value)}>
              <option value="">{tr.selectMachineOptional}</option>
              {pressMachines.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </Field>
          <Field label={tr.numberOfColors}>
            <input style={inputStyle} type="number" min="1" max="12" value={form.numberOfColors}
              onChange={(e) => setField("numberOfColors", e.target.value)} placeholder="e.g. 4" />
          </Field>
        </div>

        <div style={{ marginTop: 14 }}>
          <Field label={tr.pressMoreDetails}>
            <textarea value={form.pressNotes} onChange={(e) => setField("pressNotes", e.target.value)}
              placeholder={tr.pressMoreDetailsPlaceholder} rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </Field>
        </div>
      </SectionCard>

      {/* ── 5. Finishing Options ── */}
      <SectionCard icon="✨" title={tr.finishingOptions} accent="#ec4899">
        <div style={grid2}>
          <Field label={tr.lamination}><input style={inputStyle} value={form.lamination} onChange={(e) => setField("lamination", e.target.value)} placeholder={tr.laminationPlaceholder} /></Field>
          <Field label={tr.bindingLabel}><input style={inputStyle} value={form.binding} onChange={(e) => setField("binding", e.target.value)} placeholder={tr.bindingPlaceholder} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 14 }}>
          <Checkbox checked={form.spotUV} onChange={(e) => setField("spotUV", e.target.checked)} label={tr.spotUV} />
          <Checkbox checked={form.emboss} onChange={(e) => setField("emboss", e.target.checked)} label={tr.emboss} />
          <Checkbox checked={form.foilStamping} onChange={(e) => setField("foilStamping", e.target.checked)} label={tr.foilStamping} />
          <Checkbox checked={form.dieCutting} onChange={(e) => setField("dieCutting", e.target.checked)} label={tr.dieCutting} />
          <Checkbox checked={form.folding} onChange={(e) => setField("folding", e.target.checked)} label={tr.folding} />
        </div>
      </SectionCard>

      {/* ── 6. Departments ── */}
      <SectionCard icon="🏭" title={tr.departments} accent="#10b981">
        <p style={{ margin: "0 0 12px", color: "#9ca3af", fontSize: 13 }}>{tr.departmentsSub}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {allDepartments.map((dept) => (
            <Checkbox key={dept}
              checked={form.departments.includes(dept)}
              onChange={(e) => setField("departments", e.target.checked ? [...form.departments, dept] : form.departments.filter((d) => d !== dept))}
              label={deptLabel(dept)}
            />
          ))}
        </div>
      </SectionCard>

      {/* ── 7. Delivery & Deadline ── */}
      <SectionCard icon="🚚" title={tr.deliveryDeadline} accent="#f97316">
        <div style={grid3}>
          <Field label={tr.requiredDeliveryDate}><input style={inputStyle} type="date" value={form.deliveryDate} onChange={(e) => setField("deliveryDate", e.target.value)} /></Field>
          <Field label={tr.deliveryMethod}>
            <select style={inputStyle} value={form.deliveryMethod} onChange={(e) => setField("deliveryMethod", e.target.value)}>
              <option value="Pickup">{tr.deliveryMethodPickup}</option>
              <option value="Delivery">{tr.deliveryMethodDelivery}</option>
            </select>
          </Field>
          <Field label={tr.urgentJob}>
            <select style={inputStyle} value={form.urgent} onChange={(e) => setField("urgent", e.target.value)}>
              <option value="No">{tr.no}</option>
              <option value="Yes">{tr.yes}</option>
            </select>
          </Field>
        </div>
      </SectionCard>

      {/* ── 8. Approval ── */}
      <SectionCard icon="✍️" title={tr.approval} accent="#6366f1">
        <div style={grid3}>
          <Field label={tr.customerSignature}><input style={inputStyle} value={form.customerSignature} onChange={(e) => setField("customerSignature", e.target.value)} /></Field>
          <Field label={tr.date}><input style={inputStyle} type="date" value={form.signatureDate} onChange={(e) => setField("signatureDate", e.target.value)} /></Field>
          <Field label={tr.companyRepresentative}><input style={inputStyle} value={form.companyRepresentative} onChange={(e) => setField("companyRepresentative", e.target.value)} /></Field>
        </div>
      </SectionCard>

      {/* ── Sticky Submit Bar ── */}
      <div style={{
        position: "sticky", bottom: 0, zIndex: 10,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
        borderTop: "1px solid #e5e7eb", padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 10,
        margin: "0 -24px", paddingInline: 24,
        boxShadow: "0 -4px 16px rgba(0,0,0,.06)",
      }}>
        <button type="submit" style={{
          padding: "11px 28px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #4f7bff, #6366f1)",
          color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          boxShadow: "0 4px 12px rgba(79,123,255,0.35)",
        }}>
          {isEdit ? tr.saveChanges : tr.receiveOrder}
        </button>
        {isEdit && onCancel && (
          <button type="button" onClick={onCancel} style={{
            padding: "11px 20px", borderRadius: 10,
            border: "1px solid #e5e7eb", background: "#fff",
            color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>
            {tr.cancel}
          </button>
        )}
        <span style={{ fontSize: 12, color: "#9ca3af", marginInlineStart: "auto" }}>
          * {ar ? "الحقول المطلوبة: اسم العميل، اسم المهمة" : "Required: Customer Name, Job Name"}
        </span>
      </div>

    </form>
  );
}
