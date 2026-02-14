import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './Auth.css';
import buildingImg from '../../assets/building.png';
import logo from '../../assets/logo.png';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendToken = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email');
            return;
        }
        setLoading(true);
        try {
            await api.post('/reset/send-token', { email });
            toast.success('Verification code sent to your email');
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error sending token. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyToken = async (e) => {
        e.preventDefault();
        if (!token) {
            toast.error('Please enter the verification code');
            return;
        }
        setLoading(true);
        try {
            await api.post('/reset/verify-token', { email, token });
            toast.success('Code verified. You may now reset your password.');
            setStep(3);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid or expired token');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword) {
            toast.error('Please enter a new password');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await api.post('/reset/reset-password', {
                email,
                token,
                newPassword
            });
            toast.success('Password reset successful. Please login.');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Reset failed. Please try again.');
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
                    <h1 className="auth-sidebar-title">Account Recovery</h1>
                    <p className="auth-sidebar-text">
                        Follow the steps to recover your access to the Medical Clinic System.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-header">
                        <img src={logo} alt="Logo" className="auth-logo" onClick={() => navigate('/')} />
                        <h2 className="auth-title">Reset Password</h2>
                        <p className="auth-subtitle">
                            {step === 1 && "Enter your email to receive a verification code"}
                            {step === 2 && "Enter the verification code sent to your email"}
                            {step === 3 && "Create a new password for your account"}
                        </p>
                    </div>

                    <form className="auth-form" onSubmit={
                        step === 1 ? handleSendToken :
                            step === 2 ? handleVerifyToken :
                                handleResetPassword
                    }>

                        {step === 1 && (
                            <div className="form-group">
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Verification Code"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        {step === 3 && (
                            <div className="form-group">
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? 'Processing...' :
                                step === 1 ? 'Send Verification Code' :
                                    step === 2 ? 'Verify Code' :
                                        'Reset Password'}
                        </button>

                        {step > 1 && (
                            <button
                                type="button"
                                className="btn-text"
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '0.5rem' }}
                                onClick={() => setStep(step - 1)}
                            >
                                Back
                            </button>
                        )}

                    </form>

                    <div className="auth-footer">
                        Remember your password?{' '}
                        <span className="text-link" onClick={() => navigate('/')}>
                            Back to Login
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
