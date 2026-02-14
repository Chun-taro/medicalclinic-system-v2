import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="loading-spinner"></div>; // Or a proper loading component
    }

    if (!role) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Role hierarchy or specific checks
    if (requiredRole && role !== requiredRole) {
        // Basic hierarchy logic from old code
        const isSuperAdmin = role === 'superadmin';
        const isAdmin = role === 'admin';

        // Example: Superadmin can access admin routes
        if (requiredRole === 'admin' && isSuperAdmin) {
            return children;
        }

        // Redirect logic from old ProtectedRoute.js
        if ((role === 'doctor' || role === 'nurse') && requiredRole === 'patient') {
            return <Navigate to="/admin-dashboard" replace />;
        }

        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;
