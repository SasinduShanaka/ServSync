import React from "react";
import { Navigate } from "react-router-dom";

// expects you already store logged user in localStorage or context
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("auth_user") || "{}");
  } catch { return {}; }
}

export default function ProtectedRoute({ roles = [], children }) {
  const user = getUser();
  const isLogged = !!user?.token || !!user?._id; // adapt to your auth shape
  const myRole = user?.role || user?.roleName || user?.roles?.[0];

  if (!isLogged) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(myRole)) return <Navigate to="/" replace />;

  return children;
}
