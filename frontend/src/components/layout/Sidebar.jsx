import React from 'react';
import logo from '../../assets/logo.png';
import logoDark from '../../assets/Medical_Logo_dark.png';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
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

const Sidebar = ({ isOpen, isCollapsed, toggleSidebar }) => {
    const { role, logout } = useAuth();
    const { isDarkMode } = useTheme();

    const menuItems = {
        patient: [
            { path: '/patient-dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/patient-appointments', label: 'My Appointments', icon: CalendarDays },
            { path: '/patient-book', label: 'Book Appointment', icon: CalendarPlus },
        ],
        admin: [
            { path: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/admin-messages', label: 'Messages', icon: MessageSquare },
            { path: '/admin-appointments', label: 'All Appointments', icon: CalendarDays },
            { path: '/admin-users', label: 'Manage Users', icon: Users },
            { path: '/admin-reports', label: 'Reports', icon: FileText },
            { path: '/admin-inventory', label: 'Inventory', icon: ClipboardList },
            { path: '/admin-consultation', label: 'Consultation', icon: Stethoscope },
            { path: '/admin-doctor-feedback', label: 'Doctor Feedback', icon: MessageSquare },
        ],
        superadmin: [
            { path: '/superadmin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/superadmin-messages', label: 'Messages', icon: MessageSquare },
            { path: '/superadmin-users', label: 'Manage Users', icon: Users },
            { path: '/superadmin-doctor-feedback', label: 'Doctor Feedback', icon: MessageSquare },
            { path: '/superadmin-logs', label: 'System Logs', icon: History },
        ],
        doctor: [
            { path: '/admin-consultation', label: 'Consultation', icon: Stethoscope },
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
        <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <img src={isDarkMode ? logoDark : logo} alt="Logo" className="sidebar-logo" />
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

            {/* Logout button removed from sidebar as requested */}
        </aside>
    );
};

export default Sidebar;
