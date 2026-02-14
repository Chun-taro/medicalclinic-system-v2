import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import './Notifications.css';
import { Bell, Check, Calendar, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
            toast.success('Marked as read');
        } catch (err) {
            console.error('Error marking as read:', err);
            toast.error('Failed to mark as read');
        }
    };

    const syncToCalendar = async (id) => {
        try {
            const res = await api.post(`/calendar/sync-notification/${id}`);
            toast.success('Synced to Google Calendar!');
        } catch (err) {
            console.error('Error syncing to calendar:', err);
            toast.error(err.response?.data?.error || 'Failed to sync to calendar');
        }
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="notifications-page">
            <div className="notifications-header">
                <h1><Bell size={28} className="inline-icon" /> Notifications</h1>
                <p>Stay updated with your appointments and clinic alerts.</p>
            </div>

            {notifications.length === 0 ? (
                <div className="empty-notifications">
                    <Bell size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>You have no notifications at the moment.</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map((n) => (
                        <div key={n._id} className={`notification-card ${n.read ? 'read' : 'unread'}`}>
                            <div className="notif-content">
                                <div className="notif-message">
                                    <span className="notif-status-badge">{n.status}</span> {n.message}
                                </div>
                                <div className="notif-meta">
                                    <Clock size={14} />
                                    <span>{new Date(n.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="notif-actions">
                                {!n.read && (
                                    <button className="btn-secondary btn-mark-read" onClick={() => markAsRead(n._id)}>
                                        <Check size={16} /> Mark Read
                                    </button>
                                )}
                                <button className="btn-primary btn-sync-calendar" onClick={() => syncToCalendar(n._id)}>
                                    <Calendar size={16} /> Sync to Google
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
