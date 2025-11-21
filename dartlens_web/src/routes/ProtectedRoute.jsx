import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute Component
 *
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Child components to render if authenticated
 * @returns {ReactNode} Children if logged in, otherwise redirects to home
 */
export default function ProtectedRoute({ children }) {
  const { isLoggedIn, ready } = useAuth();

  // Wait for authentication state to initialize
  // This prevents flashing the redirect during initial load
  if (!ready) {
    return <div className="loading-screen">로딩 중...</div>;
  }

  // Redirect to home if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // Render protected content if authenticated
  return children;
}
