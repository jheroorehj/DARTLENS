// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // 초기 로딩 완료 플래그

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
      } else {
        const data = await res.json();
        setUser(data?.user || null);
      }
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    // 앱 시작 시 쿠키 기반 세션 확인
    refresh();
  }, [refresh]);

  const afterLogin = useCallback(async () => {
    // 로그인 성공 직후 세션 재조회로 즉시 반영
    setReady(false);
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      alert("로그아웃 되었습니다.");   // 알림 추가
    } catch {}
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user,
        isLoggedIn: !!user,
        ready,
        refresh,
        afterLogin,
        logout,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
