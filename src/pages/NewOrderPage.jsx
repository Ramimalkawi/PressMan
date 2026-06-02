import React from "react";
import { Link, useNavigate } from "react-router-dom";
import OrderForm from "../components/OrderForm";

export default function NewOrderPage() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>New Order</h2>
          <p>Fill in all details from the print order form.</p>
        </div>
        <div className="page-actions">
          <Link to="/orders" className="button ghost">
            Back to Orders
          </Link>
        </div>
      </div>

      <section className="panel">
        <OrderForm onCreated={() => navigate("/orders")} />
      </section>
    </div>
  );
}
