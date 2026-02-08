import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import feedbackService from '../../services/feedbackService';
// styles are inherited from global/theme CSS files

const DoctorFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const doctorId = localStorage.getItem('userId');
        if (!doctorId) throw new Error('Missing doctor id');
        const data = await feedbackService.getDoctorFeedback(doctorId, page, limit);
        // If API returns { feedbacks: [...] } or an array, normalize
        setFeedbacks(Array.isArray(data) ? data : data.feedbacks || []);
      } catch (err) {
        setError(err.message || 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [page]);

  return (
    <ProtectedRoute requiredRole="doctor">
      <div className="container" style={{ padding: '16px' }}>
        <h2>Doctor Feedback</h2>
        {loading && <p>Loading feedback…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <div>
            {feedbacks.length === 0 && <p>No feedback found.</p>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {feedbacks.map((fb) => (
                <li key={fb._id || fb.id} style={{ border: '1px solid #ddd', padding: '12px', marginBottom: '8px', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{fb.patientName || (fb.patient && fb.patient.name) || 'Patient'}</strong>
                    <span>Rating: {fb.rating || fb.score || '—'}/5</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>{fb.comment || fb.message || ''}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{new Date(fb.createdAt || fb.date || Date.now()).toLocaleString()}</div>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <div>Page {page}</div>
              <button onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default DoctorFeedback;
