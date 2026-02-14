import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { MessageSquare, Star, User, Calendar, RefreshCw } from 'lucide-react';
import './DoctorFeedback.css';

const DoctorFeedback = () => {
    const { user } = useAuth();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ average: 0, total: 0 });

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            // Assuming the endpoint gets feedback for the current logged-in doctor
            // OR if the backend requires doctorId, we might need to pass it.
            // Using user.userId based on previous context
            // But usually /api/feedback/doctor/me or similar is better.
            // Old code used feedbackService.getDoctorFeedback(doctorId).
            // Let's assume we can pass doctorId as query param or the backend handles it from token

            // If the user context has the doctor ID, use it.
            const doctorId = user.userId || user.id;
            const res = await api.get(`/feedback/doctor/${doctorId}`);

            setFeedbacks(res.data.feedbacks || res.data); // Adjust based on actual API response structure

            // Calculate stats if not provided
            const total = res.data.length || (res.data.feedbacks?.length || 0);
            const sum = (res.data.feedbacks || res.data).reduce((acc, curr) => acc + (curr.rating || 0), 0);
            setStats({
                total,
                average: total ? (sum / total).toFixed(1) : 0
            });

        } catch (err) {
            console.error(err);
            toast.error('Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={16}
                className={i < rating ? "star-filled" : "star-empty"}
                fill={i < rating ? "#eab308" : "none"}
            />
        ));
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="doctor-feedback-page">
            <div className="page-header">
                <h1>Doctor Feedback</h1>
                <p>View ratings and reviews from your patients.</p>
            </div>

            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon warning">
                        <Star size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.average}</h3>
                        <p>Average Rating</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <MessageSquare size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.total}</h3>
                        <p>Total Reviews</p>
                    </div>
                </div>
            </div>

            <div className="feedback-list-header">
                <h2>Recent Reviews</h2>
                <button className="btn-icon" onClick={fetchFeedback} title="Refresh">
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="feedback-list">
                {feedbacks.length === 0 ? (
                    <div className="no-data">No feedback received yet.</div>
                ) : (
                    feedbacks.map(fb => (
                        <div key={fb._id} className="feedback-card">
                            <div className="feedback-header">
                                <div className="patient-info">
                                    <div className="avatar-circle">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <span className="patient-name">{fb.patientName || (fb.patientId?.firstName + ' ' + fb.patientId?.lastName) || 'Anonymous'}</span>
                                        <div className="feedback-date">
                                            <Calendar size={12} />
                                            <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="rating-display">
                                    {renderStars(fb.rating)}
                                </div>
                            </div>
                            <div className="feedback-content">
                                <p>"{fb.comment || fb.message}"</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DoctorFeedback;
