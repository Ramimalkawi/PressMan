import React, { useMemo, useState } from "react";
import { useOrders } from "../state/orders";
import { useCustomers } from "../state/customers";

export default function OrderForm({ onCreated, order: editOrder, onCancel }) {
  const { addOrder, updateOrder, allDepartments, orders, getOrderSteps } = useOrders();
  const { customers, addCustomer } = useCustomers();
  const isEdit = !!editOrder;

  const [customerMode, setCustomerMode] = useState("new"); // 'new' | 'existing'
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(editOrder?.customerId || null);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(q) ||
        (c.company_name || "").toLowerCase().includes(q),
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
  });

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectCustomer = (c) => {
    setSelectedCustomerId(c.id);
    setForm((prev) => ({
      ...prev,
      customerName: c.customer_name,
      companyName: c.company_name || "",
      contactPerson: c.contact_person || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
    }));
    setCustomerSearch(c.customer_name);
    setShowDropdown(false);
  };

  // Completed orders for the selected customer (for order linking)
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

    // If new customer mode, create the customer record first
    if (customerMode === "new" && !isEdit) {
      const newCustomer = await addCustomer({
        customer_name: form.customerName.trim(),
        company_name: form.companyName.trim(),
        contact_person: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
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
      customerName: "",
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      jobName: "",
      productType: "",
      quantity: 1,
      versions: 1,
      printSpecs: "",
      lamination: "",
      spotUV: false,
      emboss: false,
      foilStamping: false,
      dieCutting: false,
      folding: false,
      binding: "",
      deliveryDate: "",
      deliveryMethod: "Pickup",
      urgent: "No",
      customerSignature: "",
      signatureDate: "",
      companyRepresentative: "",
      departments: [],
      linkedOrderId: "",
      linkedReason: "",
    });
    setCustomerMode("new");
    setCustomerSearch("");
    setSelectedCustomerId(null);
    setShowDropdown(false);
    if (onCreated) onCreated();
  };

  return (
    <form className="order-form" onSubmit={submit}>
      <div className="form-section">
        <h3>Customer Information</h3>

        {customers.length > 0 && (
          <div className="customer-toggle" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className={`button small ${customerMode === "existing" ? "" : "ghost"}`}
              onClick={() => setCustomerMode("existing")}
            >
              Select Existing Customer
            </button>
            <button
              type="button"
              className={`button small ${customerMode === "new" ? "" : "ghost"}`}
              onClick={() => {
                setCustomerMode("new");
                setCustomerSearch("");
                setSelectedCustomerId(null);
                setShowDropdown(false);
              }}
            >
              + New Customer
            </button>
          </div>
        )}

        {customerMode === "existing" && (
          <div className="customer-picker" style={{ position: "relative", marginBottom: 12 }}>
            <input
              placeholder="Search by customer or company name…"
              value={customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (
              <ul
                className="customer-dropdown"
                style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "var(--bg-card, #fff)", border: "1px solid var(--border, #ddd)",
                  borderRadius: 6, maxHeight: 200, overflowY: "auto",
                  margin: 0, padding: 0, listStyle: "none", boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                }}
              >
                {filteredCustomers.length === 0 && (
                  <li style={{ padding: "8px 12px", color: "var(--text-muted, #888)" }}>
                    No matching customers
                  </li>
                )}
                {filteredCustomers.map((c) => (
                  <li
                    key={c.id}
                    style={{ padding: "8px 12px", cursor: "pointer" }}
                    onMouseDown={() => selectCustomer(c)}
                  >
                    <strong>{c.customer_name}</strong>
                    {c.company_name && (
                      <span style={{ marginLeft: 8, color: "var(--text-muted, #888)" }}>
                        {c.company_name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="form-grid">
          <label>
            Customer Name
            <input
              value={form.customerName}
              onChange={(e) => setField("customerName", e.target.value)}
              readOnly={customerMode === "existing" && !!selectedCustomerId}
            />
          </label>
          <label>
            Company Name
            <input
              value={form.companyName}
              onChange={(e) => setField("companyName", e.target.value)}
              readOnly={customerMode === "existing" && !!selectedCustomerId}
            />
          </label>
          <label>
            Contact Person
            <input
              value={form.contactPerson}
              onChange={(e) => setField("contactPerson", e.target.value)}
              readOnly={customerMode === "existing" && !!selectedCustomerId}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              readOnly={customerMode === "existing" && !!selectedCustomerId}
            />
          </label>
          <label>
            Email
            <input
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              readOnly={customerMode === "existing" && !!selectedCustomerId}
            />
          </label>
          <label>
            Address
            <input
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              readOnly={customerMode === "existing" && !!selectedCustomerId}
            />
          </label>
        </div>

        {form.customerName.trim() && completedCustomerOrders.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label style={{ flex: 1, minWidth: 200 }}>
              Link to a Previous Order
              <select
                value={form.linkedOrderId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) {
                    setForm((prev) => ({ ...prev, linkedOrderId: "", linkedReason: "" }));
                    return;
                  }
                  const linked = orders.find((o) => String(o.id) === String(selectedId));
                  if (linked) {
                    setForm((prev) => ({
                      ...prev,
                      linkedOrderId: selectedId,
                      productType: linked.productType || prev.productType,
                      quantity: linked.quantity || prev.quantity,
                      versions: linked.versions || prev.versions,
                      printSpecs: linked.printSpecs || prev.printSpecs,
                      lamination: linked.lamination || prev.lamination,
                      spotUV: linked.spotUV ?? prev.spotUV,
                      emboss: linked.emboss ?? prev.emboss,
                      foilStamping: linked.foilStamping ?? prev.foilStamping,
                      dieCutting: linked.dieCutting ?? prev.dieCutting,
                      folding: linked.folding ?? prev.folding,
                      binding: linked.binding || prev.binding,
                      deliveryMethod: linked.deliveryMethod || prev.deliveryMethod,
                      departments: linked.departments?.length ? linked.departments : prev.departments,
                    }));
                  } else {
                    setField("linkedOrderId", selectedId);
                  }
                }}
                style={{ marginTop: 4 }}
              >
                <option value="">— None —</option>
                {completedCustomerOrders.map((o) => (
                  <option key={o.id} value={o.id}>#{o.orderNumber} — {o.jobName}</option>
                ))}
              </select>
            </label>
            {form.linkedOrderId && (
              <label style={{ flex: 1, minWidth: 160 }}>
                Reason for Linking
                <select
                  value={form.linkedReason}
                  onChange={(e) => setField("linkedReason", e.target.value)}
                  style={{ marginTop: 4 }}
                >
                  <option value="">— Select reason —</option>
                  <option value="Reprint">Reprint</option>
                  <option value="Modify Design">Modify Design</option>
                  <option value="New Version">New Version</option>
                  <option value="Follow-up Order">Follow-up Order</option>
                  <option value="Color Correction">Color Correction</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            )}
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>Job Details</h3>
        <div className="form-grid">
          <label>
            Job Name / Project Title
            <input value={form.jobName} onChange={(e) => setField("jobName", e.target.value)} />
          </label>
          <label>
            Print Product Type
            <input value={form.productType} onChange={(e) => setField("productType", e.target.value)} />
          </label>
          <label>
            Quantity
            <input type="number" min="1" value={form.quantity} onChange={(e) => setField("quantity", Number(e.target.value) || 1)} />
          </label>
          <label>
            Number of Versions
            <input type="number" min="1" value={form.versions} onChange={(e) => setField("versions", Number(e.target.value) || 1)} />
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Print Specifications</h3>
        <label>
          Job Description & Specifications
          <textarea
            value={form.printSpecs}
            onChange={(e) => setField("printSpecs", e.target.value)}
            placeholder="Describe the print specifications in detail — size, paper, colors, sides, finishing, or any other requirements…"
            rows={6}
            style={{ width: "100%", resize: "vertical", marginTop: 4 }}
          />
        </label>
      </div>

      <div className="form-section">
        <h3>Finishing Options</h3>
        <div className="form-grid">
          <label>
            Lamination (Matte / Gloss)
            <input value={form.lamination} onChange={(e) => setField("lamination", e.target.value)} placeholder="Matte / Gloss" />
          </label>
          <label>
            Binding (Perfect / Spiral / Saddle)
            <input value={form.binding} onChange={(e) => setField("binding", e.target.value)} placeholder="Perfect / Spiral / Saddle" />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.spotUV} onChange={(e) => setField("spotUV", e.target.checked)} />
            Spot UV
          </label>
          <label className="check">
            <input type="checkbox" checked={form.emboss} onChange={(e) => setField("emboss", e.target.checked)} />
            Emboss
          </label>
          <label className="check">
            <input type="checkbox" checked={form.foilStamping} onChange={(e) => setField("foilStamping", e.target.checked)} />
            Foil Stamping
          </label>
          <label className="check">
            <input type="checkbox" checked={form.dieCutting} onChange={(e) => setField("dieCutting", e.target.checked)} />
            Die Cutting
          </label>
          <label className="check">
            <input type="checkbox" checked={form.folding} onChange={(e) => setField("folding", e.target.checked)} />
            Folding
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Departments</h3>
        <p style={{ margin: "0 0 0.5rem", color: "var(--text-muted, #888)", fontSize: "0.85rem" }}>
          Select the departments that will work on this order.
        </p>
        <div className="form-grid">
          {allDepartments.map((dept) => (
            <label className="check" key={dept}>
              <input
                type="checkbox"
                checked={form.departments.includes(dept)}
                onChange={(e) => {
                  setField("departments", e.target.checked
                    ? [...form.departments, dept]
                    : form.departments.filter((d) => d !== dept));
                }}
              />
              {dept}
            </label>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3>Delivery & Deadline</h3>
        <div className="form-grid">
          <label>
            Required Delivery Date
            <input type="date" value={form.deliveryDate} onChange={(e) => setField("deliveryDate", e.target.value)} />
          </label>
          <label>
            Delivery Method (Pickup / Delivery)
            <select value={form.deliveryMethod} onChange={(e) => setField("deliveryMethod", e.target.value)}>
              <option>Pickup</option>
              <option>Delivery</option>
            </select>
          </label>
          <label>
            Urgent Job (Yes / No)
            <select value={form.urgent} onChange={(e) => setField("urgent", e.target.value)}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Approval</h3>
        <div className="form-grid">
          <label>
            Customer Signature
            <input value={form.customerSignature} onChange={(e) => setField("customerSignature", e.target.value)} />
          </label>
          <label>
            Date
            <input type="date" value={form.signatureDate} onChange={(e) => setField("signatureDate", e.target.value)} />
          </label>
          <label>
            Company Representative
            <input value={form.companyRepresentative} onChange={(e) => setField("companyRepresentative", e.target.value)} />
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit">{isEdit ? "Save Changes" : "Receive Order"}</button>
        {isEdit && onCancel && (
          <button type="button" className="button ghost" onClick={onCancel} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
