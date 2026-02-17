import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

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
        const role = params.get('role');
        const userId = params.get('userId');

        console.log('OAuthSuccess (V5): Params extracted (role/userId):', { role, userId });

        const validRoles = ['patient', 'admin', 'superadmin', 'doctor', 'nurse'];

        if (role && validRoles.includes(role)) {
            hasRun.current = true; // Set this immediately

            console.log('OAuthSuccess (V5): Exchanging cookie for token...');

            // Perform secure token exchange
            api.post('/auth/oauth-token-exchange').then(response => {
                const { token } = response.data;
                console.log('OAuthSuccess (V5): Exchange successful, calling login context...');

                return login(token, role, null);
            }).then(() => {
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
                console.error('OAuthSuccess (V5): Secure exchange or login failed:', err);
                toast.error('Authentication error: ' + (err.response?.data?.error || 'Failed to retrieve session'));
                navigate('/', { replace: true });
            });
        } else {
            console.error('OAuthSuccess (V5): Missing or invalid parameters.', { role });
            if (!role) {
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
