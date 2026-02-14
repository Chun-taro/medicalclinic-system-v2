import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Recaptcha from '../../components/ui/Recaptcha';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './Auth.css';
import buildingImg from '../../assets/building.png';
import googleLogo from '../../assets/google-logo.png';
import logo from '../../assets/logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [recaptchaToken, setRecaptchaToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [logoClicks, setLogoClicks] = useState(0);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Logo secret click for Superadmin
    useEffect(() => {
        if (logoClicks > 0) {
            const timer = setTimeout(() => setLogoClicks(0), 2000);
            return () => clearTimeout(timer);
        }
    }, [logoClicks]);

    useEffect(() => {
        if (logoClicks === 5) {
            navigate('/superadmin-login');
        }
    }, [logoClicks, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!recaptchaToken) {
            toast.error('Please verify that you are not a robot');
            return;
        }

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/login', {
                email,
                password,
                recaptchaToken
            });

            const { token, role, user } = res.data; // Ensure backend returns user object, or we fetch it

            // If user object is missing in login response, login function in AuthContext attempts to fetch it logic
            // But let's assume valid response for now
            await login(token, role, user); // Await login to ensure state updates if needed

            toast.success('Login successful!');

            const dashboardMap = {
                patient: '/patient-dashboard',
                admin: '/admin-dashboard',
                superadmin: '/superadmin-dashboard',
                doctor: '/doctor-feedback', // As per old ProtectedRoute
                nurse: '/admin-dashboard' // As per old ProtectedRoute
            };

            navigate(dashboardMap[role] || '/');

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.');
            setRecaptchaToken(''); // Reset recaptcha on failure
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Left Side - Image */}
            <div
                className="auth-sidebar"
                style={{ backgroundImage: `url(${buildingImg})` }}
            >
                <div className="auth-overlay"></div>
                <div className="auth-sidebar-content">
                    <h1 className="auth-sidebar-title">BukSU<br />Medical Clinic</h1>
                    <p className="auth-sidebar-text">
                        Providing accessible, high-quality healthcare services to the Bukidnion State University community.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-header">
                        <img
                            src={logo}
                            alt="Logo"
                            className="auth-logo"
                            onClick={() => setLogoClicks(c => c + 1)}
                        />
                        <h2 className="auth-title">Welcome Back</h2>
                        <p className="auth-subtitle">Sign in to your account to continue</p>
                    </div>

                    <form className="auth-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Email or phone number"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <div style={{ textAlign: 'right' }}>
                                <span
                                    className="text-link"
                                    style={{ fontSize: '0.875rem' }}
                                    onClick={() => navigate('/forgot-password')}
                                >
                                    Forgot Password?
                                </span>
                            </div>
                        </div>

                        <div className="recaptcha-wrapper">
                            <Recaptcha
                                onVerify={setRecaptchaToken}
                                onExpire={() => setRecaptchaToken('')}
                            />
                        </div>

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>Or continue with</span>
                    </div>

                    <a href={`${import.meta.env.VITE_API_URL}/auth/google`} className="btn-google">
                        <img src={googleLogo} alt="Google" />
                        <span>Google</span>
                    </a>

                    <div className="auth-footer">
                        Don't have an account?{' '}
                        <span className="text-link" onClick={() => navigate('/signup')}>
                            Sign up
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
