import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthFailure() {
  const navigate = useNavigate();

  useEffect(() => {
    alert("You don't have an account. Please sign up first.");
    navigate('/signup');
  }, [navigate]);

  return <p>Redirecting to signup...</p>;
}