import React from "react";
import { Link } from "react-router-dom";
import OrderTimeline from "../components/OrderTimeline";
import { useOrders } from "../state/orders";

export default function OrdersPage() {
  const { orders } = useOrders();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p>All orders with full stage timeline.</p>
        </div>
        <div className="page-actions">
          <Link to="/orders/new" className="button">
            Create New Order
          </Link>
        </div>
      </div>

      <section className="panel">
        {orders.length === 0 && <p>No orders yet.</p>}
        {orders.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="order-link">
            <OrderTimeline order={o} />
          </Link>
        ))}
      </section>
    </div>
  );
}
