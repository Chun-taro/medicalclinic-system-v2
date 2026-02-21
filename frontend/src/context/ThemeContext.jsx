import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Keep track of user's persistent preference
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });

    // Temporary override for specific pages like Login/Home
    const [forceLightMode, setForceLightMode] = useState(false);

    // Apply the theme based on persistent preference AND the override
    // We use useLayoutEffect to prevent flickering before paint
    useLayoutEffect(() => {
        const _html = document.documentElement;
        if (isDarkMode && !forceLightMode) {
            document.body.classList.add('dark-mode');
            _html.style.colorScheme = 'dark';
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            _html.style.colorScheme = 'light';
            // Only update local storage if we are not forcing it
            if (!forceLightMode) {
                localStorage.setItem('theme', 'light');
            }
        }
    }, [isDarkMode, forceLightMode]);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, forceLightMode, setForceLightMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
