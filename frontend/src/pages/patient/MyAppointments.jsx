import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import FeedbackForm from '../../components/feature/FeedbackForm';
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import './MyAppointments.css';

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [feedbackApt, setFeedbackApt] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/appointments/my');
            setAppointments(res.data);
        } catch (err) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await api.delete(`/appointments/${id}`);
            toast.success('Appointment cancelled');
            fetchAppointments();
        } catch (err) {
            toast.error('Failed to cancel appointment');
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="appointments-page">
            <div className="page-header">
                <h1>My Appointments</h1>
                <p>View and manage all your scheduled visits.</p>
            </div>

            {loading ? (
                <div className="loading-spinner"></div>
            ) : appointments.length === 0 ? (
                <div className="empty-state">
                    <Calendar size={64} className="text-muted" />
                    <h3>No appointments found</h3>
                    <p>Book your first appointment to get started.</p>
                </div>
            ) : (
                <div className="appointments-list">
                    {appointments.map(apt => (
                        <div key={apt._id} className={`appointment-item ${expandedId === apt._id ? 'expanded' : ''}`}>
                            <div className="apt-summary" onClick={() => toggleExpand(apt._id)}>
                                <div className="apt-main-info">
                                    <div className="apt-date">
                                        <Calendar size={18} className="icon" />
                                        <span>{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="apt-purpose">
                                        {apt.purpose || apt.reasonForVisit || 'General Visit'}
                                    </div>
                                </div>

                                <div className="apt-status-wrapper">
                                    <span className={`status-badge status-${apt.status.toLowerCase()}`}>
                                        {apt.status}
                                    </span>
                                    {expandedId === apt._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {expandedId === apt._id && (
                                <div className="apt-details-panel">
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <label>Time</label>
                                            <p>{
                                                ['approved', 'completed'].includes(apt.status.toLowerCase())
                                                    ? 'Go to the clinic'
                                                    : 'Pending Time'
                                            }</p>
                                        </div>
                                        <div className="detail-item">
                                            <label>Doctor</label>
                                            <p>{
                                                apt.doctorId?.firstName
                                                    ? `${apt.doctorId.firstName} ${apt.doctorId.lastName}`
                                                    : (apt.doctorName || 'Assigned Doctor')
                                            }</p>
                                        </div>
                                        <div className="detail-item full-width">
                                            <label>Notes/Management</label>
                                            <p>{apt.management || 'No notes available yet.'}</p>
                                        </div>
                                    </div>

                                    <div className="apt-actions">
                                        {apt.status === 'completed' && (
                                            <button
                                                className="btn-secondary"
                                                onClick={() => setFeedbackApt(apt)}
                                            >
                                                Leave Feedback
                                            </button>
                                        )}

                                        {['pending', 'approved'].includes(apt.status.toLowerCase()) && (
                                            <button
                                                className="btn-danger-outline"
                                                onClick={() => handleCancel(apt._id)}
                                            >
                                                Cancel Appointment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {feedbackApt && (
                <FeedbackForm
                    appointmentId={feedbackApt._id}
                    doctorName={feedbackApt.doctorName}
                    doctorId={feedbackApt.doctorId}
                    onClose={() => setFeedbackApt(null)}
                    onSuccess={() => {
                        fetchAppointments(); // Refresh to update status if needed
                    }}
                />
            )}
        </div>
    );
};

export default MyAppointments;
