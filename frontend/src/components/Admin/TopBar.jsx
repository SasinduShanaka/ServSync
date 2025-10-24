import React, { useState, useRef, useEffect } from "react";
import { Menu, LogOut, User as UserIcon, ChevronDown, AlertCircle } from "lucide-react";
import api from "../../utils/api";
import Modal from "../Shared/Modal";

/**
 * Props:
 * - onMenuClick (fn): for mobile, opens sidebar
 */
export default function TopBar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [staff, setStaff] = useState(null); // unified staff object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current logged staff (staff session uses /roles/me). Fallback to localStorage if request fails.
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/roles/me");
        // Normalize field names to align with previous customer-based UI expectations
        const normalized = {
          id: data._id,
          nic: data.nic,
            // Provide compatibility keys used in existing modal display
          fullName: data.name || data.userName || data.nic,
          username: data.userName,
          role: data.role,
          workArea: data.workArea,
          status: data.status
        };
        setStaff(normalized);
      } catch (e) {
        // Attempt localStorage fallback (set during staff login page)
        try {
          const ls = localStorage.getItem("staff");
          if (ls) {
            const parsed = JSON.parse(ls);
            setStaff({
              nic: parsed.nic,
              fullName: parsed.name || parsed.userName || parsed.nic,
              username: parsed.userName,
              role: parsed.role,
              workArea: parsed.workArea,
              status: parsed.status
            });
          } else {
            setError("Not logged in");
          }
        } catch {
          setError("Unable to load staff profile");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function greeting() {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  }

  const displayName = staff?.fullName || staff?.username || staff?.nic || "User";

  const handleLogout = async () => {
    try {
      // Prefer staff logout endpoint; fall back to user logout if fails
      try {
        await api.post("/roles/logout");
      } catch {
        await api.post("/users/logout");
      }
      // Clear any stored staff cache
      localStorage.removeItem("staff");
      localStorage.removeItem("section");
      
      // Clear session storage
      sessionStorage.clear();
      
      // Prevent going back to admin dashboard
      window.history.pushState(null, "", "/staffLogin");
      window.location.replace("/staffLogin");
    } catch {
      alert("Logout failed");
    }
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white border-zinc-200 shadow-sm fixed top-0 left-0 right-0 z-20 md:left-64">
      {/* Left: menu + greeting */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={onMenuClick}
          aria-label="Open sidebar"
          className="p-2 rounded-md hover:bg-gray-100 md:hidden"
        >
          <Menu className="h-6 w-6 text-zinc-700" />
        </button>
        <div className="text-sm sm:text-base font-semibold text-slate-700 truncate">
          {loading ? (
            <span className="text-slate-500">Loading...</span>
          ) : error ? (
            <span className="inline-flex items-center gap-1 text-red-600 font-normal">
              <AlertCircle className="h-4 w-4" /> {error}
            </span>
          ) : (
            <>
              {greeting()}, <span className="text-blue-600">{displayName}</span>
              {staff?.role && (
                <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {staff.role}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right: Profile & Logout */}
      <div className="flex items-center gap-3 ml-4">
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-2 focus:outline-none group"
          title="View Profile"
        >
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="User"
            className="h-10 w-10 rounded-full object-cover border-2 border-gray-300 group-hover:border-blue-500 transition-all shadow-sm group-hover:shadow-md"
          />
          <UserIcon className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
        </button>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-sm hover:shadow-md transition-all"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      <Modal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title=""
      >
        {staff ? (
          <div className="space-y-4">
            {/* Profile Header with Avatar */}
            <div className="flex flex-col items-center pb-4 border-b border-gray-200">
              <div className="relative mb-3">
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                />
                <div className="absolute bottom-0 right-0 h-5 w-5 bg-green-500 rounded-full border-3 border-white"></div>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {staff.fullName}
              </h2>
              {staff.role && (
                <span className="mt-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200">
                  {staff.role}
                </span>
              )}
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 gap-3">
              <div className="group flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 hover:border-slate-300 transition-all">
                <div className="p-1.5 rounded-lg bg-white shadow-sm">
                  <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">NIC Number</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{staff.nic}</p>
                </div>
              </div>

              {staff.username && (
                <div className="group flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 hover:border-blue-300 transition-all">
                  <div className="p-1.5 rounded-lg bg-white shadow-sm">
                    <UserIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Username</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{staff.username}</p>
                  </div>
                </div>
              )}

              {staff.workArea && (
                <div className="group flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 hover:border-emerald-300 transition-all">
                  <div className="p-1.5 rounded-lg bg-white shadow-sm">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Work Area</p>
                    <p className="text-sm font-semibold text-slate-800">{staff.workArea}</p>
                  </div>
                </div>
              )}

              {staff.status && (
                <div className="group flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-200 hover:border-purple-300 transition-all">
                  <div className="p-1.5 rounded-lg bg-white shadow-sm">
                    <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Status</p>
                    <span className={"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border " + (staff.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200")}>
                      <span className={"h-1.5 w-1.5 rounded-full " + (staff.status === "active" ? "bg-green-500" : "bg-gray-400")}></span>
                      {staff.status}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-1">
              <button
                onClick={() => setProfileOpen(false)}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-white text-sm font-semibold hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-slate-600">Loading profile...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-red-50 mb-3">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <p className="text-sm text-red-600 font-medium">Unable to load profile.</p>
          </div>
        )}
      </Modal>
    </header>
  );
}
