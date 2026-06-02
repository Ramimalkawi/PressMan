import React from "react";
import { Link, useParams } from "react-router-dom";
import { useOrders } from "../state/orders";
import OrderDetails from "../components/OrderDetails";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { orders } = useOrders();
  const order = orders.find((o) => String(o.id) === String(id));

  if (!order) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Order Not Found</h2>
            <p>The order you are looking for does not exist.</p>
          </div>
          <div className="page-actions">
            <Link to="/orders" className="button ghost">
              Back to Orders
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
          <h2>Order Details</h2>
          <p>
            {order.jobName} — {order.customerName}
          </p>
        </div>
        <div className="page-actions">
          <Link to="/orders" className="button ghost">
            Back to Orders
          </Link>
        </div>
      </div>

      <section className="panel">
        <OrderDetails order={order} />
      </section>
    </div>
  );
}
