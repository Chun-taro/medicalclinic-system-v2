import React, { useState, useEffect } from 'react';
import axios from 'axios';
import feedbackService from '../services/feedbackService';
import './FeedbackForm.css';

const FeedbackForm = ({ doctorId, doctorName, appointmentId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');

  useEffect(() => {
    // Fetch staff members (doctor/admin/superadmin/nurse)
    const fetchStaff = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const staff = res.data.filter(u => ['doctor','admin','superadmin','nurse'].includes(u.role));
        setStaffOptions(staff);
        // default selection: appointment doctorId if provided
        if (doctorId) setSelectedRecipient(doctorId);
      } catch (err) {
        console.error('Failed to load staff list for feedback:', err);
      }
    };

    fetchStaff();
  }, [doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        appointmentId,
        rating,
        comment: comment.trim()
      };
      if (selectedRecipient) {
        payload.recipientId = selectedRecipient;
        const recipient = staffOptions.find(s => s._id === selectedRecipient);
        if (recipient) payload.recipientRole = recipient.role;
      }

      await feedbackService.submitFeedback(payload);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Show success message
      alert('Thank you for your feedback!');
      onClose();
    } catch (err) {
      console.error('Failed to submit feedback', err);
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRating(0);
    setComment('');
    setError('');
    onClose();
  };

  return (
    <div className="feedback-form-overlay">
      <div className="feedback-form-container">
        <div className="feedback-form-header">
          <h3>Rate Your Experience</h3>
          {doctorName && <p className="doctor-name">with {doctorName}</p>}
          <button className="close-btn" onClick={handleCancel}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="rating-section">
            <label>How would you rate your appointment?</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  role="button"
                  tabIndex="0"
                  aria-label={`${star} stars`}
                >
                  ★
                </span>
              ))}
            </div>
            {rating > 0 && (
              <p className="rating-text">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          <div className="comment-section">
            <label htmlFor="comment">Add a written review (optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="5"
              placeholder="Tell us about your experience... What went well? Any suggestions for improvement?"
              maxLength="1000"
            />
            <p className="char-count">{comment.length} / 1000 characters</p>
          </div>

          <div className="recipient-section">
            <label htmlFor="recipient">Send feedback to (optional)</label>
            <select
              id="recipient"
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(e.target.value)}
            >
              <option value="">-- Prefer recipient (default: assigned doctor) --</option>
              {staffOptions.map(s => (
                <option key={s._id} value={s._id}>{`${s.firstName} ${s.lastName} (${s.role})`}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-submit"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
