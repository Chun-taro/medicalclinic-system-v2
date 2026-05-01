import React, { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { X, ExternalLink, ClipboardCheck } from 'lucide-react';
import './FeedbackForm.css';

const FeedbackForm = ({ appointmentId, onClose, onSuccess }) => {
    const [hasClicked, setHasClicked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/1vS0BbvO-L5Pce9FD2aTis1GSOJz5Xm2AMtI4dhXFlHY/viewform?edit_requested=true";

    const handleLinkClick = async () => {
        if (!hasClicked) {
            setHasClicked(true);
            try {
                await api.post('/feedback/log-click', { appointmentId });
            } catch (err) {
                console.error('Failed to log feedback click:', err);
            }
        }
        window.open(GOOGLE_FORM_URL, '_blank', 'noopener,noreferrer');
    };

    const handleFinish = () => {
        if (!hasClicked) {
            toast.warning('Please click the feedback link first.');
            return;
        }
        if (onSuccess) onSuccess();
        onClose();
    };

    return (
        <div className="feedback-overlay">
            <div className="feedback-card stubborn-feedback">
                <div className="feedback-header">
                    <h3>Service Feedback</h3>
                    {hasClicked && <button className="close-btn" onClick={onClose}><X size={24} /></button>}
                </div>

                <div className="feedback-body">
                    <div className="feedback-icon-wrapper">
                        <ClipboardCheck size={48} className="main-icon" />
                    </div>
                    
                    <h2>We value your feedback!</h2>
                    <p>To help us improve our services, please take a moment to fill out our official feedback form.</p>
                    
                    <div className="link-section">
                        <button 
                            className={`external-link-btn ${hasClicked ? 'clicked' : ''}`}
                            onClick={handleLinkClick}
                        >
                            <ExternalLink size={20} />
                            <span>Official Feedback Form</span>
                        </button>
                        {!hasClicked && <p className="hint-text">Click the button above to open the form</p>}
                    </div>

                    <div className="feedback-footer">
                        <button 
                            className="btn-primary full-width"
                            onClick={handleFinish}
                            disabled={!hasClicked}
                        >
                            {hasClicked ? 'I have completed the form' : 'Waiting for link click...'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackForm;
