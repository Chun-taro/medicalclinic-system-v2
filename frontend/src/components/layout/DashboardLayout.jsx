import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWindow from '../chat/ChatWindow';
import { useChat } from '../../context/ChatContext';
import useWindowSize from '../../hooks/useWindowSize';
import './Layout.css';

const MOBILE_BREAKPOINT = 1024;

const DashboardLayout = () => {
    const { activeChats } = useChat();
    const { width } = useWindowSize();
    const isMobile = width <= MOBILE_BREAKPOINT;

    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        if (isMobile) {
            setSidebarOpen(prev => !prev);
            setIsCollapsed(false); // Never collapse on mobile, just show/hide
        } else {
            setIsCollapsed(prev => !prev);
            setSidebarOpen(true); // Keep open but toggle collapsed state
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`main-wrapper ${sidebarOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
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

            {/* Overlay — only render when mobile sidebar is open */}
            {isMobile && sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
            )}
        </div>
    );
};

export default DashboardLayout;
