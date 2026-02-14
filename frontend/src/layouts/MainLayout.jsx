import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = ({ children }) => {
    return (
        <div className="main-layout">
            {children || <Outlet />}
        </div>
    );
};

export default MainLayout;
