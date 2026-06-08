import React, { createContext, useContext, useState } from "react";

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");

  const toggle = () => setLang((l) => {
    const next = l === "en" ? "ar" : "en";
    localStorage.setItem("lang", next);
    return next;
  });

  return (
    <LangContext.Provider value={{ lang, toggle }}>
      <div dir={lang === "ar" ? "rtl" : "ltr"}>
        {children}
      </div>
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
