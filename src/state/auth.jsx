import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null); // { full_name, role, department, organization_id }
  const [organization, setOrganization] = useState(null); // { id, name }

  const loadProfile = async (userId) => {
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, role, department, organization_id")
      .eq("id", userId)
      .single();

    setProfile(prof || null);

    if (prof?.organization_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("id", prof.organization_id)
        .single();
      setOrganization(org || null);
    } else {
      setOrganization(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session ?? null;
      setSession(s);
      if (s) loadProfile(s.user.id);
      else { setProfile(null); setOrganization(null); }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const s = session ?? null;
      setSession(s);
      if (s) loadProfile(s.user.id);
      else { setProfile(null); setOrganization(null); }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password });

  const signOut = () => supabase.auth.signOut();

  const isAdmin = profile?.role === "admin";
  const isPressAdmin = profile?.role === "press_admin";
  const isStaff = profile?.role === "staff";
  const canManage = isAdmin || isPressAdmin;
  const orgId = profile?.organization_id ?? null;

  return (
    <AuthContext.Provider value={{
      session, profile, organization, isAdmin, isPressAdmin, isStaff, canManage, orgId,
      signIn, signUp, signOut, reloadProfile: () => session && loadProfile(session.user.id),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
