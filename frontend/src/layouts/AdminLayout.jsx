// src/layouts/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Admin/Sidebar";
import TopBar from "../components/Admin/TopBar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication on mount and route changes
    const checkAuth = () => {
      const staff = localStorage.getItem("staff");
      if (!staff) {
        navigate("/staffLogin", { replace: true });
        return false;
      }
      return true;
    };

    if (!checkAuth()) return;

    // Prevent back button navigation after logout
    const handlePopState = () => {
      const staff = localStorage.getItem("staff");
      if (!staff) {
        navigate("/staffLogin", { replace: true });
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Push initial state
    window.history.pushState(null, "", window.location.href);
    
    // Listen for back button
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        open={open}
        mobileOpen={mobileOpen}
        onToggle={() => setOpen(o => !o)}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col md:ml-64">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-6 bg-gray-50 pt-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
