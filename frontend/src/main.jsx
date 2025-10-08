import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginUser from "./pages/LoginUser";
import LoginAdmin from "./pages/LoginAdmin";
import Admin from "./pages/Admin";
import UserDashboard from "./pages/UserDashboard";
import ProtectedRoute from "./ProtectedRoute";

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LoginUser />;
  return user.role === "admin" ? <Admin /> : <UserDashboard />;
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginUser /> },
  { path: "/login-admin", element: <LoginAdmin /> },
  { path: "/admin", element: <ProtectedRoute role="admin"><Admin /></ProtectedRoute> },
  { path: "/dashboard", element: <ProtectedRoute role="user"><UserDashboard /></ProtectedRoute> },
  { path: "/", element: <ProtectedRoute><RoleRedirect /></ProtectedRoute> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider><RouterProvider router={router} /></AuthProvider>
  </React.StrictMode>
);
