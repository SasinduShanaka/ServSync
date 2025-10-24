// src/layouts/ManagerLayout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Manager/Sidebar";
import TopBar from "../components/Admin/TopBar";
import { Outlet } from "react-router-dom";

export default function ManagerLayout() {
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
    <div className="min-h-screen bg-gray-50 text-zinc-900">
      <Sidebar
        open={open}
        mobileOpen={mobileOpen}
        onToggle={() => setOpen(o => !o)}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`flex flex-col transition-all duration-300 ${open ? 'md:ml-64' : 'md:ml-20'}`}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 py-6 pt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
