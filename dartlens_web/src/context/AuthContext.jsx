import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchWithMock } from "../services/mockApi";
import { authApi } from "../services/api";

// Check if we should use mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// Create the authentication context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 *
 * Wraps the application to provide authentication context to all children.
 *
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Child components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // Loading flag for initial session check

  /**
   * Refresh user session from server
   *
   * Calls the /api/auth/me endpoint to verify current session
   * and retrieve user information.
   */
  const refresh = useCallback(async () => {
    try {
      if (USE_MOCK_API) {
        const response = await fetchWithMock("/api/auth/me", { credentials: "include" });
        if (!response.ok) {
          setUser(null);
        } else {
          const data = await response.json();
          setUser(data?.user || null);
        }
      } else {
        const data = await authApi.getCurrentUser();
        setUser(data?.user || null);
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  /**
   * Initialize authentication state on component mount
   *
   * Checks for existing session via cookie and loads user data
   */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Callback to run after successful login
   *
   * Refreshes the session to immediately reflect logged-in state
   */
  const afterLogin = useCallback(async () => {
    setReady(false);
    await refresh();
  }, [refresh]);

  /**
   * Logout the current user
   *
   * Calls logout endpoint and clears local user state
   */
  const logout = useCallback(async () => {
    try {
      if (USE_MOCK_API) {
        await fetchWithMock("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } else {
        await authApi.logout();
      }
      alert("로그아웃 되었습니다.");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  }, []);

  // Context value provided to consuming components
  const value = {
    user,                    // Current user object
    isLoggedIn: !!user,      // Boolean login status
    ready,                   // Loading state flag
    refresh,                 // Manual session refresh
    afterLogin,              // Post-login callback
    logout,                  // Logout function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 *
 * Custom hook to access authentication context.
 * Must be used within AuthProvider.
 *
 * @returns {object} Authentication context value
 * @throws {Error} If used outside AuthProvider
 *
 * @example
 * const { isLoggedIn, user, logout } = useAuth();
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
