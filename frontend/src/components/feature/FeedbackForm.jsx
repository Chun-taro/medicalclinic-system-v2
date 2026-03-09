import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import feedbackService from '../../services/feedbackService';
import { toast } from 'react-toastify';
import { X, Star } from 'lucide-react';
import './FeedbackForm.css';

const FeedbackForm = ({ appointmentId, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                appointmentId,
                rating,
                comment: comment.trim()
            };

            await feedbackService.submitFeedback(payload);
            toast.success('Thank you for your feedback!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Feedback submission error:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Failed to submit feedback.';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="feedback-overlay">
            <div className="feedback-card">
                <div className="feedback-header">
                    <h3>Rate Your Experience</h3>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="feedback-form">
                    <div className="rating-container">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={32}
                                className={`star-icon ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                fill={star <= (hoverRating || rating) ? "gold" : "none"}
                                color={star <= (hoverRating || rating) ? "gold" : "#cbd5e1"}
                            />
                        ))}
                    </div>

                    <div className="form-group">
                        <label>Written Review (Optional)</label>
                        <textarea
                            className="form-control"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us about your experience with the system..."
                            maxLength={1000}
                        />
                        <span className="char-count">{comment.length}/1000</span>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-text" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting || rating === 0}>
                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackForm;
