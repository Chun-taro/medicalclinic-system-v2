import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './Auth.css';
import buildingImg from '../../assets/building.png';
import logo from '../../assets/logo.png';

const GoogleSignup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        googleId: '',
        email: '',
        firstName: '',
        lastName: '',
        middleName: '',
        idNumber: '',
        contactNumber: '',
        role: 'patient', // Default to patient for Google signup
        password: 'OAUTH_USER' // Dummy password for backend schema if required
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setForm(prev => ({
            ...prev,
            googleId: params.get('googleId') || '',
            email: params.get('email') || '',
            firstName: params.get('firstName') || '',
            lastName: params.get('lastName') || ''
        }));
    }, [location]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (!form.idNumber || !form.contactNumber) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!form.email.endsWith('@student.buksu.edu.ph')) {
            toast.error('Only BukSU student emails are allowed for patient registration.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/google-signup', {
                ...form,
                recaptchaToken: 'BYPASSED_FOR_GOOGLE' // Backend needs to handle this or we add recaptcha
            });

            const { token, role } = res.data;
            await login(token, role, null);

            toast.success('Registration successful!');
            navigate('/patient-dashboard');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-sidebar" style={{ backgroundImage: `url(${buildingImg})` }}>
                <div className="auth-overlay"></div>
                <div className="auth-sidebar-content">
                    <h1 className="auth-sidebar-title">Complete Your Profile</h1>
                    <p className="auth-sidebar-text">Just a few more details to get you started with your BukSU Medical Clinic account.</p>
                </div>
            </div>

            <div className="auth-content">
                <div className="auth-card" style={{ maxWidth: '600px' }}>
                    <div className="auth-header">
                        <img src={logo} alt="Logo" className="auth-logo" onClick={() => navigate('/')} />
                        <h2 className="auth-title">Welcome, {form.firstName}!</h2>
                        <p className="auth-subtitle">Please provide your university details</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSignup}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                type="text"
                                name="firstName"
                                className="form-control"
                                placeholder="First Name"
                                value={form.firstName}
                                disabled
                            />
                            <input
                                type="text"
                                name="lastName"
                                className="form-control"
                                placeholder="Last Name"
                                value={form.lastName}
                                disabled
                            />
                        </div>

                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Email"
                            value={form.email}
                            disabled
                        />

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
                                placeholder="ID Number (e.g., 20XXXXXX) *"
                                value={form.idNumber}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                            <input
                                type="tel"
                                name="contactNumber"
                                className="form-control"
                                placeholder="Contact Number *"
                                value={form.contactNumber}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? 'Completing Registration...' : 'Complete Signup'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GoogleSignup;
