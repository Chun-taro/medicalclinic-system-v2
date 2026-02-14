import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
    Search, Calendar, Filter, CheckCircle, XCircle, Edit, Trash2,
    Lock, AlertTriangle, Clock, RefreshCw
} from 'lucide-react';
import './AllAppointments.css';

const AllAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [purposeFilter, setPurposeFilter] = useState('');

    // Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingApt, setEditingApt] = useState(null);
    const [editForm, setEditForm] = useState({ date: '', purpose: '', rescheduleReason: '' });
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedNotes, setSelectedNotes] = useState('');

    // Lock State
    const [lockConflict, setLockConflict] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        filterAppointments();
    }, [appointments, activeTab, searchQuery, dateRange, purposeFilter]);

    // Unlock on unmount
    useEffect(() => {
        return () => {
            if (editingApt) unlockAppointment(editingApt._id);
        };
    }, [editingApt]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/appointments');
            setAppointments(res.data);
        } catch (err) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const filterAppointments = () => {
        let result = appointments;

        // Status Tab
        if (activeTab !== 'all') {
            result = result.filter(apt => apt.status.toLowerCase() === activeTab);
        }

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(apt =>
                (apt.patientId?.firstName?.toLowerCase().includes(q)) ||
                (apt.patientId?.lastName?.toLowerCase().includes(q)) ||
                (apt.email?.toLowerCase().includes(q)) ||
                (apt.purpose?.toLowerCase().includes(q))
            );
        }

        // Date Range
        if (dateRange.start) {
            result = result.filter(apt => new Date(apt.appointmentDate) >= new Date(dateRange.start));
        }
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59);
            result = result.filter(apt => new Date(apt.appointmentDate) <= endDate);
        }

        // Purpose
        if (purposeFilter) {
            result = result.filter(apt => apt.purpose === purposeFilter);
        }

        setFilteredFilteredAppointments(result);
    };

    const handleApprove = async (id, version) => {
        try {
            await api.patch(`/appointments/${id}/approve`, { version });
            toast.success('Appointment approved');
            fetchAppointments();
        } catch (err) {
            toast.error('Failed to approve appointment');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this appointment?')) return;
        try {
            await api.delete(`/appointments/${id}`);
            setAppointments(prev => prev.filter(a => a._id !== id));
            toast.success('Appointment deleted');
        } catch (err) {
            toast.error('Failed to delete appointment');
        }
    };

    const unlockAppointment = async (id) => {
        try {
            await api.post(`/appointments/${id}/unlock`);
        } catch (err) {
            console.error('Unlock failed', err);
        }
    };

    const openEditModal = async (apt) => {
        try {
            await api.post(`/appointments/${apt._id}/lock`);
            setEditingApt(apt);
            setEditForm({
                date: apt.appointmentDate.split('T')[0],
                time: new Date(apt.appointmentDate).toTimeString().slice(0, 5), // Extract time if needed
                purpose: apt.purpose,
                rescheduleReason: ''
            });
            setShowEditModal(true);
        } catch (err) {
            if (err.response?.data?.editorName) {
                setLockConflict(err.response.data);
            } else {
                toast.error('Failed to lock appointment');
            }
        }
    };

    const closeEditModal = async () => {
        if (editingApt) await unlockAppointment(editingApt._id);
        setShowEditModal(false);
        setEditingApt(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const newDateTime = new Date(`${editForm.date}T${editForm.time || '00:00'}`); // Combine date time if logic supports

            await api.patch(`/appointments/${editingApt._id}`, {
                appointmentDate: editForm.date, // Backend expects simple date string or ISO? Assuming date string from old code
                purpose: editForm.purpose,
                rescheduleReason: editForm.rescheduleReason
            });

            await unlockAppointment(editingApt._id);
            toast.success('Appointment updated');
            setShowEditModal(false);
            setEditingApt(null);
            fetchAppointments();
        } catch (err) {
            toast.error('Failed to update appointment');
        }
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="all-appointments-page">
            <div className="page-header">
                <h1>All Appointments</h1>
                <p>Manage pending and approved appointments.</p>
            </div>

            <div className="controls-panel">
                <div className="search-group">
                    <Search className="icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search patient, email, purpose..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filters-group">
                    <div className="date-input">
                        <span className="label">From</span>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                    </div>
                    <div className="date-input">
                        <span className="label">To</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                </div>

                <div className="actions-group">
                    <button className="btn-icon" onClick={() => { setSearchQuery(''); setDateRange({ start: '', end: '' }); }} title="Reset Filters">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            <div className="tabs-container">
                <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                    <Clock size={16} /> Pending
                </button>
                <button className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
                    <CheckCircle size={16} /> Approved
                </button>
                <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                    All
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Date & Time</th>
                            <th>Purpose</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppointments.length === 0 ? (
                            <tr><td colSpan="6" className="no-data">No appointments found.</td></tr>
                        ) : (
                            filteredAppointments.map(apt => (
                                <tr key={apt._id}>
                                    <td>
                                        <div className="patient-info">
                                            <span className="name">{apt.patientId ? `${apt.patientId.firstName} ${apt.patientId.lastName}` : apt.firstName + ' ' + apt.lastName}</span>
                                            <span className="email">{apt.patientId?.email || apt.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="datetime">
                                            <span className="date">{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                                            {/* <span className="time">{new Date(apt.appointmentDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span> */}
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="purpose-tag clickable"
                                            onClick={() => {
                                                setSelectedNotes(apt.additionalNotes || 'No additional notes provided.');
                                                setShowNotesModal(true);
                                            }}
                                            title="View Notes"
                                        >
                                            {apt.purpose}
                                        </span>
                                    </td>
                                    <td>{apt.patientId?.contactNumber || apt.phone}</td>
                                    <td>
                                        <span className={`status-badge status-${apt.status.toLowerCase()}`}>{apt.status}</span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {apt.status === 'pending' && (
                                                <button className="btn-icon success" onClick={() => handleApprove(apt._id, apt.version)} title="Approve">
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button className="btn-icon primary" onClick={() => openEditModal(apt)} title="Edit">
                                                <Edit size={18} />
                                            </button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(apt._id)} title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Reschedule Appointment</h3>
                            <button className="close-btn" onClick={closeEditModal}><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" required value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Purpose</label>
                                    <input type="text" required value={editForm.purpose} onChange={e => setEditForm({ ...editForm, purpose: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Reason for change</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Explain why this is being rescheduled..."
                                        value={editForm.rescheduleReason}
                                        onChange={e => setEditForm({ ...editForm, rescheduleReason: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={closeEditModal}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notes Modal */}
            {showNotesModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Appointment Notes</h3>
                            <button className="close-btn" onClick={() => setShowNotesModal(false)}><XCircle size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="notes-content">
                                {selectedNotes}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-primary" onClick={() => setShowNotesModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lock Conflict Modal */}
            {lockConflict && (
                <div className="modal-overlay">
                    <div className="modal-card warning">
                        <div className="modal-header">
                            <h3><Lock size={20} /> Record Locked</h3>
                        </div>
                        <div className="modal-body">
                            <p>This record is currently being edited by:</p>
                            <div className="editor-badge">
                                <strong>{lockConflict.editorName}</strong>
                            </div>
                            <p>Please try again later.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-primary" onClick={() => setLockConflict(null)}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllAppointments;
