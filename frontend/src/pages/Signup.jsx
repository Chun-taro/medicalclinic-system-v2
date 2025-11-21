import './Style/Signup.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Recaptcha from '../components/Recaptcha';
import backgroundImage from './assets/building.png';

export default function Signup() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', middleName: '', email: '', password: '',
    role: 'patient', idNumber: '', sex: '', civilStatus: '', birthday: '',
    age: '', homeAddress: '', contactNumber: '',
    emergencyContact: { name: '', relationship: '', phone: '' },
    bloodType: '', allergies: [], medicalHistory: [], currentMedications: [],
    familyHistory: { diabetes: false, hypertension: false, heartDisease: false, cancer: false, other: '' }
  });

  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRecaptchaVerify = token => {
    setRecaptchaToken(token);
    setRecaptchaError('');
  };

  const handleRecaptchaExpire = () => {
    setRecaptchaToken('');
    setRecaptchaError('reCAPTCHA expired. Please verify again.');
  };

  const handleSignup = async () => {
    const { firstName, lastName, email, password, idNumber, contactNumber } = form;
    if (!firstName || !lastName || !email || !password || !idNumber || !contactNumber) {
      alert('Please fill out all required fields.');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
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

      alert('Signup successful');
      navigate(`/${res.data.role}-dashboard`);
    } catch (err) {
      alert(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="signup-overlay"></div>

      <div className="signup-right">
        <div className="signup-form">
          <h2>Create Your Account</h2>

          <a href="http://localhost:5000/api/auth/google">
            <button className="google-button">Sign Up with Google</button>
          </a>

          {/* Personal Info */}
          <input type="text" placeholder="First Name *" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
          <input type="text" placeholder="Last Name *" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          <input type="text" placeholder="Middle Name" value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} />
          <input type="text" placeholder="ID Number *" required value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} />
          <input type="email" placeholder="Email Address *" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Password *" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <input type="tel" placeholder="Contact Number *" required value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
          <input type="date" placeholder="Date of Birth" value={form.birthday} onChange={e => setForm({ ...form, birthday: e.target.value })} />

          <select value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <select value={form.civilStatus} onChange={e => setForm({ ...form, civilStatus: e.target.value })}>
            <option value="">Civil Status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="widowed">Widowed</option>
            <option value="divorced">Divorced</option>
          </select>

          <input type="text" placeholder="Home Address" value={form.homeAddress} onChange={e => setForm({ ...form, homeAddress: e.target.value })} />

          <select value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })}>
            <option value="">Blood Type</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
              <option key={bt} value={bt}>{bt}</option>
            ))}
          </select>

          {/* Emergency Contact */}
          <div className="section-divider">Emergency Contact</div>
          <input type="text" placeholder="Contact Name" value={form.emergencyContact.name} onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} />
          <input type="text" placeholder="Relationship" value={form.emergencyContact.relationship} onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relationship: e.target.value } })} />
          <input type="tel" placeholder="Phone Number" value={form.emergencyContact.phone} onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })} />

          {/* Recaptcha */}
          <div className="recaptcha-container">
            <Recaptcha onVerify={handleRecaptchaVerify} onExpire={handleRecaptchaExpire} />
            {recaptchaError && <p className="recaptcha-error">{recaptchaError}</p>}
          </div>

          <button onClick={handleSignup} disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>

          <p>
            Already have an account? <span onClick={() => navigate('/')}>Login here</span>
          </p>
        </div>
      </div>
    </div>
  );
}