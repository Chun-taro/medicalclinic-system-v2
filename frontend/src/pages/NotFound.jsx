import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <AlertTriangle size={64} color="#f59e0b" style={{ marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1f2937' }}>404 - Page Not Found</h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '2rem', maxWidth: '500px' }}>
                Oops! The page you are looking for does not exist or has been moved.
            </p>
            <Link
                to="/"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
                <Home size={20} />
                Go Back Home
            </Link>
        </div>
    );
};

export default NotFound;
