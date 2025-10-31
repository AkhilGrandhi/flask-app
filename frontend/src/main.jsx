// src/main.jsx
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load all page components for better performance
const LoginUser = lazy(() => import("./pages/LoginUser"));
const LoginAdmin = lazy(() => import("./pages/LoginAdmin"));
const LoginCandidate = lazy(() => import("./pages/LoginCandidate"));
const Admin = lazy(() => import("./pages/Admin"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const CandidateDashboard = lazy(() => import("./pages/CandidateDashboard"));
const CandidateDetail = lazy(() => import("./pages/CandidateDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Role-based redirect component
function RoleRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on role
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "candidate") return <Navigate to="/candidate" replace />;
  return <Navigate to="/recruiter" replace />;
}

const router = createBrowserRouter([
  // Public routes - Login pages
  { 
    path: "/login", 
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginUser />
      </Suspense>
    )
  },
  { 
    path: "/admin/login", 
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginAdmin />
      </Suspense>
    )
  },
  { 
    path: "/candidate/login", 
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginCandidate />
      </Suspense>
    )
  },
  
  // Protected routes - Dashboards
  { 
    path: "/recruiter", 
    element: (
      <ProtectedRoute role="user">
        <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
          <UserDashboard />
        </Suspense>
      </ProtectedRoute>
    )
  },
  { 
    path: "/admin", 
    element: (
      <ProtectedRoute role="admin">
        <Suspense fallback={<LoadingSpinner message="Loading admin panel..." />}>
          <Admin />
        </Suspense>
      </ProtectedRoute>
    )
  },
  { 
    path: "/candidate", 
    element: (
      <ProtectedRoute role="candidate">
        <Suspense fallback={<LoadingSpinner message="Loading candidate dashboard..." />}>
          <CandidateDashboard />
        </Suspense>
      </ProtectedRoute>
    )
  },
  
  // Protected routes - Resources
  { 
    path: "/candidates/:id", 
    element: (
      <ProtectedRoute role={["user", "admin"]}>
        <Suspense fallback={<LoadingSpinner message="Loading candidate details..." />}>
          <CandidateDetail />
        </Suspense>
      </ProtectedRoute>
    )
  },
  
  // Default route -> role-based landing
  { 
    path: "/", 
    element: <RoleRedirect />
  },
  
  // 404 - Catch all undefined routes
  { 
    path: "*", 
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <NotFound />
      </Suspense>
    )
  }
]);

// Handle 404 redirects from static hosting
if (window.location.pathname === '/' && sessionStorage.getItem('redirectPath')) {
  const redirectPath = sessionStorage.getItem('redirectPath');
  sessionStorage.removeItem('redirectPath');
  window.history.replaceState(null, '', redirectPath);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
