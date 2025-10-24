import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, User, Calendar, BarChart3, MessageSquare, Home } from "lucide-react";
import api from "../../utils/api";

// Customer sidebar styled & structured like Admin sidebar (collapsible + icons + responsive)
export default function CusDashboardNavBar() {
  const [open, setOpen] = useState(true);          // desktop collapse state
  const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/users/me");
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const navItems = [
    { to: "/CusDashboard/overview", label: "Overview", icon: BarChart3, end: true },
    { to: "/CusDashboard/profile", label: "My Profile", icon: User },
    { to: "/CusDashboard/appointments", label: "My Appointments", icon: Calendar },
    { to: "/CusDashboard/complaints", label: "My Complaints", icon: MessageSquare },
  ];

  const base = "group flex items-center gap-3 rounded-md px-3 py-2 transition-colors";
  const idle = "text-zinc-700 hover:bg-blue-50 hover:text-blue-700";

  function initial() {
    if (!user) return "C";
    return (user.fullName || user.username || "C").charAt(0).toUpperCase();
  }

  function handleBackToHome() {
    navigate("/");
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-black/30 md:hidden transition-opacity ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={[
          "fixed top-0 left-0 h-screen z-40",
          "transition-[transform,width] duration-300",
          "bg-white border-r border-zinc-200 shadow-sm",
          "overflow-hidden flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          open ? "md:w-64" : "md:w-20",
          "w-64",
        ].join(" ")}
      >
        {/* Header / brand */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold select-none">
              {initial()}
            </div>
            {open && (
              <div className="flex flex-col -space-y-0.5">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {loading ? "Loading..." : user ? `Hi, ${user.username}` : "Guest"}
                </span>
                <span className="text-[11px] font-medium text-blue-600 tracking-wide">Customer</span>
              </div>
            )}
          </div>
          <button
            onClick={() => (mobileOpen ? setMobileOpen(false) : setOpen(o => !o))}
            className="inline-flex p-2 rounded-md hover:bg-gray-100"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-zinc-700" />
          </button>
        </div>


        {/* Nav */}
        <nav className="mt-10 flex flex-col gap-8 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => [
                  base,
                  idle,
                  isActive ? "bg-blue-50 text-blue-700 font-medium" : ""
                ].join(" ")}
                title={!open ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {open && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-16 left-0 right-0 px-3 space-y-3">
          {/* Back to Home */}
          <button
            onClick={handleBackToHome}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300 hover:border-blue-400 transition-all duration-200"
            title={!open ? "Back to Home" : undefined}
          >
            <Home className="h-5 w-5" />
            {open && <span>Back to Home</span>}
          </button>

          {/* Logout */}
          <button
            onClick={async () => {
              try {
                await api.post("/users/logout");
                navigate("/");
              } catch (err) {
                console.error("Logout failed:", err);
                navigate("/");
              }
            }}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 hover:border-red-400 transition-all duration-200"
            title={!open ? "Logout" : undefined}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {open && <span>Logout</span>}
          </button>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 p-4 text-[11px] text-zinc-400 hidden md:block ${open ? "" : "text-center"}`}>
          v0.1 • Customer
        </div>
      </aside>

      {/* Mobile toggle button (floating) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-30 h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  );
}
