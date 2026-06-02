import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./auth";

const CustomersContext = createContext();

export function CustomersProvider({ children }) {
  const { orgId } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", orgId)
        .order("customer_name");
      if (!error && data) setCustomers(data);
      setLoading(false);
    };
    fetch();
  }, [orgId]);

  const addCustomer = async (fields) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("customers")
      .insert({ ...fields, user_id: user.id, organization_id: orgId })
      .select()
      .single();
    if (!error && data) {
      setCustomers((prev) => [...prev, data].sort((a, b) => a.customer_name.localeCompare(b.customer_name)));
      return data;
    }
    return null;
  };

  const updateCustomer = async (id, fields) => {
    const { error } = await supabase.from("customers").update(fields).eq("id", id);
    if (!error) {
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...fields } : c)));
    }
  };

  const getCustomerById = (id) => customers.find((c) => c.id === id) || null;

  return (
    <CustomersContext.Provider value={{ customers, loading, addCustomer, updateCustomer, getCustomerById }}>
      {children}
    </CustomersContext.Provider>
  );
}

export const useCustomers = () => useContext(CustomersContext);
