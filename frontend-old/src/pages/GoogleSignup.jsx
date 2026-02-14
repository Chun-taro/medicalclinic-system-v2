import './Style/Signup.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Recaptcha from '../components/Recaptcha';

export default function GoogleSignup() {
  const [form, setForm] = useState({
    googleId: '',
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    role: 'patient',
    idNumber: '',
    sex: '',
    civilStatus: '',
    birthday: '',
    age: '',
    homeAddress: '',
    contactNumber: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    bloodType: '',
    allergies: [],
    medicalHistory: [],
    currentMedications: [],
    familyHistory: {
      diabetes: false,
      hypertension: false,
      heartDisease: false,
      cancer: false,
      other: ''
    }
  });

  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleId = params.get('googleId');
    const email = params.get('email');
    const firstName = params.get('firstName');
    const lastName = params.get('lastName');

    if (googleId && email && firstName && lastName) {
      setForm(prev => ({
        ...prev,
        googleId,
        email,
        firstName,
        lastName
      }));
    } else {
      navigate('/signup');
    }
  }, [navigate]);

  const handleRecaptchaVerify = (token) => {
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
      const res = await axios.post(
        'http://localhost:5000/api/auth/google-signup',
        { ...form, recaptchaToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('googleId', res.data.googleId);

      alert('Signup successful');
      navigate(`/${res.data.role}-dashboard`);
    } catch (err) {
      alert(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-left">
        <img
          src="https://buksu.edu.ph/wp-content/uploads/2020/11/DSC_6474.jpg"
          alt="Medical background"
        />
        <div className="image-overlay"></div>
      </div>

      <div className="signup-right">
        <div className="signup-form">
          <h2>Complete Your Registration</h2>

          {/* Personal Info */}
          <input type="text" value={form.firstName} disabled style={{ backgroundColor: '#f5f5f5' }} />
          <input type="text" value={form.lastName} disabled style={{ backgroundColor: '#f5f5f5' }} />
          <input type="email" value={form.email} disabled style={{ backgroundColor: '#f5f5f5' }} />

          <input
            type="text"
            placeholder="Middle Name"
            value={form.middleName}
            onChange={e => setForm({ ...form, middleName: e.target.value })}
          />
          <input
            type="text"
            placeholder="ID Number *"
            value={form.idNumber}
            onChange={e => setForm({ ...form, idNumber: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password *"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Contact Number *"
            value={form.contactNumber}
            onChange={e => setForm({ ...form, contactNumber: e.target.value })}
          />
          <input
            type="date"
            placeholder="Date of Birth"
            value={form.birthday}
            onChange={e => setForm({ ...form, birthday: e.target.value })}
          />
          <select
            value={form.sex}
            onChange={e => setForm({ ...form, sex: e.target.value })}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <select
            value={form.civilStatus}
            onChange={e => setForm({ ...form, civilStatus: e.target.value })}
          >
            <option value="">Civil Status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="widowed">Widowed</option>
            <option value="divorced">Divorced</option>
          </select>
          <input
            type="text"
            placeholder="Home Address"
            value={form.homeAddress}
            onChange={e => setForm({ ...form, homeAddress: e.target.value })}
          />
          <select
            value={form.bloodType}
            onChange={e => setForm({ ...form, bloodType: e.target.value })}
          >
            <option value="">Blood Type</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
              <option key={bt} value={bt}>{bt}</option>
            ))}
          </select>

          {/* Emergency Contact */}
          <input
            type="text"
            placeholder="Emergency Contact Name"
            value={form.emergencyContact.name}
            onChange={e =>
              setForm({
                ...form,
                emergencyContact: { ...form.emergencyContact, name: e.target.value }
              })
            }
          />
          <input
            type="text"
            placeholder="Emergency Contact Relationship"
            value={form.emergencyContact.relationship}
            onChange={e =>
              setForm({
                ...form,
                emergencyContact: { ...form.emergencyContact, relationship: e.target.value }
              })
            }
          />
          <input
            type="tel"
            placeholder="Emergency Contact Phone"
            value={form.emergencyContact.phone}
            onChange={e =>
              setForm({
                ...form,
                emergencyContact: { ...form.emergencyContact, phone: e.target.value }
              })
            }
          />

          {/* Recaptcha */}
          <div className="recaptcha-container">
            <Recaptcha onVerify={handleRecaptchaVerify} onExpire={handleRecaptchaExpire} />
            {recaptchaError && <p className="recaptcha-error">{recaptchaError}</p>}
          </div>

          <button onClick={handleSignup} disabled={loading}>
            {loading ? 'Completing Registration...' : 'Complete Registration'}
          </button>

          <p>
            Already have an account?{' '}
            <span onClick={() => navigate('/')}>Login here</span>
          </p>
        </div>
      </div>
    </div>
  );
}