import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWindow from '../chat/ChatWindow';
import { useChat } from '../../context/ChatContext';
import './Layout.css'; // We'll create this CSS next

const DashboardLayout = () => {
    const { activeChats } = useChat();
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

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

            {/* Floating Chat Windows */}
            <div className="chat-windows-container">
                {activeChats.map(conv => (
                    <ChatWindow key={conv._id} conversation={conv} />
                ))}
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
            )}
        </div>
    );
};

export default DashboardLayout;
