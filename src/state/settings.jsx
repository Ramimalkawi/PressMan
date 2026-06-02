import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./auth";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const { orgId } = useAuth();
  const [pressMachines, setPressMachines] = useState([]);
  const [companyName, setCompanyNameState] = useState("Pressman Print Shop");
  const [companyLogo, setCompanyLogoState] = useState("");

  useEffect(() => {
    if (!orgId) return;
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("organization_id", orgId)
        .single();

      if (!error && data) {
        setPressMachines(data.press_machines || []);
        setCompanyNameState(data.company_name || "Pressman Print Shop");
        setCompanyLogoState(data.company_logo || "");
      }
    };
    fetchSettings();
  }, [orgId]);

  const saveSettings = async (patch) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("settings").upsert({
      user_id: user.id,
      organization_id: orgId,
      company_name: patch.companyName ?? companyName,
      company_logo: patch.companyLogo ?? companyLogo,
      press_machines: patch.pressMachines ?? pressMachines,
    });
  };

  const setCompanyName = async (name) => {
    setCompanyNameState(name);
    await saveSettings({ companyName: name });
  };

  const setCompanyLogo = async (logo) => {
    setCompanyLogoState(logo);
    await saveSettings({ companyLogo: logo });
  };

  const addPressMachine = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = [...pressMachines, { id: Date.now(), name: trimmed }];
    setPressMachines(updated);
    await saveSettings({ pressMachines: updated });
  };

  const removePressMachine = async (id) => {
    const updated = pressMachines.filter((m) => m.id !== id);
    setPressMachines(updated);
    await saveSettings({ pressMachines: updated });
  };

  const updatePressMachine = async (id, name) => {
    const updated = pressMachines.map((m) =>
      m.id === id ? { ...m, name: name.trim() } : m
    );
    setPressMachines(updated);
    await saveSettings({ pressMachines: updated });
  };

  return (
    <SettingsContext.Provider value={{
      pressMachines, addPressMachine, removePressMachine, updatePressMachine,
      companyName, setCompanyName, companyLogo, setCompanyLogo,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
