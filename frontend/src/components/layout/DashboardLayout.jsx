import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css'; // We'll create this CSS next

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className={`main-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <Header toggleSidebar={toggleSidebar} />
                <main className="content-area">
                    <Outlet />
                </main>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
            )}
        </div>
    );
};

export default DashboardLayout;
