import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PatientCalendar from '../../components/feature/PatientCalendar';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import './PatientDashboard.css';

const PatientDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAppointments = async () => {
            if (authLoading) return; // Wait for auth check

            const userId = user?._id || localStorage.getItem('userId');

            if (!userId) {
                // If still no user ID, we might need to wait or it's an error
                // But let's not error out immediately, maybe just wait
                return;
            }

            try {
                const res = await api.get(`/appointments/patient/${userId}`);
                setAppointments(res.data);
            } catch (err) {
                console.error('Error fetching appointments:', err);
                // Don't show error if it's just a momentary auth loading issue
                if (userId) setError('Failed to load appointments.');
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, [user, authLoading]);

    const upcomingAppointments = appointments
        .filter(a => new Date(a.appointmentDate) > new Date() && a.status !== 'cancelled' && a.status !== 'completed')
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
        .slice(0, 3); // Show top 3

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Welcome back, {user?.firstName}!</h1>
                <p>Manage your health journey with ease.</p>
            </div>

            <div className="dashboard-grid">
                {/* Left Col: Calendar & Quick Stats */}
                <div className="dashboard-main">
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2>My Calendar</h2>
                        </div>
                        <PatientCalendar appointments={appointments} />
                    </section>
                </div>

                {/* Right Col: Upcoming Appointments */}
                <div className="dashboard-sidebar">
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2>Upcoming Appointments</h2>
                            <button
                                className="btn-link"
                                onClick={() => navigate('/patient-appointments')}
                            >
                                View All
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-spinner"></div>
                        ) : error ? (
                            <p className="error-text">{error}</p>
                        ) : upcomingAppointments.length === 0 ? (
                            <div className="empty-state">
                                <Calendar size={48} className="text-muted" />
                                <p>No upcoming appointments.</p>
                                <button
                                    className="btn-primary"
                                    style={{ marginTop: '1rem' }}
                                    onClick={() => navigate('/patient-book')}
                                >
                                    Book Now
                                </button>
                            </div>
                        ) : (
                            <div className="appointment-list">
                                {upcomingAppointments.map(apt => (
                                    <div key={apt._id} className="appointment-card-mini">
                                        <div className="apt-date-box">
                                            <span className="apt-month">
                                                {new Date(apt.appointmentDate).toLocaleString('default', { month: 'short' })}
                                            </span>
                                            <span className="apt-day">
                                                {new Date(apt.appointmentDate).getDate()}
                                            </span>
                                        </div>
                                        <div className="apt-details">
                                            <h4>{apt.purpose || 'General Checkup'}</h4>
                                            <div className="apt-meta">
                                                <Clock size={14} />
                                                <span>
                                                    {['approved', 'completed'].includes(apt.status.toLowerCase())
                                                        ? 'Go to the clinic'
                                                        : 'Pending Time'}
                                                </span>
                                            </div>
                                            <div className={`apt-status badge-${apt.status.toLowerCase()}`}>
                                                {apt.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="dashboard-section info-card">
                        <div className="info-icon">
                            <AlertCircle size={24} />
                        </div>
                        <div className="info-content">
                            <h3>Need Help?</h3>
                            <p>Contact the medical clinic support for urgent inquiries.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
