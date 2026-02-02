import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Loader from "../Components/Loader";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Loader message="Verifying authentication..." />
      </div>
    );
  }

  // If user is not authenticated, redirect to login page
  if (!isAuthenticated()) {
    // Only set redirect if it's not a logout scenario
    const currentPath = location.pathname + location.search;
    const isLogoutPath = location.pathname === '/logout' || location.search.includes('logout=true');
    
    if (!isLogoutPath && currentPath !== '/login') {
      const redirect = encodeURIComponent(currentPath);
      return <Navigate to={`/login?redirect=${redirect}`} replace />;
    }
    
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but role is not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Clear any existing redirect to prevent role switching issues
    localStorage.removeItem('pendingRedirect');
    
    // Redirect to role-specific default page or unauthorized page
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'user':
        return <Navigate to="/dashboard" replace />;
      case 'vendor':
        return <Navigate to="/vendor/dashboard" replace />;
      default:
        return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and authorized, render the children
  return children;
}