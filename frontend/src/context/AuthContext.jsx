import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(localStorage.getItem('role') || null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        setRole(null);
        setUser(null);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/profile');
                    setUser(res.data);
                    setRole(localStorage.getItem('role'));
                } catch (error) {
                    console.error('Auth check failed:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, [logout]);

    const login = useCallback(async (token, userRole, userData) => {
        console.log('AuthContext (V5): login() called', { userRole, hasData: !!userData });
        localStorage.setItem('token', token);
        localStorage.setItem('role', userRole);
        if (userData && userData._id) {
            localStorage.setItem('userId', userData._id);
        }
        setRole(userRole);
        setUser(userData || null);
        setLoading(false); // CRITICAL: Ensure we stop loading state

        // Fetch profile in the background if not provided
        if (!userData) {
            console.log('AuthContext (V5): Starting background profile fetch...');
            api.get('/profile').then(res => {
                console.log('AuthContext (V5): Background profile fetch SUCCESS');
                setUser(res.data);
                if (res.data && res.data._id) {
                    localStorage.setItem('userId', res.data._id);
                }
            }).catch(err => {
                console.error("AuthContext (V5): Background profile fetch FAILED", err);
                // We keep the role/token so the user stays logged in
            });
        }
    }, []);

    const value = useMemo(() => ({
        user,
        role,
        loading,
        login,
        logout,
        isAuthenticated: !!role,
    }), [user, role, loading, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
