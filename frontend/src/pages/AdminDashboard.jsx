import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Admin/Sidebar";
import TopBar from "../components/Admin/TopBar";

// Import your section components
import AdminAnalytics from "../components/Admin/AdminAnalytics";
import UserList from "../components/UserManagement/UserList";
import SessionList from "../components/SessionManagement/SessionManager";
//import ComplaintsList from "../components/Admin/ComplaintsList";

export default function AdminDashboard() {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Prevent back button navigation after logout
  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const staff = localStorage.getItem("staff");
      if (!staff) {
        navigate("/staffLogin", { replace: true });
        return;
      }
    };

    checkAuth();

    // Prevent browser back button
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

  // keep current section in state
  const [section, setSection] = useState(() => localStorage.getItem("section") || "analytics");
  useEffect(() => localStorage.setItem("section", section), [section]);

  // map section -> component
  const SectionView = {
    analytics: <AdminAnalytics />,
    users: <UserList />,
    sessions: <SessionList />,
    // complaints: <ComplaintsList />,
  }[section];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        open={open}
        mobileOpen={mobileOpen}
        onToggle={() => setOpen(o => !o)}
        onMobileClose={() => setMobileOpen(false)}
        onSectionChange={setSection}
        activeSection={section}
      />

      <div className="flex-1 flex flex-col">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-6 bg-gray-50">
          {SectionView}
        </main>
      </div>
    </div>
  );
}
