import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import feedbackService from '../../services/feedbackService';
import { toast } from 'react-toastify';
import { X, Star } from 'lucide-react';
import './FeedbackForm.css';

const FeedbackForm = ({ doctorId, doctorName, appointmentId, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [staffOptions, setStaffOptions] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState('');

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await api.get('/users');
                const staff = res.data.filter(u => ['doctor', 'admin', 'superadmin', 'nurse'].includes(u.role));
                setStaffOptions(staff);
                if (doctorId) setSelectedRecipient(doctorId);
            } catch (err) {
                console.error('Failed to load staff list for feedback:', err);
            }
        };
        fetchStaff();
    }, [doctorId]);

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
            if (selectedRecipient) {
                payload.recipientId = selectedRecipient;
                const recipient = staffOptions.find(s => s._id === selectedRecipient);
                if (recipient) payload.recipientRole = recipient.role;
            }

            await feedbackService.submitFeedback(payload);
            toast.success('Thank you for your feedback!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to submit feedback.');
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

                {doctorName && <p className="feedback-subtitle">with {doctorName}</p>}

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
                            placeholder="Tell us about your experience..."
                            maxLength={1000}
                        />
                        <span className="char-count">{comment.length}/1000</span>
                    </div>

                    <div className="form-group">
                        <label>Send feedback to:</label>
                        <select
                            className="form-control"
                            value={selectedRecipient}
                            onChange={(e) => setSelectedRecipient(e.target.value)}
                        >
                            <option value="">-- Assigned Doctor (Default) --</option>
                            {staffOptions.map(s => (
                                <option key={s._id} value={s._id}>{`${s.firstName} ${s.lastName} (${s.role})`}</option>
                            ))}
                        </select>
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
