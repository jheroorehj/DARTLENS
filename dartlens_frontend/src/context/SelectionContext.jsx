import { createContext, useContext, useEffect, useMemo, useState } from "react";

const SelectionCtx = createContext(null);

export function SelectionProvider({ children }) {
  // 세션 유지 원하면 sessionStorage 사용
  const [selectedCorp, setSelectedCorp] = useState(() => {
    try { return sessionStorage.getItem("selectedCorp") || ""; } catch { return ""; }
  });

  useEffect(() => {
    try {
      if (selectedCorp) sessionStorage.setItem("selectedCorp", selectedCorp);
      else sessionStorage.removeItem("selectedCorp");
    } catch {}
  }, [selectedCorp]);

  const value = useMemo(() => ({
    selectedCorp,
    selectCorp: (cc) => setSelectedCorp(String(cc || "")),
    clearCorp: () => setSelectedCorp(""),
  }), [selectedCorp]);

  return <SelectionCtx.Provider value={value}>{children}</SelectionCtx.Provider>;
}

export function useSelection() {
  const v = useContext(SelectionCtx);
  if (!v) throw new Error("useSelection must be used within SelectionProvider");
  return v;
}
