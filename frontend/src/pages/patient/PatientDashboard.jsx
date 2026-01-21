import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Calendar from 'react-calendar';
import PatientLayout from './PatientLayout';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [error, setError] = useState('');
  const [weatherError, setWeatherError] = useState('');
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

    const fetchWeather = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/weather?city=malaybalay');
        setWeather(res.data.weather);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setWeatherError('Failed to load weather');
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchData();
    fetchWeather();
  }, [navigate]);



  const getAppointmentDates = () => {
    return appointments.map(apt => new Date(apt.appointmentDate).toDateString());
  };

  const hasAppointment = (date) => {
    const dateString = date.toDateString();
    return getAppointmentDates().includes(dateString);
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
            {loading ? (
              <p>Loading appointments...</p>
            ) : error ? (
              <p style={{ color: 'red' }}>{error}</p>
            ) : (
              <div className="calendar-container">
                <Calendar
                  tileClassName={({ date, view }) => {
                    if (view === 'month' && hasAppointment(date)) {
                      return 'appointment-date';
                    }
                    return null;
                  }}
                  tileContent={({ date, view }) => {
                    if (view === 'month' && hasAppointment(date)) {
                      return <div className="appointment-indicator">•</div>;
                    }
                    return null;
                  }}
                />
              </div>
            )}
          </div>

          {/* Weather Section */}
          <div className="dashboard-section">
            <h3>Weather</h3>
            {weatherLoading ? (
              <p>Loading weather...</p>
            ) : weatherError ? (
              <p style={{ color: 'red' }}>{weatherError}</p>
            ) : weather ? (
              <div className="weather-info">
                <h4>{weather.name}</h4>
                <p>Temperature: {Math.round(weather.main.temp)}°C</p>
                <p>Weather: {weather.weather[0].description}</p>
               
              </div>
            ) : (
              <p>No weather data available.</p>
            )}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
