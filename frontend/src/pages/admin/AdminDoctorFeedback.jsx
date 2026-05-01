import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { MessageSquare, Star, User, Calendar, RefreshCw, TrendingUp, Users } from 'lucide-react';
import './AdminDoctorFeedback.css';

const AdminDoctorFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    // Analytics
    const [analytics, setAnalytics] = useState({
        totalFeedback: 0,
        pendingFeedback: 0,
        totalCompletedAppointments: 0
    });

    useEffect(() => {
        fetchInitialData();
        fetchAllFeedback();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const analyticsRes = await api.get('/feedback/analytics/overall');

            if (analyticsRes.data && analyticsRes.data.analytics) {
                setAnalytics(analyticsRes.data.analytics);
            }
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
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

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="admin-feedback-page">
            <div className="page-header">
                <h1>Feedback Management</h1>
                <p>Track patient participation for official feedback.</p>
            </div>

            {/* Analytics Dashboard */}
            <div className="analytics-grid feedback-participation">
                <div className="metric-card">
                    <div className="metric-icon success"><TrendingUp size={24} /></div>
                    <div className="metric-info">
                        <h3>{analytics.totalFeedback}</h3>
                        <p>Completed (Clicked)</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon warning"><RefreshCw size={24} /></div>
                    <div className="metric-info">
                        <h3>{analytics.pendingFeedback}</h3>
                        <p>Pending / Ignored</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon primary"><Users size={24} /></div>
                    <div className="metric-info">
                        <h3>{analytics.totalCompletedAppointments}</h3>
                        <p>Eligible Appointments</p>
                    </div>
                </div>
            </div>

            <div className="staff-selector-section">
                <div className="selector-header">
                    <h3><MessageSquare size={20} /> Latest Participation Logs</h3>
                </div>
                {feedbackLoading ? (
                    <div className="loading-skeleton">Loading logs...</div>
                ) : feedbacks.length === 0 ? (
                    <div className="no-data-msg">No participation logs found.</div>
                ) : (
                    <div className="reviews-list">
                        {feedbacks.map(fb => (
                            <div key={fb._id} className="review-card feedback-log-item">
                                <div className="review-header">
                                    <div className="reviewer-info">
                                        <div className="avatar">{fb.patientId?.firstName ? fb.patientId.firstName[0] : 'P'}</div>
                                        <div className="log-detail">
                                            <span className="name">
                                                {fb.patientId ? `${fb.patientId.firstName} ${fb.patientId.lastName}` : 'Anonymous Patient'}
                                            </span>
                                            <span className="date">Clicked on {new Date(fb.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="status-label">
                                        Confirmed Click
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
