import React, { useEffect, useState } from 'react';
import PatientLayout from './PatientLayout';
import './Style/Notifications.css';


export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <PatientLayout>
      <div className="notifications-page">
        <h2 className="notifications-title">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="notifications-empty">You have no notifications.</p>
        ) : (
          <ul className="notifications-list">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`notification-item ${n.read ? 'read' : 'unread'}`}
              >
                <div className="notification-message">
                  <strong>{n.status.toUpperCase()}</strong>: {n.message}
                </div>
                <div className="notification-timestamp">
                  {new Date(n.timestamp).toLocaleString()}
                </div>
                {!n.read && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(n._id)}
                  >
                    Mark as Read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PatientLayout>
  );
}