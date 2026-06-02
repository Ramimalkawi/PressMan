import React from "react";
import { Link } from "react-router-dom";
import { useCustomers } from "../state/customers";
import { useOrders } from "../state/orders";

export default function CustomersPage() {
  const { customers, loading } = useCustomers();
  const { orders } = useOrders();

  const orderCountFor = (customerId) =>
    orders.filter((o) => o.customerId === customerId).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p>All customers in the system.</p>
        </div>
      </div>

      <section className="panel">
        {loading && <p>Loading…</p>}
        {!loading && customers.length === 0 && <p>No customers yet.</p>}
        <ul className="list">
          {customers.map((c) => (
            <li key={c.id} className="list-row">
              <div>
                <Link
                  to={`/customers/${c.id}`}
                  style={{ fontWeight: 600, color: "var(--accent)" }}
                >
                  {c.customer_name}
                </Link>
                {c.company_name && (
                  <span style={{ marginLeft: 8, color: "var(--text-muted,#888)", fontSize: 13 }}>
                    {c.company_name}
                  </span>
                )}
              </div>
              <span className="muted">{orderCountFor(c.id)} orders</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
