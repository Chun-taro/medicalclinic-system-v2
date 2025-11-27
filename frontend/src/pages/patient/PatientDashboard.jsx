import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PatientLayout from './PatientLayout';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [error, setError] = useState('');
  const [calendarError, setCalendarError] = useState('');
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

    const fetchCalendarEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/calendar/events', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 400) {
          // No Google tokens - user needs to authorize
          setCalendarError('Connect your Google Calendar to view upcoming events');
          setCalendarLoading(false);
          return;
        }

        const data = await res.json();
        if (res.ok) {
          setCalendarEvents(data.slice(0, 5)); // Show only next 5 events
        } else {
          setCalendarError(data.error);
        }
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setCalendarError('Failed to load calendar events');
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchData();
    fetchCalendarEvents();
  }, [navigate]);

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCalendarAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/calendar/oauth/url', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = data.authUrl;
      } else {
        alert('Failed to get authorization URL');
      }
    } catch (err) {
      console.error('Error getting OAuth URL:', err);
      alert('Failed to connect to Google Calendar');
    }
  };

  return (
    <PatientLayout>
      <div className="dashboard-content">
        <h2>Dashboard</h2>
        <p>Welcome to your patient dashboard. Below are your appointments and upcoming calendar events:</p>

        <div className="dashboard-grid">
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
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Management</th>
                      <th>Medicines</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.slice(0, 5).map((apt) => (
                      <tr key={apt._id}>
                        <td>{apt.status}</td>
                        <td>{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                        <td>{apt.typeOfVisit || '—'}</td>
                        <td>{apt.reasonForVisit || apt.purpose || '—'}</td>
                        <td>{apt.management || '—'}</td>
                        <td>
                          {apt.medicinesPrescribed && apt.medicinesPrescribed.length > 0
                            ? apt.medicinesPrescribed.map(med => `${med.name} (${med.quantity})`).join(', ')
                            : '—'
                          }
                        </td>
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

          {/* Calendar Section */}
          <div className="dashboard-section">
            <h3>My Calendar</h3>
            {calendarLoading ? (
              <p>Loading calendar events...</p>
            ) : calendarError ? (
              <div className="calendar-error">
                <p>{calendarError}</p>
                <button className="auth-calendar-btn" onClick={handleCalendarAuth}>
                  Connect Google Calendar
                </button>
              </div>
            ) : calendarEvents.length === 0 ? (
              <p>No upcoming events.</p>
            ) : (
              <div className="calendar-events">
                {calendarEvents.map((event) => (
                  <div key={event.id} className="calendar-event">
                    <div className="event-title">{event.summary}</div>
                    <div className="event-time">
                      {formatDateTime(event.start.dateTime)}
                    </div>
                  </div>
                ))}
                <button
                  className="view-calendar-btn"
                  onClick={() => navigate('/patient-calendar')}
                >
                  View Full Calendar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
