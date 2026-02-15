import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const OAuthSuccess = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        console.log('Current URL:', window.location.href);
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const role = params.get('role');
        const userId = params.get('userId');

        console.log('Extracted Params:', { token: !!token, role, userId });

        if (token && role) {
            // We can fetch user details here or let AuthContext handle it
            // But login() expects (token, role, userObject)
            // We don't have userObject yet, but AuthContext.login fetches it if missing

            login(token, role, null).then(() => {
                toast.success('Login successful!');
                const dashboardMap = {
                    patient: '/patient-dashboard',
                    admin: '/admin-dashboard',
                    superadmin: '/superadmin-dashboard',
                    doctor: '/doctor-feedback',
                    nurse: '/admin-dashboard'
                };
                navigate(dashboardMap[role] || '/');
            });
        } else {
            console.error('Missing OAuth params');
            navigate('/');
        }
    }, [navigate, login]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="loading-spinner"></div>
            <p className="ml-3">Logging you in...</p>
        </div>
    );
};

export default OAuthSuccess;
