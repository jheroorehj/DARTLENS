import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Create the selection context
const SelectionContext = createContext(null);

/**
 * SelectionProvider Component
 *
 * Wraps the application to provide corporation selection context.
 *
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Child components
 */
export function SelectionProvider({ children }) {
  const [selectedCorp, setSelectedCorp] = useState(() => {
    try {
      return sessionStorage.getItem("selectedCorp") || "";
    } catch (error) {
      console.error("Failed to read from sessionStorage:", error);
      return "";
    }
  });

  useEffect(() => {
    try {
      if (selectedCorp) {
        sessionStorage.setItem("selectedCorp", selectedCorp);
      } else {
        sessionStorage.removeItem("selectedCorp");
      }
    } catch (error) {
      console.error("Failed to write to sessionStorage:", error);
    }
  }, [selectedCorp]);

  const value = useMemo(
    () => ({
      selectedCorp,                                    // Currently selected corp code
      selectCorp: (code) => setSelectedCorp(String(code || "")), // Select a corporation
      clearCorp: () => setSelectedCorp(""),            // Clear selection
    }),
    [selectedCorp]
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);

  if (!context) {
    throw new Error("useSelection must be used within SelectionProvider");
  }

  return context;
}
