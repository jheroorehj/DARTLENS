// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, ready } = useAuth();

  if (!ready) return null; // 초기 세션 확인 전엔 렌더 지연(스켈레톤 넣어도 됨)
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return children;
}
