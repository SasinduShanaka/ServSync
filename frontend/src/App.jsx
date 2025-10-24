import 'font-awesome/css/font-awesome.min.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


// admin area

import AdminLayout from './layouts/AdminLayout.jsx';
import AdminAnalytics from './components/Admin/AdminAnalytics.jsx';
import UserList from './components/UserManagement/UserList.jsx';
import SessionList from './components/SessionManagement/SessionManager.jsx';
import SessionCreatePage from './components/SessionManagement/SessionCreatePage.jsx';



import StaffList from './components/UserManagement/StaffList.jsx';
import InsuranceTypeManager from './components/Admin/InsuranceTypeManager.jsx';
import BranchManager from './components/Admin/BranchManager.jsx';


//manager area
// Manager pages (your components)
import ManagerLayout from './layouts/ManagerLayout.jsx';
import ManagerOverview from "./components/Manager/ManagerOverview";
import ComplaintsList from "./components/Manager/ComplaintsList";
import FeedbackList from "./components/Manager/FeedbackList";
import Analytics from "./components/Manager/Analytics";
import ComplaintDetails from "./components/Manager/ComplaintDetails";
import ApprovePayment from "./components/Manager/ApprovePayment.jsx";

// user area
import Home from './pages/Home.jsx';
import ContactUs from './pages/ContactUs.jsx';
import Support from './pages/Support.jsx';
import FeedbackPage from './pages/FeedbackPage.jsx';
import FeedbackThankYou from './pages/FeedbackThankYou.jsx';
import NotFound from './pages/NotFound.jsx';
import PublicLayout from './layouts/UserLayout.jsx';
// booking flow pages
import InsuranceSelect from './pages/book/InsuranceSelect.jsx';
import BranchSelect from './pages/book/BranchSelect.jsx';
import Schedule from './pages/book/Schedule.jsx';
import Confirm from './pages/book/Confirm.jsx';
import RequireAuth from './components/Auth/RequireAuth.jsx';
import CcoLayout from './layouts/CcoLayout.jsx';
import CcoOverview from './pages/cco/Overview.jsx';
import CcoLive from './pages/cco/Live.jsx';
import CustomerWindow from './pages/cco/CustomerWindow.jsx';

// customer area
import CusLogin from './Users.Pages/CusLogin.jsx';
import StaffLogin from './pages/StaffLogin.jsx';
import RegisterForm from './Users.Pages/CusRegistration.jsx';
import CusDashboard from './Users.Pages/CusDashboard.jsx';
import CusProfile from './Users.Pages/CusProfile.jsx';
import ResetPassword from './Users.Pages/ResetPassword.jsx';
import ComplaintHistory from './Users.Pages/ComplaintHistory.jsx';
import UserOverview from './Users.Pages/UserOverview.jsx';

// Receptionist area
import ReceptionistLayout from './layouts/ReceptionistLayout.jsx';
import ReceptionistLogin from './pages/ReceptionistLogin.jsx';
import ReceptionistOverview from './pages/receptionist/ReceptionistOverview.jsx';
import ReceptionistAppointments from './pages/receptionist/ReceptionistAppointments.jsx';
import QueueManagement from './pages/receptionist/QueueManagement.jsx';
import CustomerCheckIn from './pages/receptionist/CustomerCheckIn.jsx';

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
// Test SMS page

import TestSms from './pages/TestSms.jsx';
import FeedbackInvite from './pages/FeedbackInvite.jsx';
import IoTHelp from './pages/IoTHelp.jsx';

// Appointment Management
import { AppointmentSummary, AppointmentList } from './components/AppointmentManagement';
import AppointmentCheckInPage from './pages/receptionist/AppointmentCheckInPage.jsx';



function AppContent() {
  return (
    
    
    <Routes>
      {/* Public pages (with NavBar) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/support" element={<Support />} />
        <Route path="/iot-help" element={<IoTHelp />} />
  {/* legacy appointments removed — use /book flow */}
  <Route path="/feedback/new" element={<FeedbackPage />} />
  <Route path="/feedback/thank-you" element={<FeedbackThankYou />} />
  {/* Booking flow (login required) */}
  {/* Browse booking data without login */}
  <Route path="/book" element={<InsuranceSelect />} />
  <Route path="/book/:insuranceType" element={<BranchSelect />} />
  <Route path="/book/:insuranceType/:branchId" element={<Schedule />} />
  {/* Require login only at final confirmation */}
  <Route path="/book/:insuranceType/:branchId/confirm" element={<RequireAuth><Confirm /></RequireAuth>} />
  
  {/* Appointment Management */}
  <Route path="/appointments" element={<RequireAuth><AppointmentList /></RequireAuth>} />
  <Route path="/appointments/:bookingCode" element={<AppointmentSummary />} />
      </Route>

      {/* Auth pages */}
      <Route path="/login" element={<CusLogin />} />
      <Route path="/staffLogin" element={<StaffLogin />} />
      <Route path="/receptionistLogin" element={<ReceptionistLogin />} />
      <Route path="/register" element={<RegisterForm />} />
      
      {/* Test SMS page (accessible without layout for testing) */}
      <Route path="/test-sms" element={<TestSms />} />
  <Route path="/feedback" element={<FeedbackInvite />} />

  {/* Customer dashboard with nested routes */}
  <Route path="/CusDashboard/*" element={<CusDashboard />} />
  {/* Customer dashboard */}
  {/* Use lowercase path for profile (matches links). Keep uppercase as alias if already used somewhere. */}
  <Route path="/CusProfile" element={<CusProfile />} />
  <Route path="/cusProfile" element={<CusProfile />} />

  <Route path="/reset-password" element={<ResetPassword />} />
  <Route path="/complaintshistory" element={<RequireAuth><ComplaintHistory /></RequireAuth>} />
  { /* /user-overview now nested under /CusDashboard/overview; keeping external route optional. Remove if not needed. */ }
  

      {/* Admin nested layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminAnalytics />} />
          <Route path="users" element={<UserList />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="sessions" element={<SessionList />} />
          <Route path="sessions/create" element={<SessionCreatePage />} />
          <Route path="insurance-types" element={<InsuranceTypeManager />} />
          <Route path="branches" element={<BranchManager />} />
        </Route>

        {/* Manager nested layout (separate from admin) */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<ManagerOverview />} />
          <Route path="approve-payment" element={<ApprovePayment />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="feedback" element={<FeedbackList />} />
          <Route path="complaints" element={<ComplaintsList />} />
          <Route path="complaints/:id" element={<ComplaintDetails />} />
        </Route>
        {/* CCO Dashboard */}
      <Route path="/cco" element={<CcoLayout />}>
        <Route path="overview" element={<CcoOverview />} />
        <Route path="live" element={<CcoLive />} />
        <Route path="customer" element={<CustomerWindow />} />
      </Route>

        {/* Receptionist nested layout */}
        <Route path="/receptionist" element={<ReceptionistLayout />}>
          <Route index element={<ReceptionistOverview />} />
          <Route path="overview" element={<ReceptionistOverview />} />
          <Route path="appointments" element={<ReceptionistAppointments />} />
          <Route path="queue" element={<QueueManagement />} />
          <Route path="checkin" element={<CustomerCheckIn />} />
          <Route path="checkin/:bookingCode" element={<AppointmentCheckInPage />} />
          <Route path="walkins" element={<CustomerCheckIn />} />
          <Route path="reports" element={<ReceptionistOverview />} />
          <Route path="messages" element={<ReceptionistOverview />} />
          <Route path="settings" element={<ReceptionistOverview />} />
        </Route>
        <Route
  path="/receptionist"
  element={
    <ProtectedRoute roles={['RECEPTIONIST','ADMIN','MANAGER']}>
      <ReceptionistOverview />
    </ProtectedRoute>
  }
/>
<Route
  path="/receptionist/checkin"
  element={
    <ProtectedRoute roles={['RECEPTIONIST']}>
      <CustomerCheckIn />
    </ProtectedRoute>
  }
/>
<Route
  path="/receptionist/queue"
  element={
    <ProtectedRoute roles={['RECEPTIONIST']}>
      <QueueManagement />
    </ProtectedRoute>
  }
/>
<Route
  path="/receptionist/appointments"
  element={
    <ProtectedRoute roles={['RECEPTIONIST']}>
      <ReceptionistAppointments />
    </ProtectedRoute>
  }
/>

     
      

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}


