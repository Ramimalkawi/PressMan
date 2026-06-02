import React, { useState } from "react";
import { useOrders } from "../state/orders";
import OrderDetails from "./OrderDetails";

export default function OrderList() {
  const { orders } = useOrders();
  return (
    <div className="order-list">
      <h2>Orders</h2>
      {orders.length === 0 && <p>No orders yet.</p>}
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
    </div>
  );
}

function OrderCard({ order }) {
  const [open, setOpen] = useState(false);
  const { getOrderSteps } = useOrders();
  const orderSteps = getOrderSteps(order);
  const percent = Math.round(
    (order.currentStep / (orderSteps.length - 1)) * 100,
  );
  return (
    <div className="order-card">
      <div className="order-head">
        <div className="title">
          {order.product} — {order.customer}
        </div>
        <div className="meta">Qty: {order.qty}</div>
      </div>
      <div className="progress">
        <div className="bar" style={{ width: `${percent}%` }} />
      </div>
      <div className="order-actions">
        <button onClick={() => setOpen((s) => !s)}>
          {open ? "Hide" : "Details"}
        </button>
      </div>
      {open && <OrderDetails order={order} />}
    </div>
  );
}
