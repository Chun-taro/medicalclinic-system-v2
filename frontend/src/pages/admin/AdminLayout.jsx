import React, { useState, useRef, useEffect } from 'react';
import './Style/AdminDashboard.css';
import './Style/AdminNotifications.css';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart3,
  Package,
  Stethoscope,
  Bell,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const admin = {
    firstName: (localStorage.getItem('firstName') || 'Admin').trim(),
    lastName: (localStorage.getItem('lastName') || '').trim(),
    profileImage: (localStorage.getItem('profileImage') || '').trim(),
  };

  const handleLogout = () => {
    ['token', 'userId', 'firstName', 'lastName', 'profileImage'].forEach((k) =>
      localStorage.removeItem(k)
    );
    navigate('/', { replace: true });
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/notifications/unread', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Error fetching unread notifications:', err);
    }
  };

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
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !notificationRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);

    const socket = io('http://localhost:5000');
    socket.on('newAppointment', (data) => {
      toast.info(data.message);
      setUnreadCount((prev) => prev + 1);
      fetchNotifications();
    });

    return () => {
      document.removeEventListener('click', handleClickOutside);
      socket.disconnect();
    };
  }, []);

  const getInitials = (first, last) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  const menuItems = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'All Appointments', path: '/admin-appointments', icon: <CalendarDays size={18} /> },
    { name: 'Manage Users', path: '/admin-users', icon: <Users size={18} /> },
    { name: 'Reports', path: '/admin-reports', icon: <BarChart3 size={18} /> },
    { name: 'Consultation', path: '/admin-consultation/preview', icon: <Stethoscope size={18} /> },
    { name: 'Inventory', path: '/admin-inventory', icon: <Package size={18} /> },
  ];

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-top">
          <h3 className="sidebar-title">Admin Menu</h3>
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li
                key={item.name}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="main-content">
        <nav className="navbar">
          <div className="navbar-left">
            <div className="user-info">
              <h1 className="fb-name">{admin.firstName} {admin.lastName}</h1>
              <span className="user-role">{localStorage.getItem('role')?.toUpperCase()}</span>
            </div>
          </div>

          <div className="navbar-right">
            {/* Notification Bell */}
            <div className="notification-wrapper" ref={notificationRef}>
              <div onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="notification-icon" />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>

              {showNotifications && (
                <div className="notification-dropdown">
                  <h4 className="dropdown-header">Notifications</h4>
                  {loading ? (
                    <p className="loading-text">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="empty-text">No notifications</p>
                  ) : (
                    <ul className="dropdown-list">
                      {notifications.map((note) => (
                        <li key={note._id} className={`dropdown-item ${note.read ? 'read' : 'unread'}`}>
                          <div className="dropdown-message">{note.message}</div>
                          <div className="dropdown-meta">
                            <span>{note.type}</span>
                            <span>{note.status}</span>
                            <span>{new Date(note.timestamp).toLocaleString()}</span>
                          </div>
                          {!note.read && (
                            <button className="mark-read-btn" onClick={() => markAsRead(note._id)}>
                              Mark as Read
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="profile-menu" ref={dropdownRef}>
              {admin.profileImage ? (
                <img
                  src={admin.profileImage}
                  alt="Profile"
                  className="profile-icon"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                />
              ) : (
                <div
                  className="profile-initials"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {getInitials(admin.firstName, admin.lastName)}
                </div>
              )}

              {dropdownOpen && (
                <div className="dropdown">
                  <button onClick={() => navigate('/admin-profile')}>View Profile</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </nav>
        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}