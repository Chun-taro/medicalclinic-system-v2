import './Style/Auth.css';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function VerifyToken() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const email = query.get('email');

  const handleVerify = async () => {
    if (!token) return alert('Enter the code');
    try {
      const res = await axios.post('http://localhost:5000/api/reset/verify-token', { email, token });
      setMessage(res.data.message);
      setTimeout(() => {
        navigate(`/reset-password?email=${email}&token=${token}`);
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Invalid or expired token');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="form-wrapper">
          <h2>Enter Verification Code</h2>
          <input
            type="text"
            placeholder="Code from email"
            value={token}
            onChange={e => setToken(e.target.value)}
          />
          <button onClick={handleVerify}>Verify</button>
          {message && <p style={{ marginTop: '1rem', color: '#0077cc' }}>{message}</p>}
        </div>
      </div>
      <div className="auth-right">
        <img src="https://buksu.edu.ph/wp-content/uploads/2020/11/DSC_6474.jpg" alt="Background" />
      </div>
    </div>
  );
}