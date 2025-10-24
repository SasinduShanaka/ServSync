// src/layouts/UserLayout.jsx
import { Outlet } from "react-router-dom";
import NavBar from "../components/User/NavBar.jsx";

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <NavBar />
      <main className="flex-1 w-full">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <Outlet />
        </div>
      </main>
      <footer className="mt-auto border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} ServSync — NITF Smart Appointment & Queue System
      </footer>
    </div>
  );
}
