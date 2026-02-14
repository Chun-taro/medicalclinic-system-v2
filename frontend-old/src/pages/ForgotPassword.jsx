import './Style/Auth.css';
import { useState } from 'react';
import axios from 'axios';
import logo from './assets/logo.png';
import backgroundImage from './assets/building.png'; 

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');

  const handleSendToken = async () => {
    if (!email) return alert('Please enter your email');
    try {
      await axios.post('http://localhost:5000/api/reset/send-token', { email });
      setMessage('Verification code sent to your email');
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error sending token');
    }
  };

  const handleVerifyToken = async () => {
    if (!token) return alert('Enter the code sent to your email');
    try {
      await axios.post('http://localhost:5000/api/reset/verify-token', { email, token });
      setMessage('Code verified. You may now reset your password.');
      setStep(3);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Invalid or expired token');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) return alert('Enter a new password');
    try {
      await axios.post('http://localhost:5000/api/reset/reset-password', {
        email,
        token,
        newPassword
      });
      alert('Password reset successful');
      window.location.href = '/';
    } catch (err) {
      setMessage(err.response?.data?.error || 'Reset failed');
    }
  };

  return (
    <div
      className="auth-wrapper"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="image-overlay"></div>

      <div className="auth-right">
        <div className="form-wrapper">
          <div className="form-header center-align">
            <img src={logo} alt="BukSU Medical Logo" className="clinic-logo" />
            <h2 className="clinic-title">Reset Password</h2>
            <hr className="form-divider" />
          </div>

          {step === 1 && (
            <>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button onClick={handleSendToken}>Send Verification Code</button>
            </>
          )}

          {step === 2 && (
            <>
              <input
                type="text"
                placeholder="Enter code from email"
                value={token}
                onChange={e => setToken(e.target.value)}
              />
              <button onClick={handleVerifyToken}>Verify Code</button>
            </>
          )}

          {step === 3 && (
            <>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button onClick={handleResetPassword}>Reset Password</button>
            </>
          )}

          {message && <p className="info-message">{message}</p>}

          <p className="back-link">
            <span onClick={() => window.location.href = '/'}>Back to Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}