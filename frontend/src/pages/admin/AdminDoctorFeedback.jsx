import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { MessageSquare, Star, User, Calendar, RefreshCw, TrendingUp, Users } from 'lucide-react';
import './AdminDoctorFeedback.css';

const AdminDoctorFeedback = () => {
    const [doctors, setDoctors] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [loading, setLoading] = useState(true); // Initial loading for doctors & analytics
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    // Analytics
    const [analytics, setAnalytics] = useState({
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topRecipients: []
    });

    useEffect(() => {
        fetchInitialData();
        fetchAllFeedback();
    }, []);

    useEffect(() => {
        if (selectedDoctorId) {
            fetchDoctorFeedback(selectedDoctorId);
        } else {
            fetchAllFeedback();
        }
    }, [selectedDoctorId]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [usersRes, analyticsRes] = await Promise.all([
                api.get('/users'), // Get all users to filter doctors
                api.get('/feedback/analytics/overall') // Ensure correct endpoint
            ]);

            const doctorList = usersRes.data.filter(u => ['doctor', 'admin', 'superadmin'].includes(u.role));
            setDoctors(doctorList);

            if (analyticsRes.data && analyticsRes.data.analytics) {
                setAnalytics(analyticsRes.data.analytics);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllFeedback = async () => {
        try {
            setFeedbackLoading(true);
            const res = await api.get('/feedback/all');
            setFeedbacks(res.data.feedback || []);
        } catch (err) {
            toast.error('Failed to load feedback');
            setFeedbacks([]);
        } finally {
            setFeedbackLoading(false);
        }
    };

    const fetchDoctorFeedback = async (id) => {
        try {
            setFeedbackLoading(true);
            const res = await api.get(`/feedback/doctor/${id}`);
            setFeedbacks(res.data.feedbacks || res.data || []); // Handle different response structures
        } catch (err) {
            toast.error('Failed to load feedback');
            setFeedbacks([]);
        } finally {
            setFeedbackLoading(false);
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={14}
                className={i < rating ? "star-filled" : "star-empty"}
                fill={i < rating ? "#eab308" : "none"}
            />
        ));
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="admin-feedback-page">
            <div className="page-header">
                <h1>Feedback Management</h1>
                <p>Monitor staff performance and patient reviews.</p>
            </div>

            {/* Analytics Dashboard */}
            <div className="analytics-grid">
                <div className="metric-card">
                    <div className="metric-icon primary"><MessageSquare size={24} /></div>
                    <div className="metric-info">
                        <h3>{analytics.totalFeedback}</h3>
                        <p>Total Reviews</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon success"><Star size={24} /></div>
                    <div className="metric-info">
                        <h3>{analytics.averageRating}</h3>
                        <p>Global Average</p>
                    </div>
                </div>
                <div className="metric-card distribution-card">
                    <h4>Rating Distribution</h4>
                    <div className="distribution-bars">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = analytics.ratingDistribution[star] || 0;
                            const max = Math.max(...Object.values(analytics.ratingDistribution), 1);
                            const percent = (count / max) * 100;
                            return (
                                <div key={star} className="dist-row">
                                    <span className="star-label">{star} <Star size={10} fill="currentColor" /></span>
                                    <div className="bar-track">
                                        <div className="bar-fill" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <span className="count-label">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="staff-selector-section">
                <div className="selector-header">
                    <h3><Users size={20} /> Latest Feedback</h3>
                    <div className="select-wrapper">
                        <select
                            value={selectedDoctorId}
                            onChange={e => setSelectedDoctorId(e.target.value)}
                            className="staff-select"
                        >
                            <option value="">All Staff</option>
                            {doctors.map(d => (
                                <option key={d._id} value={d._id}>{d.firstName} {d.lastName} ({d.role})</option>
                            ))}
                        </select>
                    </div>
                </div>
                {feedbackLoading ? (
                    <div className="loading-skeleton">Loading feedback...</div>
                ) : feedbacks.length === 0 ? (
                    <div className="no-data-msg">No feedback found.</div>
                ) : (
                    <div className="reviews-list">
                        {feedbacks.map(fb => (
                            <div key={fb._id} className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-info">
                                        <div className="avatar">{fb.patientId?.firstName ? fb.patientId.firstName[0] : 'A'}</div>
                                        <div>
                                            <span className="name">
                                                {fb.patientId ? `${fb.patientId.firstName} ${fb.patientId.lastName}` : 'Anonymous'}
                                            </span>
                                            <span className="date">{new Date(fb.createdAt).toLocaleDateString()}</span>
                                            {/* Show recipient if viewing 'All' */}
                                            {!selectedDoctorId && fb.recipientId && (
                                                <span className="recipient-badge">
                                                    For: {fb.recipientId.firstName} {fb.recipientId.lastName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rating">
                                        {renderStars(fb.rating)}
                                    </div>
                                </div>
                                <p className="review-text">"{fb.comment}"</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDoctorFeedback;
