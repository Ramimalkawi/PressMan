import React from "react";
import { Link } from "react-router-dom";
import OrderTimeline from "../components/OrderTimeline";
import { useOrders } from "../state/orders";
import { useLang } from "../state/lang";
import { t } from "../utils/translations";

export default function OrdersPage() {
  const { orders } = useOrders();
  const { lang } = useLang();
  const tr = t[lang];
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{tr.page_orders}</h2>
          <p>{lang === "ar" ? "جميع الطلبات مع مسار المراحل الكاملة." : "All orders with full stage timeline."}</p>
        </div>
        <div className="page-actions">
          <Link to="/orders/new" className="button">
            {tr.newOrder}
          </Link>
        </div>
      </div>

      <section className="panel">
        {orders.length === 0 && <p>{tr.noOrdersFound}</p>}
        {orders.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="order-link">
            <OrderTimeline order={o} />
          </Link>
        ))}
      </section>
    </div>
  );
}
