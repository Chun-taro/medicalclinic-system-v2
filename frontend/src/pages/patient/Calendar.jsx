import React, { useEffect, useState } from 'react';
import PatientLayout from './PatientLayout';
import './Style/Calendar.css';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/calendar/events', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 400) {
        // No Google tokens - redirect to OAuth
        const oauthRes = await fetch('http://localhost:5000/api/calendar/oauth/url', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const oauthData = await oauthRes.json();
        if (oauthRes.ok) {
          window.location.href = oauthData.authUrl;
          return;
        }
      }

      const data = await res.json();
      if (res.ok) {
        setEvents(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="calendar-page">
          <h2 className="calendar-title">My Calendar</h2>
          <div className="loading">Loading calendar events...</div>
        </div>
      </PatientLayout>
    );
  }

  if (error) {
    return (
      <PatientLayout>
        <div className="calendar-page">
          <h2 className="calendar-title">My Calendar</h2>
          <div className="error-message">{error}</div>
          <button className="retry-btn" onClick={fetchEvents}>
            Try Again
          </button>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="calendar-page">
        <h2 className="calendar-title">My Calendar</h2>
        <p className="calendar-description">
          View your upcoming Google Calendar events. Events synced from appointment notifications will appear here.
        </p>

        {events.length === 0 ? (
          <div className="no-events">
            <p>No upcoming events found.</p>
            <p>Sync appointment notifications to add events to your calendar.</p>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <div key={event.id} className="event-item">
                <div className="event-header">
                  <h3 className="event-summary">{event.summary}</h3>
                  <span className="event-status">Confirmed</span>
                </div>

                <div className="event-details">
                  <div className="event-time">
                    <strong>Start:</strong> {formatDateTime(event.start.dateTime)}
                  </div>
                  <div className="event-time">
                    <strong>End:</strong> {formatDateTime(event.end.dateTime)}
                  </div>
                  {event.description && (
                    <div className="event-description">
                      <strong>Description:</strong> {event.description}
                    </div>
                  )}
                  {event.location && (
                    <div className="event-location">
                      <strong>Location:</strong> {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="calendar-actions">
          <button className="refresh-btn" onClick={fetchEvents}>
            Refresh Events
          </button>
        </div>
      </div>
    </PatientLayout>
  );
}
