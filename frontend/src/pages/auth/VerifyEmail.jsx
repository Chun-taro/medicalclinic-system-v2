import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import './Auth.css';
import logo from '../../assets/logo.png';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await api.get(`/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(res.data.message || 'Email verified successfully!');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
            }
        };

        if (token) {
            verify();
        } else {
            setStatus('error');
            setMessage('Invalid verification link.');
        }
    }, [token]);

    return (
        <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="auth-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                <div className="auth-header">
                    <img src={logo} alt="Logo" className="auth-logo" onClick={() => navigate('/')} />
                    <h2 className="auth-title">Email Verification</h2>
                </div>

                <div className="verification-status" style={{ margin: '2rem 0' }}>
                    {status === 'verifying' && (
                        <div className="status-verifying">
                            <Loader className="animate-spin" size={48} color="var(--primary)" style={{ margin: '0 auto' }} />
                            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Verifying your email address...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="status-success">
                            <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto' }} />
                            <p style={{ marginTop: '1.5rem', color: '#10b981', fontWeight: 600, fontSize: '1.2rem' }}>{message}</p>
                            <button
                                className="btn-auth"
                                style={{ marginTop: '2rem' }}
                                onClick={() => navigate('/login')}
                            >
                                Go to Login
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="status-error">
                            <XCircle size={64} color="var(--error)" style={{ margin: '0 auto' }} />
                            <p style={{ marginTop: '1.5rem', color: 'var(--error)', fontWeight: 600 }}>{message}</p>
                            <button
                                className="btn-auth"
                                style={{ marginTop: '2rem' }}
                                onClick={() => navigate('/signup')}
                            >
                                Back to Signup
                            </button>
                        </div>
                    )}
                </div>

                <div className="auth-footer">
                    Need help? <a href="mailto:support@buksu.edu.ph" className="text-link">Contact Support</a>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
