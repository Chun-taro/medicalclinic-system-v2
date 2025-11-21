import { useState, useEffect } from 'react';
import axios from 'axios';
import PatientLayout from './PatientLayout';
import './Style/book-appointment.css';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  appointmentDate: '',
  purpose: '',
  isMedicalCertificate: false,
  isCheckup: false
};

export default function BookAppointment() {
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  //  Fetch user profile and pre-fill form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = res.data;
        setForm(prev => ({
          ...prev,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.contactNumber || '',
          address: user.homeAddress || ''
        }));
      } catch (err) {
        console.error('Error fetching profile:', err.message);
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

    let purpose = form.purpose;
    if (form.isMedicalCertificate) {
      purpose = 'Medical Certificate';
    } else if (form.isCheckup) {
      purpose = `Checkup: ${form.purpose}`;
    }

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.appointmentDate || !purpose) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        purpose,
        appointmentDate: new Date(form.appointmentDate).toISOString()
      };

      await axios.post('http://localhost:5000/api/appointments/book', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Appointment scheduled successfully');
      setForm(initialFormState);
    } catch (err) {
      console.error('Booking error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientLayout>
      <div className="doctor-form-container">
        <h2>Doctor Appointment Request Form</h2>
        <p>Please fill in the form below to schedule an appointment.</p>
        <form onSubmit={handleSubmit} className="doctor-form">
          <input type="text" name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} required />
          <input type="text" name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input type="tel" name="phone" placeholder="Your phone" value={form.phone} onChange={handleChange} required />
          <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} />
          <input type="date" name="appointmentDate" placeholder="Pick the date" value={form.appointmentDate} onChange={handleChange} required />
          <div className="checkbox-container">
            <input type="checkbox" name="isMedicalCertificate" checked={form.isMedicalCertificate} onChange={e => setForm(prev => ({ ...prev, isMedicalCertificate: e.target.checked, purpose: e.target.checked ? 'Medical Certificate' : '', isCheckup: false }))} />
            <label>Medical Certificate</label>
          </div>
          <div className="checkbox-container">
            <input type="checkbox" name="isCheckup" checked={form.isCheckup} onChange={e => setForm(prev => ({ ...prev, isCheckup: e.target.checked, isMedicalCertificate: false }))} />
            <label>Checkup Session</label>
          </div>
          <textarea name="purpose" placeholder="Purpose of visit" value={form.purpose} onChange={handleChange} rows={4} required disabled={form.isMedicalCertificate} />
          <button type="submit" className="schedule-button" disabled={loading}>
            {loading ? 'Scheduling...' : 'SCHEDULE'}
          </button>
        </form>
      </div>
    </PatientLayout>
  );
}