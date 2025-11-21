import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PatientProvider } from './context/PatientContext';

// Auth pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import SuperadminLogin from './pages/SuperadminLogin';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import OAuthSuccess from './pages/OAuthSuccess';
import OAuthFailure from './pages/OAuthFailure';
import GoogleSignup from './pages/GoogleSignup';

// Shared components
import ProtectedRoute from './components/ProtectedRoute';
import DashboardRedirect from './components/DashboardRedirect';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AllAppointments from './pages/admin/AllAppointments';
import ManageUsers from './pages/admin/ManageUsers';
import Reports from './pages/admin/Reports';
import ConsultationPage from './pages/admin/ConsultationPage';
import Inventory from './pages/admin/Inventory';
import AdminProfile from './pages/admin/AdminProfile';




// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import MyAppointments from './pages/patient/MyAppointments';
import BookAppointment from './pages/patient/BookAppointment';
import Profile from './pages/patient/Profile';
import Notifications from './pages/patient/Notifications';

function App() {
  return (
    <BrowserRouter>
      <PatientProvider>
        <Routes>

                {/* Auth Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/superadmin-login" element={<SuperadminLogin />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />
      <Route path="/oauth-failure" element={<OAuthFailure />} />
      <Route path="/google-signup" element={<GoogleSignup />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="/unauthorized" element={<p>Access denied.</p>} />

      {/*  Admin Routes */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-appointments"
        element={
          <ProtectedRoute requiredRole="admin">
            <AllAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-users"
        element={
          <ProtectedRoute requiredRole="admin">
            <ManageUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-reports"
        element={
          <ProtectedRoute requiredRole="admin">
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-consultation/:id"
        element={
          <ProtectedRoute requiredRole="admin">
            <ConsultationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-inventory"
        element={
          <ProtectedRoute requiredRole="admin">
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-profile"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminProfile />
          </ProtectedRoute>
        }
      />


      {/* Superadmin Routes (redirected to admin) */}
      <Route
        path="/superadmin-dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />


      {/*  Patient Routes */}
      <Route
        path="/patient-dashboard"
        element={
          <ProtectedRoute requiredRole="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient-appointments"
        element={
          <ProtectedRoute requiredRole="patient">
            <MyAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient-book"
        element={
          <ProtectedRoute requiredRole="patient">
            <BookAppointment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient-profile"
        element={
          <ProtectedRoute requiredRole="patient">
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient-notifications"
        element={
          <ProtectedRoute requiredRole="patient">
            <Notifications />
          </ProtectedRoute>
        }
      />

    </Routes>
  </PatientProvider>
</BrowserRouter>

  );
}

export default App;
