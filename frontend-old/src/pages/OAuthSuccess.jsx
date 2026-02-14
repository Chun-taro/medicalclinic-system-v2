import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role = params.get('role');
    const userId = params.get('userId');
    const googleId = params.get('googleId');

    console.log('OAuth redirect params:', { token, role, userId, googleId });

    if (token && role && userId) {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);
      if (googleId) localStorage.setItem('googleId', googleId);

      // Delay to ensure localStorage is committed before redirect
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin-dashboard');
        } else if (role === 'patient') {
          navigate('/patient-dashboard');
        } else {
          console.warn('Unexpected role:', role);
          navigate('/unauthorized');
        }
      }, 100); 
    } else {
      console.warn('Missing OAuth params — redirecting to login');
      navigate('/login');
    }
  }, [navigate]);

  return <p>Logging you in... Please wait.</p>;
}