import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Auto logout if 401 occurs
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // In development with Vite proxy, we might need the full backend URL for images
    // if the proxy doesn't handle /uploads or /images correctly.
    // However, if VITE_API_URL is /api, we can assume same origin or handled by proxy.
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const serverUrl = baseUrl.replace('/api', '');

    // For local development where frontend is 5173 and backend is 5000
    if (window.location.hostname === 'localhost' && !serverUrl.startsWith('http')) {
        return `http://localhost:5000${path}`;
    }

    return `${serverUrl}${path}`;
};

export default api;
