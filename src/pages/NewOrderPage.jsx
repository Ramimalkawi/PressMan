import React from "react";
import { Link, useNavigate } from "react-router-dom";
import OrderForm from "../components/OrderForm";
import { useLang } from "../state/lang";
import { t } from "../utils/translations";

export default function NewOrderPage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const tr = t[lang];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{tr.page_newOrder}</h2>
          <p>{tr.page_newOrder_sub}</p>
        </div>
        <div className="page-actions">
          <Link to="/orders" className="button ghost">
            {tr.backToOrders}
          </Link>
        </div>
      </div>

      <section className="panel">
        <OrderForm onCreated={() => navigate("/orders")} />
      </section>
    </div>
  );
}
