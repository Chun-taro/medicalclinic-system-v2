import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const OAuthFailure = () => {
    const navigate = useNavigate();

    useEffect(() => {
        toast.error('Google Login canceled or failed.');
        navigate('/');
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Redirecting...</p>
        </div>
    );
};

export default OAuthFailure;
