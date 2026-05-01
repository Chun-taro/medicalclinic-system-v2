import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { role, loading } = useAuth();
    const location = useLocation();

    console.log('ProtectedRoute: Check', { path: location.pathname, role, loading, requiredRole });

    if (loading) {
        return <div className="loading-spinner"></div>; // Or a proper loading component
    }

    if (!role) {
        console.warn('ProtectedRoute: No role, redirecting to login');
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
