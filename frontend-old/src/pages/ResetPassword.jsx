import './Style/Auth.css';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const email = query.get('email');
  const token = query.get('token');

  const handleReset = async () => {
    if (!newPassword) return alert('Enter a new password');
    try {
      await axios.post('http://localhost:5000/api/reset/reset-password', {
        email,
        token,
        newPassword
      });
      alert('Password reset successful');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Reset failed');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="form-wrapper">
          <h2>Reset Password</h2>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <button onClick={handleReset}>Reset Password</button>

          {/*  Back to Login link */}
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#555' }}>
            <span
              onClick={() => navigate('/')}
              style={{ color: '#0077cc', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to Login
            </span>
          </p>
        </div>
      </div>
      <div className="auth-right">
        <img src="https://buksu.edu.ph/wp-content/uploads/2020/11/DSC_6474.jpg" alt="Background" />
      </div>
    </div>
  );
}