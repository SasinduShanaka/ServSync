// src/components/User/NavBar.jsx
import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Shield, Bell, Search, User, ChevronDown, Sparkles } from "lucide-react";
import api from "../../utils/api";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // auth check
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api.get("/users/me");
        if (mounted) setIsAuth(true);
      } catch {
        if (mounted) setIsAuth(false);
      } finally {
        if (mounted) setAuthChecked(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // style on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowProfileMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const navItems = [
    { to: "/", label: "Home", end: true },
    { to: "/book", label: "Book Appointment", end: false },
    { to: "/support", label: "Support" },
    { to: "/contact", label: "Contact" },
  ];

  const linkBase =
    "relative px-5 py-2.5 text-sm font-semibold transition-all duration-300 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";
  const linkIdle = "text-slate-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 hover:shadow-sm";
  const linkActive = "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md border border-blue-100";

  const ctaDesktop = !authChecked ? (
    <div className="flex items-center gap-4">
      <div className="w-9 h-9 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse"></div>
      <div className="w-24 h-9 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse"></div>
    </div>
  ) : isAuth ? (
    <div className="flex items-center gap-4">
      {/* Search Button */}
      <button className="relative p-2.5 text-slate-500 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 rounded-xl transition-all duration-300 hover:shadow-sm">
        <Search className="h-5 w-5" />
      </button>
      
      {/* Notifications */}
      <button className="relative p-2.5 text-slate-500 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 rounded-xl transition-all duration-300 hover:shadow-sm">
        <Bell className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full border-2 border-white shadow-sm"></span>
      </button>
      
      {/* Profile Dropdown */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowProfileMenu(!showProfileMenu);
          }}
          className="flex items-center gap-3 p-2 text-slate-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 rounded-xl transition-all duration-300 hover:shadow-sm"
        >
          <div className="w-9 h-9 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <User className="h-4 w-4 text-white" />
          </div>
          <ChevronDown className="h-4 w-4" />
        </button>
        
        {showProfileMenu && (
          <div className="absolute right-0 top-14 w-56 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl py-3 z-50 ring-1 ring-black/5">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Account</p>
              <p className="text-xs text-slate-500">Manage your profile</p>
            </div>
            <Link
              to="/CusDashboard"
              className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 hover:text-blue-600 transition-all duration-200"
              onClick={() => setShowProfileMenu(false)}
            >
              <User className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-4">
      <Link
        to="/login"
        className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-all duration-300 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80"
      >
        Sign In
      </Link>
      <Link
        to="/register"
        className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02]"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Get Started
        </span>
      </Link>
    </div>
  );

  const ctaMobile = !authChecked ? (
    <div className="mt-4 space-y-3">
      <div className="h-10 bg-slate-200 rounded-lg animate-pulse"></div>
      <div className="h-10 bg-slate-200 rounded-lg animate-pulse"></div>
    </div>
  ) : isAuth ? (
    <div className="mt-4 space-y-3">
      <Link
        to="/CusDashboard"
        onClick={() => setOpen(false)}
        className="flex items-center gap-3 w-full p-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        Dashboard
      </Link>
    </div>
  ) : (
    <div className="mt-4 space-y-3">
      <Link
        to="/login"
        onClick={() => setOpen(false)}
        className="block w-full p-3 text-sm font-medium text-center text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
      >
        Sign In
      </Link>
      <Link
        to="/register"
        onClick={() => setOpen(false)}
        className="block w-full p-3 text-sm font-semibold text-center text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all"
      >
        Get Started
      </Link>
    </div>
  );

  return (
    <header
      role="banner"
      className={[
        "sticky top-0 z-50 w-full transition-all duration-500",
        scrolled
          ? "bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-lg shadow-slate-900/5"
          : "bg-white/70 backdrop-blur-xl border-b border-slate-100/50 shadow-sm"
      ].join(" ")}
    >
      {/* Modern gradient accent line with animation */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/3 h-full animate-pulse"></div>
      </div>
      
      {/* Enhanced navbar with modern styling */}
      <div className="flex h-20 w-full items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Modern Brand Section */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-4 group" aria-label="ServSync home">
            <div className="relative">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                <Shield className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500 -z-10"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-indigo-600 group-hover:to-purple-600 transition-all duration-500">
                ServSync
              </span>
              <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">NITF Services</span>
            </div>
          </Link>
        </div>

        {/* Modern Navigation */}
        <nav className="hidden lg:flex items-center justify-center gap-2" aria-label="Primary">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Modern Right Section */}
        <div className="hidden lg:flex justify-end">{ctaDesktop}</div>
        
        {/* Modern Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-3">
          {isAuth && (
            <button className="relative p-2.5 text-slate-500 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 rounded-xl transition-all duration-300">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full border-2 border-white"></span>
            </button>
          )}
          <button
            className="rounded-xl p-2.5 hover:bg-gradient-to-r hover:from-slate-100/80 hover:to-slate-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-300 hover:shadow-sm"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6 text-slate-600" aria-hidden="true" /> : <Menu className="h-6 w-6 text-slate-600" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Modern Mobile Menu */}
      <div
        className={[
          "lg:hidden overflow-hidden transition-all duration-500 ease-out bg-white/90 backdrop-blur-2xl border-t border-slate-200/50",
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        ].join(" ")}
        aria-hidden={!open}
      >
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16 py-6">
          <nav className="flex flex-col gap-3 mb-6" aria-label="Mobile navigation">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    "block rounded-2xl px-5 py-4 text-base font-semibold transition-all duration-300",
                    isActive 
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border border-blue-200 shadow-sm" 
                      : "text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 border border-transparent hover:shadow-sm"
                  ].join(" ")
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          {ctaMobile}
        </div>
      </div>
    </header>
  );
}
