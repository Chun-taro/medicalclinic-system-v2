import React from 'react';
import logo from '../../assets/logo.png';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarDays,
    CalendarPlus,
    Users,
    FileText,
    Settings,
    LogOut,
    Stethoscope,
    ClipboardList,
    History,
    MessageSquare,
    Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { role, logout } = useAuth();

    const menuItems = {
        patient: [
            { path: '/patient-dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/patient-appointments', label: 'My Appointments', icon: CalendarDays },
            { path: '/patient-book', label: 'Book Appointment', icon: CalendarPlus },
            { path: '/patient-profile', label: 'Profile', icon: Users },
        ],
        admin: [
            { path: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/admin-appointments', label: 'All Appointments', icon: CalendarDays },
            { path: '/admin-users', label: 'Manage Users', icon: Users },
            { path: '/admin-reports', label: 'Reports', icon: FileText },
            { path: '/admin-inventory', label: 'Inventory', icon: ClipboardList },
            { path: '/admin-consultation', label: 'Consultation', icon: Stethoscope },
            { path: '/admin-doctor-feedback', label: 'Doctor Feedback', icon: MessageSquare },
            { path: '/admin-profile', label: 'Profile', icon: Settings },
        ],
        superadmin: [
            { path: '/superadmin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/superadmin-appointments', label: 'All Appointments', icon: CalendarDays },
            { path: '/superadmin-users', label: 'Manage Users', icon: Users },
            { path: '/superadmin-reports', label: 'Reports', icon: FileText },
            { path: '/superadmin-inventory', label: 'Inventory', icon: ClipboardList },
            { path: '/superadmin-consultation', label: 'Consultation', icon: Stethoscope },
            { path: '/superadmin-logs', label: 'System Logs', icon: History },
            { path: '/superadmin-doctor-feedback', label: 'Doctor Feedback', icon: MessageSquare },
            { path: '/superadmin-profile', label: 'Profile', icon: Settings },
        ],
        doctor: [
            { path: '/doctor-feedback', label: 'Feedback', icon: MessageSquare },
        ]
    };

    // Ensure role is case-insensitive
    const safeRole = role ? role.toLowerCase() : '';
    const currentMenu = menuItems[safeRole] || [];

    if (!currentMenu.length && role) {
        console.warn(`No menu items found for role: ${role}`);
    }

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <img src={logo} alt="Logo" className="sidebar-logo" />
                    <span className="logo-text">MediClinic</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {currentMenu.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 768 && toggleSidebar()}
                            >
                                <item.icon className="nav-icon" size={20} />
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button onClick={logout} className="logout-btn">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
