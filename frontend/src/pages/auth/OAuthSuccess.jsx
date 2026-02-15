import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const OAuthSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const hasRun = useRef(false);

    useEffect(() => {
        // Guard 1: Ensure we are only on /oauth/success
        if (location.pathname !== '/oauth/success') {
            return;
        }

        // Guard 2: Ensure we only run this once
        if (hasRun.current) {
            return;
        }

        console.log('OAuthSuccess (V5): Processing start...', window.location.href);
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const role = params.get('role');
        const userId = params.get('userId');

        console.log('OAuthSuccess (V5): Params extracted:', { hasToken: !!token, role, userId });

        const validRoles = ['patient', 'admin', 'superadmin', 'doctor', 'nurse'];

        if (token && role && validRoles.includes(role)) {
            hasRun.current = true; // Set this immediately

            console.log('OAuthSuccess (V5): Calling login context...');
            login(token, role, null).then(() => {
                // IMPORTANT: We do NOT use isMounted guard for navigate 
                // because the login call itself triggers a re-render that would set isMounted to false.
                console.log('OAuthSuccess (V5): Login successful, initiating redirect to dashboard.');

                const dashboardMap = {
                    patient: '/patient-dashboard',
                    admin: '/admin-dashboard',
                    superadmin: '/superadmin-dashboard',
                    doctor: '/doctor-feedback',
                    nurse: '/admin-dashboard'
                };

                const target = dashboardMap[role] || '/';
                console.log('OAuthSuccess (V5): Navigating to:', target);

                // Use a small timeout to ensure state has settled if needed, 
                // but usually navigate() is safe triggered from microtask.
                navigate(target, { replace: true });
                toast.success('Login successful!');
            }).catch(err => {
                console.error('OAuthSuccess (V5): Login update failed:', err);
                toast.error('Authentication error.');
                navigate('/', { replace: true });
            });
        } else {
            console.error('OAuthSuccess (V5): Missing or invalid parameters.', { hasToken: !!token, role });
            if (!token || !role) {
                toast.error('Login failed: Authentication parameters missing.');
            } else if (!validRoles.includes(role)) {
                toast.error(`Login failed: Invalid role "${role}".`);
            }
            navigate('/', { replace: true });
        }
    }, [navigate, login, location.pathname]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="loading-spinner"></div>
            <p className="ml-3">Logging you in...</p>
        </div>
    );
};

export default OAuthSuccess;
