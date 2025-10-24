import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Menu,
  BarChart3, 
  Calendar, 
  Users, 
  UserCheck, 
  Home
} from 'lucide-react';

export default function ReceptionistSidebar({ open, mobileOpen, onToggle, onMobileClose }) {
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    // Prefer localStorage set at login for instant UI; fallback to API
    try {
      const raw = localStorage.getItem('staff');
      if (raw) {
        const parsed = JSON.parse(raw);
        setStaff(parsed);
      }
  } catch { /* ignore malformed staff in localStorage */ }
    // Best-effort refresh from server to ensure latest
    fetch('/roles/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) {
          // Normalize to the shape stored at login
          setStaff(prev => ({
            ...(prev || {}),
            nic: data.nic || prev?.nic,
            userName: data.userName || prev?.userName,
            role: data.role || prev?.role,
            branch: data.branch?._id || prev?.branch,
            branchName: data.branch?.name || prev?.branchName,
            branchCode: data.branch?.code || prev?.branchCode,
            counter: data.counter || prev?.counter,
            counterName: prev?.counterName, // not in /me currently
          }));
      }
      }).catch(() => {});
  }, []);

  const navItems = [
    { to: "/receptionist", label: "Overview", icon: Home, end: true },
    { to: "/receptionist/appointments", label: "Appointments", icon: Calendar },
    { to: "/receptionist/queue", label: "Queue Management", icon: Users },
    { to: "/receptionist/checkin", label: "Customer Check-in", icon: UserCheck },
    { to: "/receptionist/reports", label: "Reports", icon: BarChart3 },
  ];

  const base = "group flex items-center gap-3 rounded-md px-3 py-2 transition-colors";
  const idle = "text-zinc-700 hover:bg-blue-50 hover:text-blue-700";

  return (
    <>
      {/* mobile backdrop */}
      <div
        onClick={onMobileClose}
        className={`fixed inset-0 bg-black/30 md:hidden transition-opacity ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={[
          "fixed top-0 left-0 h-screen z-30",
          "transition-[transform,width] duration-300",
          "bg-white border-r border-zinc-200 shadow-sm",
          "flex flex-col overflow-hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          open ? "md:w-64" : "md:w-20",
          "w-64",
        ].join(" ")}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600" />
            {open && <span className="text-xl font-bold text-blue-600 hidden md:inline">ServSync</span>}
          </div>
          <button onClick={onToggle} className="hidden md:inline-flex p-2 rounded-md hover:bg-gray-100">
            <Menu className="h-5 w-5 text-zinc-700" />
          </button>
          <button onClick={onMobileClose} className="md:hidden inline-flex p-2 rounded-md hover:bg-gray-100">
            <Menu className="h-5 w-5 text-zinc-700" />
          </button>
        </div>

        {/* Staff scope banner */}
        <div className="px-4 pb-2">
          {open ? (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div className="text-[11px] text-zinc-500">Branch</div>
              <div className="text-sm font-medium text-blue-700 truncate">
                {staff?.branchName || '—'} {staff?.branchCode ? <span className="text-zinc-400">({staff.branchCode})</span> : null}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-zinc-500 px-2">{staff?.branchCode || 'BR'}</div>
          )}
        </div>

        <nav className="mt-2 flex flex-col gap-10 px-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const { to, label, end } = item;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  [
                    base,
                    idle,
                    isActive ? "bg-blue-50 text-blue-700 font-medium" : "",
                  ].join(" ")
                }
                title={!open ? label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {open && <span className="truncate">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 p-4 text-[11px] text-zinc-400 hidden md:block ${open ? "" : "text-center"}`}>
          v0.1 • Receptionist
        </div>
      </aside>
    </>
  );
}