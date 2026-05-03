import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../services/api';
import { toast } from 'react-toastify';
import {
    Search, Calendar, Filter, CheckCircle, XCircle, Edit, Trash2,
    Lock, AlertTriangle, Clock, RefreshCw, FileText
} from 'lucide-react';
import { printMedicalCertificate } from '../../utils/printCertificate';
import showConfirm from '../../utils/showConfirm';
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

    // Loading States
    const [rowLoading, setRowLoading] = useState(null);
    const [lockConflict, setLockConflict] = useState(null);

    // Certificate Selection
    const [showCertModal, setShowCertModal] = useState(false);
    const [selectedAptForCert, setSelectedAptForCert] = useState(null);

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

    const fetchAppointments = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await api.get('/appointments');
            setAppointments(res.data);
        } catch (err) {
            toast.error('Failed to load appointments');
        } finally {
            if (!silent) setLoading(false);
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
            setRowLoading(id);
            await api.patch(`/appointments/${id}/approve`, { version });
            toast.success('Appointment approved successfully');
            await fetchAppointments(true); // Silent refresh
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to approve appointment');
        } finally {
            setRowLoading(null);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm('Delete this appointment permanently?', {
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });
        if (!confirmed) return;
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
            setRowLoading(editingApt._id);
            await api.patch(`/appointments/${editingApt._id}`, {
                appointmentDate: editForm.date,
                purpose: editForm.purpose,
                rescheduleReason: editForm.rescheduleReason
            });

            await unlockAppointment(editingApt._id);
            toast.success('Appointment updated successfully');
            setShowEditModal(false);
            setEditingApt(null);
            await fetchAppointments(true); // Silent refresh
        } catch (err) {
            toast.error('Failed to update appointment');
        } finally {
            setRowLoading(null);
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
                            <th>College/Course</th>
                            <th>Doctor</th>
                            <th>Date & Time</th>
                            <th>Purpose</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppointments.length === 0 ? (
                            <tr><td colSpan="8" className="no-data">No appointments found.</td></tr>
                        ) : (
                            filteredAppointments.map(apt => (
                                <tr key={apt._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0, fontSize: '0.9rem' }}>
                                                {apt.patientId?.avatar ? (
                                                    <img
                                                        src={getImageUrl(apt.patientId.avatar)}
                                                        alt="Profile"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <span style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {(apt.patientId?.firstName?.[0] || apt.firstName?.[0] || 'U').toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="patient-info">
                                                <span className="name">{apt.patientId ? `${apt.patientId.firstName} ${apt.patientId.lastName}` : apt.firstName + ' ' + apt.lastName}</span>
                                                <span className="email">{apt.patientId?.email || apt.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="classification-cell">
                                            {apt.patientId?.role === 'patient' ? (
                                                <>
                                                    <div className="type-tag">{apt.patientId.patientType || 'Student'}</div>
                                                    {apt.patientId.patientType === 'student' && apt.patientId.course && <div className="detail-tag">{apt.patientId.course}</div>}
                                                    {apt.patientId.patientType === 'faculty' && apt.patientId.department && <div className="detail-tag">{apt.patientId.department}</div>}
                                                </>
                                            ) : '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="doctor-info">
                                            {apt.doctorId ? (
                                                <span className="doctor-name">Dr. {apt.doctorId.firstName} {apt.doctorId.lastName}</span>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
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
                                            {rowLoading === apt._id ? (
                                                <div className="button-spinner small"></div>
                                            ) : (
                                                <>
                                                    {apt.status === 'pending' && (
                                                        <button className="btn-icon success" onClick={() => handleApprove(apt._id, apt.version)} title="Approve">
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    <button className="btn-icon primary" onClick={() => openEditModal(apt)} title="Edit">
                                                        <Edit size={18} />
                                                    </button>
                                                    {(apt.status === 'completed' || apt.status === 'approved') && (
                                                        <button 
                                                            className="btn-icon secondary" 
                                                            onClick={() => {
                                                                setSelectedAptForCert(apt);
                                                                setShowCertModal(true);
                                                            }} 
                                                            title="Medical Certificate"
                                                            style={{ color: 'var(--primary)' }}
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                    )}
                                                    {/* Delete button removed per request */}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Certificate Selection Modal */}
            {showCertModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={20} /> Select Certificate Type
                            </h3>
                            <button className="close-btn" onClick={() => setShowCertModal(false)}><XCircle size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '2rem 1rem' }}>
                            <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>
                                Choose the type of medical certificate for <strong>{selectedAptForCert?.patientId?.firstName} {selectedAptForCert?.patientId?.lastName}</strong>.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button 
                                    className="cert-choice-card" 
                                    onClick={() => {
                                        printMedicalCertificate(selectedAptForCert, 'normal');
                                        setShowCertModal(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '2rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--border)',
                                        background: 'var(--bg-card)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <FileText size={40} style={{ color: 'var(--primary)' }} />
                                    <div style={{ textAlign: 'center' }}>
                                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Normal</strong>
                                        <small style={{ color: 'var(--text-muted)' }}>MC-F-001A (Fitness)</small>
                                    </div>
                                </button>
                                <button 
                                    className="cert-choice-card" 
                                    onClick={() => {
                                        printMedicalCertificate(selectedAptForCert, 'pathologic');
                                        setShowCertModal(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '2rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--border)',
                                        background: 'var(--bg-card)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <AlertTriangle size={40} style={{ color: '#e67e22' }} />
                                    <div style={{ textAlign: 'center' }}>
                                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Pathologic</strong>
                                        <small style={{ color: 'var(--text-muted)' }}>MC-F-001B (Clinical)</small>
                                    </div>
                                </button>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowCertModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>
                                {editingApt?.patientId?.avatar ? (
                                    <img src={getImageUrl(editingApt.patientId.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    (editingApt?.patientId?.firstName?.[0] || 'U').toUpperCase()
                                )}
                            </div>
                            <h3 style={{ margin: 0 }}>Reschedule Appointment</h3>
                            <button className="close-btn" style={{ marginLeft: 'auto' }} onClick={closeEditModal}><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" required value={editForm.date} min={new Date().toLocaleDateString('en-CA')} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
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
                        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>
                                {filteredAppointments.find(a => a.additionalNotes === selectedNotes)?.patientId?.avatar ? (
                                    <img src={getImageUrl(filteredAppointments.find(a => a.additionalNotes === selectedNotes).patientId.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    '?'
                                )}
                            </div>
                            <h3 style={{ margin: 0 }}>Appointment Notes</h3>
                            <button className="close-btn" style={{ marginLeft: 'auto' }} onClick={() => setShowNotesModal(false)}><XCircle size={24} /></button>
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
