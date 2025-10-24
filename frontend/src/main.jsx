// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginUser from "./pages/LoginUser";
import LoginAdmin from "./pages/LoginAdmin";
import LoginCandidate from "./pages/LoginCandidate";
import Admin from "./pages/Admin";
import UserDashboard from "./pages/UserDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import ProtectedRoute from "./ProtectedRoute";
import CandidateDetail from "./pages/CandidateDetail";

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LoginUser />;
  if (user.role === "admin") return <Admin />;
  if (user.role === "candidate") return <CandidateDashboard />;
  return <UserDashboard />;
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginUser /> },
  { path: "/login-admin", element: <LoginAdmin /> },
  { path: "/login-candidate", element: <LoginCandidate /> },
  { path: "/admin", element: <ProtectedRoute role="admin"><Admin /></ProtectedRoute> },
  { path: "/dashboard", element: <ProtectedRoute role="user"><UserDashboard /></ProtectedRoute> },
  { path: "/candidate-dashboard", element: <ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute> },

  // Candidate detail page (accessible by both users and admins)
  { path: "/candidates/:id", element: <ProtectedRoute role={["user", "admin"]}><CandidateDetail /></ProtectedRoute> },

  // Default -> role-based landing
  { path: "/", element: <ProtectedRoute><RoleRedirect /></ProtectedRoute> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
