import React from "react";
import { Route, Routes, Outlet } from "react-router-dom";
import CusDashboardNavBar from "../components/User/CusDashboardNavBar";
import CusProfile from "./CusProfile";
import ComplaintHistory from "./ComplaintHistory";
import CusAppointments from "./CusAppointments";
import UserOverview from "./UserOverview.jsx";

function CusDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <CusDashboardNavBar />
      <main className="flex-1 p-8 overflow-y-auto ml-0 md:ml-64">
        <Routes>
          <Route path="overview" element={<UserOverview />} />
          <Route path="profile" element={<CusProfile />} />
          <Route path="appointments" element={<CusAppointments />} />
          <Route path="analytics" element={<CusProfile />} />
          <Route path="complaints" element={<ComplaintHistory />} />
          <Route index element={<UserOverview />} />
        </Routes>
      </main>
    </div>
  );
}

export default CusDashboard;
