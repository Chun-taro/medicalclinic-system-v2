import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Check if token exists and is not empty
  if (!token || token.trim() === '') {
    console.log('No token found, redirecting to login');
    return <Navigate to="/" replace />;
  }

  // Check if role exists and matches required role
  // Allow superadmin, doctor, nurse to access admin routes
  if (requiredRole && (!role || (role !== requiredRole && !(role === 'superadmin' && requiredRole === 'admin') && !(role === 'doctor' && requiredRole === 'admin') && !(role === 'nurse' && requiredRole === 'admin')))) {
    console.log(`Role mismatch: expected ${requiredRole}, got ${role}`);
    // Redirect doctors and nurses to admin dashboard if they try to access patient routes
    if ((role === 'doctor' || role === 'nurse') && requiredRole === 'patient') {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
