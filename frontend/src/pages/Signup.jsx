import './Style/Signup.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Recaptcha from '../components/Recaptcha';
import GoogleLogo from './assets/google-logo.png';
import backgroundImage from './assets/building.png';

export default function Signup() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', middleName: '', email: '', password: '',
    role: 'patient', idNumber: '', contactNumber: ''
  });

  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', icon: '', message: '', isSuccess: false });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handleRecaptchaVerify = token => {
    setRecaptchaToken(token);
    setRecaptchaError('');
  };

  const handleRecaptchaExpire = () => {
    setRecaptchaToken('');
    setRecaptchaError('reCAPTCHA expired. Please verify again.');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password, idNumber, contactNumber } = form;
    if (!firstName || !lastName || !email || !password || !idNumber || !contactNumber) {
      setModalData({ title: 'Missing Information', icon: '⚠️', message: 'Please fill out all required fields.' });
      setShowModal(true);
      return;
    }
    if (!email.endsWith('@student.buksu.edu.ph')) {
      setModalData({
        title: 'Invalid Email',
        icon: '📧',
        message: 'Please use a valid BukSU student email (@student.buksu.edu.ph).'
      });
      setShowModal(true);
      return;
    }
    if (password.length < 6) {
      setModalData({ title: 'Weak Password', icon: '🔑', message: 'Password must be at least 6 characters long.' });
      setShowModal(true);
      return;
    }
    if (!recaptchaToken) {
      setRecaptchaError('Please complete the reCAPTCHA verification.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/auth/signup', { ...form, recaptchaToken }, {
        headers: { 'Content-Type': 'application/json' }
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('role', res.data.role);

      setModalData({
        title: 'Success!',
        icon: '✅',
        message: 'Your account has been created successfully. You will now be redirected.',
        isSuccess: true
      });
      setShowModal(true);
    } catch (err) {
      setModalData({ title: 'Signup Failed', icon: '❌', message: err.response?.data?.error || 'An unexpected error occurred. Please try again.' });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="signup-overlay"></div>

      <div className="signup-right">
        <form className="signup-form" onSubmit={handleSignup}>
          <h2>Create Your Account</h2>
 
          <a href="http://localhost:5000/api/auth/google" className="google-button">
            <img src={GoogleLogo} alt="Google logo" className="google-icon" />
            <span>Sign Up with Google</span>
          </a>

          {/* Personal Info */}
          <input type="text" name="firstName" placeholder="First Name *" required value={form.firstName} onChange={handleChange} />
          <input type="text" name="lastName" placeholder="Last Name *" required value={form.lastName} onChange={handleChange} />
          <input type="text" name="middleName" placeholder="Middle Name" value={form.middleName} onChange={handleChange} />
          <input type="text" name="idNumber" placeholder="ID Number *" required value={form.idNumber} onChange={handleChange} />
          <input type="email" name="email" placeholder="Email Address *" required value={form.email} onChange={handleChange} />
          <input type="password" name="password" placeholder="Password *" required value={form.password} onChange={handleChange} />
          <input type="tel" name="contactNumber" placeholder="Contact Number *" required value={form.contactNumber} onChange={handleChange} />

          {/* Recaptcha */}
          <div className="recaptcha-container">
            <Recaptcha onVerify={handleRecaptchaVerify} onExpire={handleRecaptchaExpire} />
            {recaptchaError && <p className="recaptcha-error">{recaptchaError}</p>}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>

          <p>
            Already have an account? <span onClick={() => navigate('/')}>Login here</span>
          </p>
        </form>
      </div>

      {showModal && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <div className="popup-icon">{modalData.icon}</div>
              <h3>{modalData.title}</h3>
            </div>
            <div className="popup-body">
              <p>{modalData.message}</p>
            </div>
            <div className="popup-footer">
              <button className="popup-btn-primary" onClick={() => {
                setShowModal(false);
                if (modalData.isSuccess) {
                  navigate(`/${localStorage.getItem('role')}-dashboard`);
                }
              }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}