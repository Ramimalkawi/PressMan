import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import OrderTimeline from "../components/OrderTimeline";
import { useOrders, getStepStatuses } from "../state/orders";
import { useLang } from "../state/lang";
import { t } from "../utils/translations";

const SORT_OPTIONS = [
  { value: "newest",   label: "Newest First" },
  { value: "oldest",   label: "Oldest First" },
  { value: "order_asc",  label: "Order # ↑" },
  { value: "order_desc", label: "Order # ↓" },
  { value: "name_asc",   label: "Job Name A–Z" },
  { value: "name_desc",  label: "Job Name Z–A" },
  { value: "customer",   label: "Customer A–Z" },
  { value: "delivery",   label: "Delivery Date ↑" },
];

const SORT_OPTIONS_AR = [
  { value: "newest",     label: "الأحدث أولاً" },
  { value: "oldest",     label: "الأقدم أولاً" },
  { value: "order_asc",  label: "رقم الطلب ↑" },
  { value: "order_desc", label: "رقم الطلب ↓" },
  { value: "name_asc",   label: "اسم المهمة أ–ي" },
  { value: "name_desc",  label: "اسم المهمة ي–أ" },
  { value: "customer",   label: "العميل أ–ي" },
  { value: "delivery",   label: "تاريخ التسليم ↑" },
];

const STATUS_FILTERS = [
  { value: "all",       labelEn: "All",       labelAr: "الكل" },
  { value: "active",    labelEn: "Active",    labelAr: "نشط" },
  { value: "completed", labelEn: "Completed", labelAr: "مكتمل" },
];

function getOrderStatus(order, getOrderSteps) {
  const steps = getOrderSteps(order);
  const statuses = getStepStatuses(order, steps);
  if (statuses[steps.length - 1] === "completed") return "completed";
  return "active";
}

export default function OrdersPage() {
  const { orders, getOrderSteps } = useOrders();
  const { lang } = useLang();
  const tr = t[lang];
  const ar = lang === "ar";

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");

  const sortOptions = ar ? SORT_OPTIONS_AR : SORT_OPTIONS;

  const filtered = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((o) => getOrderStatus(o, getOrderSteps) === statusFilter);
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((o) =>
        [o.jobName, o.customerName, o.companyName, String(o.orderNumber), o.productType]
          .some((v) => v?.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":     return (b.history?.[0]?.ts || 0) - (a.history?.[0]?.ts || 0);
        case "oldest":     return (a.history?.[0]?.ts || 0) - (b.history?.[0]?.ts || 0);
        case "order_asc":  return (a.orderNumber || 0) - (b.orderNumber || 0);
        case "order_desc": return (b.orderNumber || 0) - (a.orderNumber || 0);
        case "name_asc":   return (a.jobName || "").localeCompare(b.jobName || "");
        case "name_desc":  return (b.jobName || "").localeCompare(a.jobName || "");
        case "customer":   return (a.customerName || "").localeCompare(b.customerName || "");
        case "delivery":   return new Date(a.deliveryDate || 0) - new Date(b.deliveryDate || 0);
        default:           return 0;
      }
    });

    return result;
  }, [orders, search, sortBy, statusFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{tr.page_orders}</h2>
          <p>{ar ? "جميع الطلبات مع مسار المراحل الكاملة." : "All orders with full stage timeline."}</p>
        </div>
        <div className="page-actions">
          <Link to="/orders/new" className="button">
            {tr.newOrder}
          </Link>
        </div>
      </div>

      {/* Search & filters bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", top: "50%", [ar ? "right" : "left"]: 11, transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ar ? "بحث في الطلبات…" : "Search orders…"}
            style={{
              width: "100%", padding: ar ? "9px 34px 9px 12px" : "9px 12px 9px 34px",
              borderRadius: 10, border: "1px solid var(--border, #e5e7eb)",
              fontSize: 14, background: "#fff", boxSizing: "border-box",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", top: "50%", [ar ? "left" : "right"]: 8,
                transform: "translateY(-50%)", background: "none", border: "none",
                color: "#9ca3af", cursor: "pointer", padding: "2px 4px", fontSize: 16, lineHeight: 1,
              }}
            >×</button>
          )}
        </div>

        {/* Status filter pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: "1px solid var(--border, #e5e7eb)", cursor: "pointer",
                background: statusFilter === s.value ? "var(--accent, #2b6ef6)" : "#fff",
                color: statusFilter === s.value ? "#fff" : "var(--text, #374151)",
              }}
            >
              {ar ? s.labelAr : s.labelEn}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border, #e5e7eb)",
            fontSize: 13, background: "#fff", color: "var(--text, #374151)",
            fontWeight: 500, cursor: "pointer",
          }}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      {(search || statusFilter !== "all") && (
        <p style={{ fontSize: 13, color: "var(--text-muted, #888)", marginBottom: 10 }}>
          {filtered.length} {ar ? "طلب" : filtered.length === 1 ? "order" : "orders"} {ar ? "موجود" : "found"}
          {search && <span> {ar ? "لـ" : "for"} "<strong>{search}</strong>"</span>}
        </p>
      )}

      <section className="panel">
        {filtered.length === 0 && (
          <p style={{ color: "var(--text-muted, #888)", padding: "8px 0" }}>
            {ar ? "لا توجد طلبات مطابقة." : "No orders found."}
          </p>
        )}
        {filtered.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="order-link">
            <OrderTimeline order={o} />
          </Link>
        ))}
      </section>
    </div>
  );
}
