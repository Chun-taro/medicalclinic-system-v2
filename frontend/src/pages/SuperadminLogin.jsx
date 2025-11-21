import './Style/Auth.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from './assets/logo.png';
import backgroundImage from './assets/building.png';

export default function SuperadminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/superadmin-login', form);

      const { token, userId, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('role', role);

      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
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
        <form className="form-wrapper" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="form-header center-align">
            <img src={logo} alt="BukSU Medical Logo" className="clinic-logo" />
            <h2 className="clinic-title">BukSU<br />Medical Clinic</h2>
            <hr className="form-divider" />
            <h3>Superadmin Login</h3>
          </div>

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />

          <button type="submit">Login as Superadmin</button>

          <p>
            <span role="button" tabIndex={0} onClick={() => navigate('/')}>
              Back to Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
