import { useEffect, useState } from 'react';
import axios from 'axios';
import PatientLayout from './PatientLayout';
import './Style/patient-appointments.css';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const firstName = localStorage.getItem('firstName') || 'N/A';
  const lastName = localStorage.getItem('lastName') || '';
  const email = localStorage.getItem('email') || 'N/A';
  const phone = localStorage.getItem('contactNumber') || 'N/A';

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Missing token');

        const res = await axios.get('http://localhost:5000/api/appointments/my', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setAppointments(res.data);
      } catch (err) {
        console.error('Error fetching appointments:', err.response?.data || err.message);
        setError(err.response?.data?.error || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(prev => prev.filter(app => app._id !== id));
    } catch (err) {
      alert('Failed to cancel appointment');
      console.error(err);
    }
  };

  return (
    <PatientLayout>
      <div className="patient-appointments-container">
        <h2>My Appointments</h2>
        <p>Here are your scheduled appointments.</p>

        {loading ? (
          <p>Loading appointments...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <div className="table-container">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Purpose</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(app => (
                  <tr key={app._id}>
                    <td>{firstName} {lastName}</td>
                    <td>{email}</td>
                    <td>{phone}</td>
                    <td>{app.purpose || '—'}</td>
                    <td>{new Date(app.appointmentDate).toLocaleDateString()}</td>
                    <td>{app.status}</td>
                    <td>
                      <button onClick={() => handleDelete(app._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
