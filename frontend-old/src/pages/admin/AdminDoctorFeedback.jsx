import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import feedbackService from '../../services/feedbackService';
import './Style/ManageUsers.css';

const AdminDoctorFeedback = () => {
  const [doctors, setDoctors] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const limit = 10;

  // Fetch all doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter for doctors, admins, and superadmins
        const doctorList = res.data.filter(user => 
          ['doctor', 'admin', 'superadmin'].includes(user.role)
        );
        setDoctors(doctorList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors');
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch analytics on mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const data = await feedbackService.getFeedbackAnalytics();
        setAnalytics(data.analytics);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Fetch feedback when doctor is selected
  useEffect(() => {
    if (!selectedDoctorId) {
      setFeedbacks([]);
      return;
    }

    const fetchFeedback = async () => {
      setFeedbackLoading(true);
      setError('');
      try {
        const data = await feedbackService.getDoctorFeedback(selectedDoctorId, page, limit);
        setFeedbacks(Array.isArray(data) ? data : data.feedbacks || []);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError(err.message || 'Failed to load feedback');
      } finally {
        setFeedbackLoading(false);
      }
    };

    fetchFeedback();
  }, [selectedDoctorId, page]);

  const handleDoctorChange = (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId);
    setSelectedDoctorId(doctorId);
    setSelectedDoctorName(doctor ? `${doctor.firstName} ${doctor.lastName}` : '');
    setPage(1); // Reset to first page
  };

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / feedbacks.length).toFixed(1)
    : 0;

  return (
    <AdminLayout>
      <div className="container" style={{ padding: '24px' }}>
        <h1>Feedback Management</h1>

        {/* Analytics Section */}
        {analyticsLoading ? (
          <p>Loading analytics...</p>
        ) : analytics ? (
          <div style={{ marginBottom: '32px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ marginTop: 0 }}>📊 Analytics Overview</h2>
            
            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2E86C1' }}>{analytics.totalFeedback}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Feedback</div>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#27AE60' }}>{analytics.averageRating}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Average Rating (out of 5)</div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Rating Distribution</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '150px' }}>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        backgroundColor: stars >= 4 ? '#27AE60' : stars >= 3 ? '#F39C12' : '#E74C3C',
                        height: `${Math.max(10, (analytics.ratingDistribution[stars] / Math.max(...Object.values(analytics.ratingDistribution)) || 1) * 120)}px`,
                        borderRadius: '4px'
                      }}
                      title={`${stars} stars: ${analytics.ratingDistribution[stars]}`}
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold' }}>{stars}⭐</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{analytics.ratingDistribution[stars]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Recipients */}
            {analytics.topRecipients && analytics.topRecipients.length > 0 && (
              <div>
                <h3 style={{ marginTop: 0 }}>Top Staff Members</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {analytics.topRecipients.map((recipient, idx) => (
                    <li
                      key={recipient.recipientId}
                      style={{
                        padding: '10px',
                        marginBottom: '8px',
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span><strong>{idx + 1}.</strong> {recipient.name}</span>
                      <span style={{ color: '#666' }}>
                        {recipient.count} feedback(s) · Avg: {recipient.avgRating}⭐
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Doctor Selector */}
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Select a Staff Member:
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => handleDoctorChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Choose a Staff Member --</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.firstName} {doctor.lastName} ({doctor.role})
              </option>
            ))}
          </select>
        </div>

        {/* Feedback Section */}
        {selectedDoctorId && (
          <div>
            <h2>{selectedDoctorName}</h2>
            {feedbackLoading && <p>Loading feedback…</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!feedbackLoading && !error && (
              <div>
                {/* Rating Summary */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '4px'
                }}>
                  <div>
                    <strong>Total Feedback:</strong> {feedbacks.length}
                  </div>
                  <div>
                    <strong>Average Rating:</strong> {avgRating}/5 ⭐
                  </div>
                </div>

                {/* Feedback List */}
                {feedbacks.length === 0 ? (
                  <p>No feedback found for this doctor.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {feedbacks.map((fb) => (
                      <li
                        key={fb._id || fb.id}
                        style={{
                          border: '1px solid #ddd',
                          padding: '12px',
                          marginBottom: '8px',
                          borderRadius: '6px',
                          backgroundColor: '#fafafa'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong>{fb.patientName || (fb.patient && fb.patient.name) || 'Anonymous Patient'}</strong>
                          <span style={{ color: '#ff9800', fontWeight: 'bold' }}>{fb.rating || 0}/5 ⭐</span>
                        </div>
                        <div style={{ marginBottom: '8px', color: '#333' }}>
                          {fb.comment || fb.message || '(No comment provided)'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {new Date(fb.createdAt || fb.date || Date.now()).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                  >
                    ← Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={feedbacks.length < limit}
                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedDoctorId && !loading && doctors.length === 0 && (
          <p style={{ color: '#999' }}>No staff members found in the system.</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDoctorFeedback;
