import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Recaptcha from '../../components/ui/Recaptcha';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './Auth.css';
import buildingImg from '../../assets/building.png';
import googleLogo from '../../assets/google-logo.png';
import logo from '../../assets/logo.png';

const Signup = () => {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'patient',
        idNumber: '',
        contactNumber: ''
    });
    const [recaptchaToken, setRecaptchaToken] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        // Validation
        if (!form.firstName || !form.lastName || !form.email || !form.password || !form.idNumber || !form.contactNumber) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!form.email.endsWith('@student.buksu.edu.ph')) {
            toast.error('Please use a valid BukSU student email (@student.buksu.edu.ph)');
            return;
        }

        if (form.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!recaptchaToken) {
            toast.error('Please verify that you are not a robot');
            return;
        }

        setLoading(true);
        try {
            const { confirmPassword, ...signupData } = form;

            const res = await api.post('/auth/signup', {
                ...signupData,
                recaptchaToken
            });

            toast.success('Account created successfully! Please check your email to verify your account before logging in.', {
                autoClose: 10000
            });
            navigate('/login');

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Signup failed. Please try again.');
            setRecaptchaToken('');
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
                    <h1 className="auth-sidebar-title">Join Us</h1>
                    <p className="auth-sidebar-text">
                        Create your account to access medical services, book appointments, and manage your health records.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-content">
                <div className="auth-card" style={{ maxWidth: '600px' }}>
                    <div className="auth-header">
                        <img src={logo} alt="Logo" className="auth-logo" onClick={() => navigate('/')} />
                        <h2 className="auth-title">Create Account</h2>
                        <p className="auth-subtitle">Fill in your details to register</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSignup}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                type="text"
                                name="firstName"
                                className="form-control"
                                placeholder="First Name *"
                                value={form.firstName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                            <input
                                type="text"
                                name="lastName"
                                className="form-control"
                                placeholder="Last Name *"
                                value={form.lastName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <input
                            type="text"
                            name="middleName"
                            className="form-control"
                            placeholder="Middle Name"
                            value={form.middleName}
                            onChange={handleChange}
                            disabled={loading}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                type="text"
                                name="idNumber"
                                className="form-control"
                                placeholder="ID Number *"
                                value={form.idNumber}
                                onChange={handleChange}
                                disabled={loading}
                            />
                            <input
                                type="tel"
                                name="contactNumber"
                                className="form-control"
                                placeholder="Contact Number *"
                                value={form.contactNumber}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="BukSU Email (@student.buksu.edu.ph) *"
                            value={form.email}
                            onChange={handleChange}
                            disabled={loading}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                type="password"
                                name="password"
                                className="form-control"
                                placeholder="Password *"
                                value={form.password}
                                onChange={handleChange}
                                disabled={loading}
                            />
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-control"
                                placeholder="Confirm Password *"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="recaptcha-wrapper">
                            <Recaptcha
                                onVerify={setRecaptchaToken}
                                onExpire={() => setRecaptchaToken('')}
                            />
                        </div>

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>Or register with</span>
                    </div>

                    <a href={`${import.meta.env.VITE_API_URL}/auth/google`} className="btn-google">
                        <img src={googleLogo} alt="Google" />
                        <span>Google</span>
                    </a>

                    <div className="auth-footer">
                        Already have an account?{' '}
                        <span className="text-link" onClick={() => navigate('/')}>
                            Sign in
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
