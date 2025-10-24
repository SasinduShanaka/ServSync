import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ReceptionistSidebar from '../components/Receptionist/ReceptionistSidebar';
import TopBar from '../components/Admin/TopBar';

export default function ReceptionistLayout() {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ReceptionistSidebar
        open={open}
        mobileOpen={mobileOpen}
        onToggle={() => setOpen(o => !o)}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`flex-1 flex flex-col transition-[margin] duration-300 ${open ? 'md:ml-64' : 'md:ml-20'}`}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};