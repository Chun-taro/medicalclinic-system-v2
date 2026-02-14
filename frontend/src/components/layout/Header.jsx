import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, User, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const profileRef = useRef(null);
    const notifRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = () => {
        if (!user) return 'U';
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    };

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.read).length);
        } catch (err) {
            console.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Optional: Set up polling or socket here
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            // Assuming backend supports this or loop
            // For now, loop client side or just refresh
            const unread = notifications.filter(n => !n.read);
            await Promise.all(unread.map(n => api.put(`/notifications/${n._id}/read`)));
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark all as read');
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-toggle" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
                <h2 className="page-title">
                    {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Dashboard'}
                </h2>
            </div>

            <div className="header-right">
                {/* Notifications */}
                <div className="notification-wrapper" ref={notifRef}>
                    <button
                        className="icon-btn"
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            if (!showNotifications) fetchNotifications();
                        }}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="badge-dot"></span>}
                    </button>

                    {showNotifications && (
                        <div className="dropdown-menu notifications-dropdown">
                            <div className="dropdown-header">
                                <h3>Notifications</h3>
                                <button className="text-xs btn-text" onClick={markAllAsRead}>Mark all as read</button>
                            </div>
                            <div className="dropdown-content">
                                {loading ? (
                                    <p className="p-3 text-center text-muted">Loading...</p>
                                ) : notifications.length === 0 ? (
                                    <p className="empty-state">No new notifications</p>
                                ) : (
                                    <ul className="notif-list">
                                        {notifications.slice(0, 5).map(n => (
                                            <li key={n._id} className={`notif-item ${n.read ? 'read' : 'unread'}`} onClick={() => markAsRead(n._id)}>
                                                <div className="notif-text">{n.message}</div>
                                                <div className="notif-time">{new Date(n.timestamp).toLocaleDateString()}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="profile-wrapper" ref={profileRef}>
                    <button
                        className="profile-btn"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="avatar">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" />
                            ) : (
                                <span>{getInitials()}</span>
                            )}
                        </div>
                        <div className="user-info-header">
                            <span className="user-name">{user?.firstName} {user?.lastName}</span>
                            <span className="user-role-badge">{role}</span>
                        </div>
                        <ChevronDown size={16} className="chevron" />
                    </button>

                    {showProfileMenu && (
                        <div className="dropdown-menu profile-dropdown">
                            <button onClick={() => navigate(`/${role}-profile`)}>Profile</button>
                            <button onClick={logout} className="text-danger">Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
