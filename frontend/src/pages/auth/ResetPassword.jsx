import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './Auth.css';
import buildingImg from '../../assets/building.png';
import logo from '../../assets/logo.png';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Get query params
    const query = new URLSearchParams(location.search);
    const email = query.get('email');
    const token = query.get('token');

    const handleReset = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
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
            toast.error(err.response?.data?.error || 'Reset failed. Token may be invalid or expired.');
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
                    <h1 className="auth-sidebar-title">Reset Password</h1>
                    <p className="auth-sidebar-text">
                        Secure your account with a new password.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-header">
                        <img src={logo} alt="Logo" className="auth-logo" onClick={() => navigate('/')} />
                        <h2 className="auth-title">Set New Password</h2>
                        <p className="auth-subtitle">
                            Enter your new password below
                        </p>
                    </div>

                    <form className="auth-form" onSubmit={handleReset}>
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

                        <div className="form-group">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? 'Reseting Password...' : 'Reset Password'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <span className="text-link" onClick={() => navigate('/')}>
                            Back to Login
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
