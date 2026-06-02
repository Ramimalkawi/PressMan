import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCustomers } from "../state/customers";
import { useOrders } from "../state/orders";
import OrderTimeline from "../components/OrderTimeline";

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const { getCustomerById, updateCustomer } = useCustomers();
  const { orders } = useOrders();

  const customer = getCustomerById(Number(id));
  const customerOrders = useMemo(
    () => orders.filter((o) => o.customerId === Number(id)),
    [orders, id],
  );

  console.log(customerOrders, "The customer orders");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const startEdit = () => {
    setForm({
      customer_name: customer.customer_name || "",
      company_name: customer.company_name || "",
      contact_person: customer.contact_person || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setEditing(true);
  };

  const save = async () => {
    await updateCustomer(customer.id, form);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  if (!customer) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Customer Not Found</h2>
          </div>
          <div className="page-actions">
            <Link to="/customers" className="button ghost">
              Back to Customers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{customer.customer_name}</h2>
          <p>
            {customerOrders.length} order
            {customerOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="page-actions">
          <Link to="/customers" className="button ghost">
            Back to Customers
          </Link>
        </div>
      </div>

      <section className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>Customer Information</h3>
          {!editing && (
            <button className="button small" onClick={startEdit}>
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="detail-card">
            {[
              ["Customer Name", "customer_name"],
              ["Company Name", "company_name"],
              ["Contact Person", "contact_person"],
              ["Phone", "phone"],
              ["Email", "email"],
              ["Address", "address"],
            ].map(([label, key]) => (
              <label
                key={key}
                style={{ display: "block", marginBottom: 10, fontSize: 13 }}
              >
                {label}
                <input
                  style={{ width: "100%", marginTop: 4 }}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
              </label>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" onClick={save}>
                Save
              </button>
              <button type="button" className="button ghost" onClick={cancel}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-grid">
            <section className="detail-card">
              <div className="detail-row">
                <span>Company Name</span>
                <strong>{customer.company_name || "—"}</strong>
              </div>
              <div className="detail-row">
                <span>Contact Person</span>
                <strong>{customer.contact_person || "—"}</strong>
              </div>
              <div className="detail-row">
                <span>Phone</span>
                <strong>{customer.phone || "—"}</strong>
              </div>
              <div className="detail-row">
                <span>Email</span>
                <strong>{customer.email || "—"}</strong>
              </div>
              <div className="detail-row">
                <span>Address</span>
                <strong>{customer.address || "—"}</strong>
              </div>
            </section>
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <h3 style={{ margin: "0 0 14px 0" }}>Orders</h3>
        {customerOrders.length === 0 && <p>No orders for this customer.</p>}
        {customerOrders.map((order) => (
          <div key={order.id} style={{ marginBottom: 18 }}>
            <OrderTimeline order={order} />
            <div style={{ marginTop: 6 }}>
              <Link to={`/orders/${order.id}`} className="button small ghost">
                View Order Details
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
