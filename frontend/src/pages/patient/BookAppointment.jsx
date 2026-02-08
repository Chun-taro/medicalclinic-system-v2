import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PatientLayout from './PatientLayout';
import { showSuccess, showError, showWarning } from '../../utils/toastNotifier';
import './Style/book-appointment.css';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  appointmentDate: '',
  purpose: '',
  additionalNotes: ''
};

export default function BookAppointment() {
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const navigate = useNavigate();

  //  Fetch user profile and pre-fill form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = res.data;

        // Check for profile completeness
        const requiredFields = [
          'birthday',
          'homeAddress',
          'sex',
          'civilStatus',
          'contactNumber',
          'bloodType',
        ];

        const isPersonalDataComplete = requiredFields.every(field => user[field]);
        const isEmergencyContactComplete = user.emergencyContact?.name && user.emergencyContact?.phone;

        if (isPersonalDataComplete && isEmergencyContactComplete) {
          setIsProfileComplete(true);
        } else {
          setIsProfileComplete(false);
        }

        setForm(prev => ({
          ...prev,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.contactNumber || '',
          address: user.homeAddress || ''
        }));
      } catch (err) {
        setIsProfileComplete(false);
        console.error('Error fetching profile:', err.message);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []); 

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.appointmentDate || !form.purpose) {
      showWarning('Please fill out all required fields.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        appointmentDate: new Date(form.appointmentDate).toISOString()
      };

      await axios.post('http://localhost:5000/api/appointments/book', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('Appointment scheduled successfully!');
      setForm(initialFormState);
    } catch (err) {
      console.error('Booking error:', err.response?.data || err.message);
      showError(err.response?.data?.error || 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientLayout>
      <div className="doctor-form-container">
        {profileLoading ? (
          <p>Checking profile status...</p>
        ) : isProfileComplete ? (
          <>
            <h2>Doctor Appointment Request Form</h2>
            <p>Please fill in the form below to schedule an appointment.</p>
            <form onSubmit={handleSubmit} className="doctor-form">
              <input type="text" name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} required />
              <input type="text" name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
              <input type="tel" name="phone" placeholder="Your phone" value={form.phone} onChange={handleChange} required />
              <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} />
              <input type="date" name="appointmentDate" placeholder="Pick the date" value={form.appointmentDate} onChange={handleChange} required />
              <label htmlFor="purpose" style={{ display: 'block', marginTop: '12px', fontWeight: 'bold' }}>Appointment Type *</label>
              <select name="purpose" value={form.purpose} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}>
                <option value="">-- Select Appointment Type --</option>
                <option value="Checkup">🩺 Checkup</option>
                <option value="Medical Certificate">📄 Medical Certificate</option>
              </select>
              <textarea name="additionalNotes" placeholder="Additional notes or details (optional)" style={{ marginTop: '12px' }} rows={3} />
              <button type="submit" className="schedule-button" disabled={loading}>
                {loading ? 'Scheduling...' : 'SCHEDULE'}
              </button>
            </form>
          </>
        ) : (
          <div className="profile-incomplete-warning">
            <h2>Complete Your Profile First</h2>
            <p>
              Your Medical Record is incomplete. You must complete your profile before you can book an appointment.
            </p>
            <button className="go-to-profile-btn" onClick={() => navigate('/patient-profile')}>
              Go to My Profile
            </button>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
