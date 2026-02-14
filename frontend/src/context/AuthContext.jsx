import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(localStorage.getItem('role') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Adjust this endpoint based on your backend
                    // The old code used /api/profile
                    const res = await api.get('/profile');
                    setUser(res.data);
                    setRole(localStorage.getItem('role')); // Ensure role is consistent
                } catch (error) {
                    console.error('Auth check failed:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (token, userRole, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', userRole);
        if (userData && userData._id) {
            localStorage.setItem('userId', userData._id);
        }
        setRole(userRole);
        setUser(userData || null);

        // Optional: Fetch profile if not provided
        if (!userData) {
            try {
                const res = await api.get('/profile');
                setUser(res.data);
                if (res.data && res.data._id) {
                    localStorage.setItem('userId', res.data._id);
                }
            } catch (err) {
                console.error("Failed to fetch user profile on login", err);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        setRole(null);
        setUser(null);
        // Optional: redirect logic is usually handled by components or router
    };

    const value = {
        user,
        role,
        loading,
        login,
        logout,
        isAuthenticated: !!role,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
