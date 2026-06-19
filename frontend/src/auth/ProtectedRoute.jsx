import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ROLE_HOME = {
  ADMIN: "/admin/dashboard",
  DOCTOR: "/doctor/dashboard",
  NURSE: "/nurse/dashboard",
};

/**
 * Wraps a route. If not authenticated -> redirect to /login.
 * If `roles` is given and the user's role isn't included -> redirect to
 * their own home page (prevents a nurse from opening doctor URLs, etc).
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <div className="full-page-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to={ROLE_HOME[role] || "/login"} replace />;
  }

  return children;
}

export { ROLE_HOME };