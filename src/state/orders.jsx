import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./auth";

const steps = [
  "Received",
  "Design",
  "Prepress",
  "Press",
  "Postpress",
  "Delivery",
  "Completed",
];
const allDepartments = ["Design", "Prepress", "Press", "Postpress", "Delivery"];

function getOrderSteps(order) {
  if (Array.isArray(order.departments) && order.departments.length > 0) {
    const middle = allDepartments.filter((d) => order.departments.includes(d));
    return ["Received", ...middle, "Completed"];
  }
  return steps;
}

// Build stepStatuses from legacy currentStep for backward compat
export function getStepStatuses(order, orderSteps) {
  if (order.stepStatuses) return order.stepStatuses;
  const statuses = {};
  for (let i = 0; i < orderSteps.length; i++) {
    if (i < order.currentStep) statuses[i] = "completed";
    else if (i === order.currentStep) statuses[i] = "active";
    else statuses[i] = "pending";
  }
  return statuses;
}

const OrdersContext = createContext();

export function OrdersProvider({ children }) {
  const { orgId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data.map((row) => ({
          id: row.id,
          ...row.data,
          orderNumber: row.order_number,
          customerId: row.customer_id ?? row.data?.customerId ?? null,
        })));
      }
      setLoading(false);
    };
    fetchOrders();
  }, [orgId]);

  const nextOrderNumber = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.rpc("increment_order_counter", { uid: user.id });
    if (error) {
      const { data: rows } = await supabase.from("orders").select("order_number").eq("organization_id", orgId).order("order_number", { ascending: false }).limit(1);
      return rows?.[0]?.order_number ? rows[0].order_number + 1 : 1;
    }
    return data;
  };

  const addOrder = async (order) => {
    const { data: { user } } = await supabase.auth.getUser();
    const orderNumber = await nextOrderNumber();
    const id = Date.now();
    const orderSteps = getOrderSteps(order);

    // Initialize stepStatuses: Received is active, rest pending
    const stepStatuses = {};
    orderSteps.forEach((_, i) => { stepStatuses[i] = i === 0 ? "active" : "pending"; });

    const wrapped = {
      customerName: order.customerName || order.customer || "",
      jobName: order.jobName || order.product || "",
      quantity: order.quantity || order.qty || 1,
      ...order,
      id,
      orderNumber,
      currentStep: 0,
      stepStatuses,
      orderSignToken: crypto.randomUUID(),
      history: [{ step: 0, ts: Date.now(), action: "activated" }],
    };

    const { error } = await supabase.from("orders").insert({
      id,
      order_number: orderNumber,
      data: wrapped,
      user_id: user.id,
      customer_id: order.customerId || null,
      organization_id: orgId,
    });

    if (!error) setOrders((prev) => [wrapped, ...prev]);
  };

  const updateOrder = async (id, changes) => {
    const existing = orders.find((o) => o.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changes };
    const { error } = await supabase
      .from("orders")
      .update({ data: updated, customer_id: changes.customerId ?? existing.customerId ?? null })
      .eq("id", id);
    if (!error) setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  };

  // Pass order to next step — current step stays active (overlap allowed)
  const activateNextStep = async (id, fromStepIndex, pressMachine) => {
    const existing = orders.find((o) => o.id === id);
    if (!existing) return;

    const orderSteps = getOrderSteps(existing);
    const nextIndex = fromStepIndex + 1;
    if (nextIndex >= orderSteps.length) return;

    const statuses = getStepStatuses(existing, orderSteps);
    if (statuses[nextIndex] !== "pending") return;

    const newStatuses = { ...statuses, [nextIndex]: "active" };

    const historyEntry = { step: nextIndex, ts: Date.now(), action: "activated" };
    if (pressMachine) historyEntry.pressMachine = pressMachine;

    const updated = {
      ...existing,
      currentStep: nextIndex, // track furthest activated step
      stepStatuses: newStatuses,
      history: [...(existing.history || []), historyEntry],
    };
    if (pressMachine) updated.pressMachine = pressMachine;

    const { error } = await supabase.from("orders").update({ data: updated }).eq("id", id);
    if (!error) setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  };

  // Complete a specific step — marks it done, order completes when all steps done
  const completeStep = async (id, stepIndex, notes, pressMachine) => {
    const existing = orders.find((o) => o.id === id);
    if (!existing) return;

    const orderSteps = getOrderSteps(existing);
    const statuses = getStepStatuses(existing, orderSteps);
    if (statuses[stepIndex] !== "active") return;

    const historyEntry = { step: stepIndex, ts: Date.now(), action: "completed" };
    if (notes?.trim()) historyEntry.notes = notes.trim();
    if (pressMachine) historyEntry.pressMachine = pressMachine;

    const newStatuses = { ...statuses, [stepIndex]: "completed" };

    // Auto-activate the next step if it hasn't been passed yet
    // If the next step is the last ("Completed"), mark it completed immediately
    const nextIndex = stepIndex + 1;
    const historyEntries = [historyEntry];
    if (nextIndex < orderSteps.length && newStatuses[nextIndex] === "pending") {
      const isLastStep = nextIndex === orderSteps.length - 1;
      newStatuses[nextIndex] = isLastStep ? "completed" : "active";
      historyEntries.push({ step: nextIndex, ts: Date.now(), action: isLastStep ? "completed" : "activated" });
    }

    const allDone = orderSteps.every((_, i) => newStatuses[i] === "completed");

    const updated = {
      ...existing,
      stepStatuses: newStatuses,
      currentStep: allDone ? orderSteps.length - 1 : Math.max(existing.currentStep, nextIndex < orderSteps.length ? nextIndex : stepIndex),
      history: [...(existing.history || []), ...historyEntries],
    };
    if (pressMachine) updated.pressMachine = pressMachine;

    const { error } = await supabase.from("orders").update({ data: updated }).eq("id", id);
    if (!error) setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  };

  // Log a partial or full delivery without completing the step
  const logDelivery = async (id, { quantityDelivered, boxes, invoiceNumber, notes }) => {
    const existing = orders.find((o) => o.id === id);
    if (!existing) return;

    const orderSteps = getOrderSteps(existing);
    const deliveryStepIdx = orderSteps.indexOf("Delivery");

    const entry = {
      id: Date.now(),
      ts: Date.now(),
      signToken: crypto.randomUUID(),
      quantityDelivered: Number(quantityDelivered) || 0,
      boxes: boxes ? Number(boxes) : null,
      invoiceNumber: invoiceNumber?.trim() || null,
      notes: notes?.trim() || null,
    };

    const historyEntry = {
      step: deliveryStepIdx,
      ts: entry.ts,
      action: "delivery_logged",
      quantityDelivered: entry.quantityDelivered,
      ...(entry.boxes && { boxes: entry.boxes }),
      ...(entry.invoiceNumber && { invoiceNumber: entry.invoiceNumber }),
      ...(entry.notes && { notes: entry.notes }),
    };

    const updated = {
      ...existing,
      deliveries: [...(existing.deliveries || []), entry],
      history: [...(existing.history || []), historyEntry],
    };

    const { error } = await supabase.from("orders").update({ data: updated }).eq("id", id);
    if (!error) setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  };

  // Keep advanceStep for any legacy calls — maps to activateNextStep
  const advanceStep = (id, notes, pressMachine) => {
    const existing = orders.find((o) => o.id === id);
    if (!existing) return;
    const orderSteps = getOrderSteps(existing);
    const statuses = getStepStatuses(existing, orderSteps);
    // Find the highest active step to advance from
    let fromIndex = existing.currentStep;
    for (let i = orderSteps.length - 1; i >= 0; i--) {
      if (statuses[i] === "active") { fromIndex = i; break; }
    }
    activateNextStep(id, fromIndex, pressMachine);
  };

  return (
    <OrdersContext.Provider value={{
      orders, loading, addOrder, updateOrder,
      activateNextStep, completeStep, advanceStep, logDelivery,
      steps, allDepartments, getOrderSteps, getStepStatuses,
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrders = () => useContext(OrdersContext);
