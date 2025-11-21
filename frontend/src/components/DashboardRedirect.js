import { Navigate } from 'react-router-dom';

const DashboardRedirect = () => {
  const role = localStorage.getItem('role');

  if (role === 'superadmin') {
    return <Navigate to="/superadmin-dashboard" replace />;
  } else if (role === 'admin' || role === 'doctor' || role === 'nurse') {
    return <Navigate to="/admin-dashboard" replace />;
  } else {
    return <Navigate to="/patient-dashboard" replace />;
  }
};

export default DashboardRedirect;
