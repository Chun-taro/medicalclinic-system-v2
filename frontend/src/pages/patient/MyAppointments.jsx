import { useEffect, useState } from 'react';
import axios from 'axios';
import PatientLayout from './PatientLayout';
import FeedbackForm from '../../components/FeedbackForm';
import { showError } from '../../utils/toastNotifier';
import './Style/patient-appointments.css';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [submittedFeedback, setSubmittedFeedback] = useState({});

  const firstName = localStorage.getItem('firstName') || 'N/A';
  const lastName = localStorage.getItem('lastName') || '';
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
      showError('Failed to cancel appointment');
      console.error(err);
    }
  };

  const handleToggle = id => {
    setExpandedId(prevId => (prevId === id ? null : id));
  };

  const handleOpenFeedback = (appointment) => {
    setSelectedAppointment(appointment);
    setShowFeedbackForm(true);
  };

  const handleCloseFeedback = () => {
    setShowFeedbackForm(false);
    setSelectedAppointment(null);
  };

  const handleFeedbackSubmitted = (appointmentId) => {
    // Mark this appointment as having feedback submitted
    setSubmittedFeedback(prev => ({
      ...prev,
      [appointmentId]: true
    }));
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
          <div className="appointments-card-container">
            {appointments.map(app => (
              <div
                key={app._id}
                className={`appointment-card ${expandedId === app._id ? 'expanded' : ''}`}
                onClick={() => handleToggle(app._id)}
              >
                <div className="card-header">
                  <div className="card-header-info">
                    <span className="card-purpose">{app.purpose || '—'}</span>
                    <span className="card-date">{new Date(app.appointmentDate).toLocaleDateString()}</span>
                  </div>
                  <span className={`card-status status-${app.status.toLowerCase()}`}>{app.status}</span>
                </div>
                {expandedId === app._id && (
                  <div className="card-details">
                    <p><strong>Name:</strong> {app.patientId?.firstName || firstName} {app.patientId?.lastName || lastName}</p>
                    <p><strong>Date:</strong> {new Date(app.appointmentDate).toLocaleString()}</p>
                    <p><strong>Phone:</strong> {app.patientId?.contactNumber || phone}</p>
                    <p><strong>Reason for Visit:</strong> {app.purpose || '—'}</p>
                    <p><strong>Management:</strong> {app.management || 'Not available'}</p>
                    <p>
                      <strong>Medication:</strong>{' '}
                      {app.medicinesPrescribed && app.medicinesPrescribed.length > 0
                        ? app.medicinesPrescribed.map(med => `${med.name} (x${med.quantity})`).join(', ')
                        : 'None'}
                    </p>
                    <div className="card-actions">
                      {app.status === 'completed' && !submittedFeedback[app._id] && (
                        <button
                          className="feedback-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFeedback(app);
                          }}
                        >
                          Leave Feedback
                        </button>
                      )}
                      {submittedFeedback[app._id] && app.status === 'completed' && (
                        <span className="feedback-submitted">✓ Feedback Submitted</span>
                      )}
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(app._id);
                        }}
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showFeedbackForm && selectedAppointment && (
        <FeedbackForm
          appointmentId={selectedAppointment._id}
          doctorId={selectedAppointment.doctorId?._id || selectedAppointment.doctorId}
          doctorName={selectedAppointment.doctorName || 'Your Doctor'}
          onClose={handleCloseFeedback}
          onSuccess={() => handleFeedbackSubmitted(selectedAppointment._id)}
        />
      )}
    </PatientLayout>
  );
}
