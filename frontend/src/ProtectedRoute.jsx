// src/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingSpinner from "./components/LoadingSpinner";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return <LoadingSpinner message="Verifying access..." />;
  }

  // Not logged in -> redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Check role permission
  if (role) {
    // Handle both single role and array of roles
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      // Redirect to their appropriate dashboard based on role
      if (user.role === "admin") return <Navigate to="/admin" replace />;
      if (user.role === "candidate") return <Navigate to="/candidate" replace />;
      return <Navigate to="/recruiter" replace />;
    }
  }

  return children;
}
