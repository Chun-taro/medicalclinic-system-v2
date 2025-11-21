import './Style/Auth.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Recaptcha from '../components/Recaptcha';
import logo from './assets/logo.png';
import GoogleLogo from './assets/google-logo.png';
import backgroundImage from './assets/building.png';
import { usePatient } from '../context/PatientContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const navigate = useNavigate();
  const { setPatient } = usePatient();

  const handleRecaptchaVerify = (token) => {
    setRecaptchaToken(token);
    setRecaptchaError('');
  };

  const handleRecaptchaExpire = () => {
    setRecaptchaToken('');
    setRecaptchaError('reCAPTCHA expired. Please verify again.');
  };

  const handleLogin = async () => {
    if (!recaptchaToken) {
      setRecaptchaError('Please complete the reCAPTCHA verification.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        ...form,
        recaptchaToken
      });

      const { token, userId, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('role', role);

      const profileRes = await axios.get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileRes.status === 200) {
        setPatient(profileRes.data);
      }

      navigate(role === 'admin' ? '/admin-dashboard' : '/patient-dashboard');
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
  <form className="form-wrapper" onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{position: 'relative'}}>
    <div className="form-header center-align">
      <img src={logo} alt="BukSU Medical Logo" className="clinic-logo" />
      <h2 className="clinic-title">BukSU<br />Medical Clinic</h2>
      <hr className="form-divider" />
    </div>

    <input
      type="text"
      placeholder="Email or phone number"
      autoComplete="username"
      value={form.email}
      onChange={e => setForm({ ...form, email: e.target.value })}
    />

    <input
      type="password"
      placeholder="Password"
      autoComplete="current-password"
      value={form.password}
      onChange={e => setForm({ ...form, password: e.target.value })}
    />

    <div className="recaptcha-container">
      <Recaptcha
        onVerify={handleRecaptchaVerify}
        onExpire={handleRecaptchaExpire}
      />
      {recaptchaError && <p className="recaptcha-error">{recaptchaError}</p>}
    </div>

    <button type="submit">Continue →</button>
<p className="google-label">Or continue with Google</p>
    <a href="http://localhost:5000/api/auth/google" className="google-button">
      <img src={GoogleLogo} alt="Google logo" className="google-icon" />
    </a>
    <p>
      Don't have an account?{' '}
      <span role="button" tabIndex={0} onClick={() => navigate('/signup')}>
        Register here
      </span>
    </p>

    <p className="forgot-password">
      <span role="button" tabIndex={0} onClick={() => navigate('/forgot-password')}>
        Forgot Password?
      </span>
    </p>

    {/* Secret superadmin login button */}
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        width: '20px',
        height: '20px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '50%',
        cursor: 'pointer',
        border: '1px solid rgba(0,0,0,0.3)'
      }}
      onClick={() => navigate('/superadmin-login')}
      title="Superadmin Login"
      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.5)'}
      onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.2)'}
    ></div>

  </form>
</div>
    </div>
  );
}