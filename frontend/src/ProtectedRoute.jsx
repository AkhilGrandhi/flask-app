// src/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 16, textAlign: "center" }}>Loading…</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    // If role is specified and doesn't match, kick back to a safe default.
    return <Navigate to="/" replace />;
  }

  return children;
}
