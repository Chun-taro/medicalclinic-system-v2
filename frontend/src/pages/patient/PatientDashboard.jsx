import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PatientLayout from './PatientLayout';
import PatientCalendar from './PatientCalendar';
import './Style/AppointmentTable.css';
import './Style/PatientCalendar.css';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      if (!userId || !token) {
        setError('Missing user credentials. Please log in again.');
        setLoading(false);
        return;
      }

      if (role !== 'patient' && role !== 'doctor' && role !== 'nurse') {
        console.log('Role check failed:', { role, expected: 'patient' });
        navigate('/unauthorized');
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/appointments/patient/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(res.data);
      } catch (err) {
        console.error('Error fetching appointments:', err.response?.data || err.message);
        setError(err.response?.data?.error || 'Failed to load appointments.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);



  return (
    <PatientLayout>
      <style>
        {`
          .dashboard-layout {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
          }
          .dashboard-layout > .dashboard-section {
            flex: 1 1 450px;
          }
        `}
      </style>
      <div className="dashboard-content">
        <h2>Dashboard</h2>
        <p>Welcome to your patient dashboard. Below are your appointments and upcoming calendar events:</p>

        <div className="dashboard-layout">
          {/* Calendar Section */}
          <div className="dashboard-section">
            <h3>My Calendar</h3>
            {loading ? (
              <p>Loading appointments...</p>
            ) : error ? (
              <p style={{ color: 'red' }}>{error}</p>
            ) : (
              <PatientCalendar appointments={appointments} />
            )}
          </div>

          {/* Appointments Section */}
          <div className="dashboard-section">
            <h3>My Appointments</h3>
            {loading ? (
              <p>Loading appointments...</p>
            ) : error ? (
              <p style={{ color: 'red' }}>{error}</p>
            ) : appointments.length === 0 ? (
              <p>No appointments found.</p>
            ) : (
              <div className="table-container">
                <table className="appointment-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Reason</th>
                      <th>Reschedule Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.slice(0, 5).map((apt) => (
                      <tr key={apt._id}>
                        <td data-label="Status">{apt.status}</td>
                        <td data-label="Date">{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                        <td data-label="Reason">{apt.reasonForVisit || apt.purpose || '—'}</td>
                        <td data-label="Reschedule Reason">{apt.rescheduleReason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {appointments.length > 5 && (
                  <button
                    className="view-more-btn"
                    onClick={() => navigate('/patient-appointments')}
                  >
                    View All Appointments
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </PatientLayout>
  );
}
