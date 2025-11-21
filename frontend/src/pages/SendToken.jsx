import './Style/Auth.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SendToken() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!email) return alert('Enter your email');
    try {
      const res = await axios.post('http://localhost:5000/api/reset/send-token', { email });
      setMessage(res.data.message);
      setTimeout(() => {
        navigate(`/verify-token?email=${email}`);
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error sending token');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="form-wrapper">
          <h2>Forgot Password</h2>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button onClick={handleSend}>Send Verification Code</button>
          {message && <p style={{ marginTop: '1rem', color: '#0077cc' }}>{message}</p>}
        </div>
      </div>
      <div className="auth-right">
        <img src="https://buksu.edu.ph/wp-content/uploads/2020/11/DSC_6474.jpg" alt="Background" />
      </div>
    </div>
  );
}