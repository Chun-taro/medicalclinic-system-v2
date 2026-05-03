import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="loading-spinner"></div>;
    }

    if (!role) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role hierarchy: Superadmin can access all staff-level routes
    if (requiredRole && role !== requiredRole) {
        const isSuperAdmin = role === 'superadmin';
        
        // Allow superadmin to access admin and doctor routes
        if (isSuperAdmin && (requiredRole === 'admin' || requiredRole === 'doctor')) {
            return children;
        }

        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;
