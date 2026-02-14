import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Calendar, User, Phone, MapPin, FileText, AlertTriangle } from 'lucide-react';
import './BookAppointment.css';

const BookAppointment = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isProfileComplete, setIsProfileComplete] = useState(false);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        appointmentDate: '',
        purpose: '',
        additionalNotes: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            const user = res.data;

            // Check completeness
            const requiredFields = ['birthday', 'homeAddress', 'sex', 'civilStatus', 'contactNumber', 'bloodType'];
            const isPersonalDataComplete = requiredFields.every(field => user[field]);
            const isEmergencyComplete = user.emergencyContact?.name && user.emergencyContact?.phone;

            if (isPersonalDataComplete && isEmergencyComplete) {
                setIsProfileComplete(true);
            } else {
                setIsProfileComplete(false);
            }

            setForm(prev => ({
                ...prev,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.contactNumber || '',
                address: user.homeAddress || ''
            }));
        } catch (err) {
            console.error('Error fetching profile:', err);
            toast.error('Failed to load profile data');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.appointmentDate || !form.purpose) {
            toast.warning('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/appointments/book', {
                ...form,
                appointmentDate: new Date(form.appointmentDate).toISOString()
            });
            toast.success('Appointment scheduled successfully!');
            navigate('/patient-dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to book appointment');
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading) {
        return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
    }

    if (!isProfileComplete) {
        return (
            <div className="incomplete-profile-container">
                <div className="warning-card">
                    <AlertTriangle size={48} className="text-warning" />
                    <h2>Profile Incomplete</h2>
                    <p>Please complete your medical profile before booking an appointment.</p>
                    <p className="sub-text">We need your full medical history to provide the best care.</p>
                    <button className="btn-primary" onClick={() => navigate('/patient-profile')}>
                        Go to My Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="book-appointment-page">
            <div className="page-header">
                <h1>Book an Appointment</h1>
                <p>Schedule a visit with our medical professionals.</p>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3>Personal Information</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label><User size={16} /> First Name</label>
                                <input type="text" className="form-control" name="firstName" value={form.firstName} readOnly />
                            </div>
                            <div className="form-group">
                                <label><User size={16} /> Last Name</label>
                                <input type="text" className="form-control" name="lastName" value={form.lastName} readOnly />
                            </div>
                            <div className="form-group">
                                <label><Phone size={16} /> Phone</label>
                                <input type="text" className="form-control" name="phone" value={form.phone} readOnly />
                            </div>
                            <div className="form-group">
                                <label><MapPin size={16} /> Address</label>
                                <input type="text" className="form-control" name="address" value={form.address} readOnly />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Appointment Details</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="appointmentDate"
                                    value={form.appointmentDate}
                                    onChange={handleChange}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="form-group">
                                <label>Purpose</label>
                                <select
                                    className="form-control"
                                    name="purpose"
                                    value={form.purpose}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Purpose --</option>
                                    <option value="Medical Certificate">Medical Certificate</option>
                                    <option value="Consultation">Consultation</option>
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label>Additional Notes</label>
                                <textarea
                                    className="form-control"
                                    name="additionalNotes"
                                    rows={3}
                                    value={form.additionalNotes}
                                    onChange={handleChange}
                                    placeholder="Describe your symptoms or any specific concerns..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions-right">
                        <button type="button" className="btn-text" onClick={() => navigate('/patient-dashboard')}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Scheduling...' : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookAppointment;
