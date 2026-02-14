import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import './GoogleCalendarPage.css';
import { Calendar, Clock, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import googleLogo from '../../assets/google-logo.png';

const GoogleCalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            // This endpoint might fail with 401/400 if Google tokens are missing
            // We need to handle that gracefully
            const res = await api.get('/calendar/events');

            // Check if backend indicates re-auth needed (sometimes sent as 400 or specific field)
            // But usually axios throws error on 4xx
            setEvents(res.data);
            setNeedsAuth(false);
        } catch (err) {
            console.error('Error fetching events:', err);
            if (err.response && (err.response.status === 400 || err.response.status === 401)) {
                setNeedsAuth(true);
            } else {
                toast.error('Failed to load calendar events');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleConnectGoogle = async () => {
        try {
            const res = await api.get('/calendar/oauth/url');
            window.location.href = res.data.authUrl;
        } catch (err) {
            toast.error('Failed to initiate Google Login');
        }
    };

    const formatTime = (dateTime) => {
        return new Date(dateTime).toLocaleString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading && !needsAuth) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    if (needsAuth) {
        return (
            <div className="google-calendar-page">
                <div className="oauth-connect">
                    <Calendar size={64} className="text-muted" style={{ marginBottom: '1.5rem' }} />
                    <h2>Connect Google Calendar</h2>
                    <p>Sync your appointments and view your schedule directly here.</p>
                    <button className="btn-google" onClick={handleConnectGoogle}>
                        <img src={googleLogo} alt="Google" />
                        <span>Connect with Google</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="google-calendar-page">
            <div className="calendar-header-section">
                <h1><Calendar size={32} /> My Google Calendar</h1>
                <button className="btn-secondary btn-refresh" onClick={fetchEvents}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {events.length === 0 ? (
                <div className="empty-state">
                    <p>No upcoming events found in your main calendar.</p>
                </div>
            ) : (
                <div className="calendar-events-grid">
                    {events.map((event) => (
                        <div key={event.id} className="calendar-event-card">
                            <h3 className="event-summary">{event.summary}</h3>
                            <div className="event-details">
                                <div className="event-detail-item">
                                    <Clock size={16} />
                                    <span>
                                        {event.start?.dateTime ? formatTime(event.start.dateTime) : 'All Day'}
                                    </span>
                                </div>
                                {event.location && (
                                    <div className="event-detail-item">
                                        <MapPin size={16} />
                                        <span>{event.location}</span>
                                    </div>
                                )}
                            </div>
                            <span className="event-status">Confirmed</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GoogleCalendarPage;
