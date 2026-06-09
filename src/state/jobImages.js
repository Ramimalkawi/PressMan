import { useCallback } from "react";
import { supabase } from "../lib/supabase";

// Stores job images directly in the order's data JSON field.
// This keeps images alongside all other order data so they persist reliably.
export function useJobImages() {
  const getJobImage = useCallback(async (orderId) => {
    const { data: row, error } = await supabase
      .from("orders")
      .select("data")
      .eq("id", orderId)
      .single();
    if (error || !row) return null;
    return row.data?.jobImage || null;
  }, []);

  const setJobImage = useCallback(async (orderId, dataUrl) => {
    const { data: row, error } = await supabase
      .from("orders")
      .select("data")
      .eq("id", orderId)
      .single();
    if (error || !row) return;
    const updated = { ...row.data, jobImage: dataUrl };
    await supabase.from("orders").update({ data: updated }).eq("id", orderId);
  }, []);

  const removeJobImage = useCallback(async (orderId) => {
    const { data: row, error } = await supabase
      .from("orders")
      .select("data")
      .eq("id", orderId)
      .single();
    if (error || !row) return;
    const updated = { ...row.data };
    delete updated.jobImage;
    await supabase.from("orders").update({ data: updated }).eq("id", orderId);
  }, []);

  return { getJobImage, setJobImage, removeJobImage };
}
