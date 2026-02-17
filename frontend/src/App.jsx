import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import OAuthSuccess from './pages/auth/OAuthSuccess';
import OAuthFailure from './pages/auth/OAuthFailure';
import GoogleSignup from './pages/auth/GoogleSignup';
import PatientDashboard from './pages/patient/PatientDashboard';
import MyAppointments from './pages/patient/MyAppointments';
import BookAppointment from './pages/patient/BookAppointment';
import PatientProfile from './pages/patient/PatientProfile';
import Notifications from './pages/patient/Notifications';
import GoogleCalendarPage from './pages/patient/GoogleCalendarPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import AllAppointments from './pages/admin/AllAppointments';
import AdminReports from './pages/admin/AdminReports';
import Inventory from './pages/admin/Inventory';
import ConsultationPage from './pages/admin/ConsultationPage';
import Profile from './pages/common/Profile';
import SystemLogs from './pages/superadmin/SystemLogs';
import AdminDoctorFeedback from './pages/admin/AdminDoctorFeedback';
import DoctorFeedback from './pages/doctor/DoctorFeedback';
import NotFound from './pages/NotFound'; // Assuming it exists or I will create it
// Placeholder modules

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/oauth/success" element={<OAuthSuccess />} />
              <Route path="/oauth/failure" element={<OAuthFailure />} />
              <Route path="/oauth/google-signup" element={<GoogleSignup />} />
              <Route path="/superadmin-login" element={<Login />} /> {/* Re-use login for superadmin, logic handles redirection */}
            </Route>

            {/* Protected Routes */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              {/* We will populate these as we migrate pages */}
              <Route path="/patient-dashboard" element={<PatientDashboard />} />
              <Route path="/patient-appointments" element={<MyAppointments />} />
              <Route path="/patient-book" element={<BookAppointment />} />
              <Route path="/patient-profile" element={<PatientProfile />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin-users" element={<ManageUsers />} />
              <Route path="/admin-appointments" element={<AllAppointments />} />
              <Route path="/admin-reports" element={<AdminReports />} />
              <Route path="/admin-inventory" element={<Inventory />} />
              <Route path="/admin-consultation" element={<ConsultationPage />} />
              <Route path="/admin-profile" element={<Profile />} />

              {/* Superadmin Routes */}
              <Route path="/superadmin-dashboard" element={<AdminDashboard />} />
              <Route path="/superadmin-logs" element={<SystemLogs />} />
              <Route path="/superadmin-users" element={<ManageUsers />} />
              <Route path="/superadmin-appointments" element={<AllAppointments />} />
              <Route path="/superadmin-reports" element={<AdminReports />} />
              <Route path="/superadmin-doctor-feedback" element={<AdminDoctorFeedback />} />
              <Route path="/superadmin-inventory" element={<Inventory />} />
              <Route path="/superadmin-consultation" element={<ConsultationPage />} />
              <Route path="/superadmin-profile" element={<Profile />} />

              {/* Doctor Routes */}
              <Route path="/doctor-feedback" element={<DoctorFeedback />} />
              <Route path="/doctor-profile" element={<Profile />} />
              <Route path="/admin-doctor-feedback" element={<AdminDoctorFeedback />} />
            </Route>

            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
