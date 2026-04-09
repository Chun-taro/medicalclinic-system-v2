import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../services/api'; // Use api instance and getImageUrl
import { toast } from 'react-toastify';
import {
    Users, Calendar, FileText, CheckCircle, Clock,
    Activity, ChevronRight, Search, X, Stethoscope
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './ConsultationPage.css';

const ConsultationPage = () => {
    const { user: currentUser } = useAuth();
    const [queue, setQueue] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [medicines, setMedicines] = useState([]);
    const [medSearch, setMedSearch] = useState('');
    const [prescribed, setPrescribed] = useState([]);
    const [doctors, setDoctors] = useState([]);

    // Consultation Form
    const [form, setForm] = useState({
        bloodPressure: '', temperature: '', oxygenSaturation: '',
        heartRate: '', bmi: '', bmiIntervention: '',
        diagnosis: '', management: '',
        referredToPhysician: false, physicianName: '',
        firstAidDone: 'n', firstAidWithin30Mins: 'n/a',
        doctorId: ''
    });

    // MRF State
    const [showMRFModal, setShowMRFModal] = useState(false);
    const [patientProfile, setPatientProfile] = useState(null);

    useEffect(() => {
        fetchQueue();
        fetchMedicines();
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/users?role=doctor');
            setDoctors(res.data);
        } catch (err) {
            console.error('Failed to load doctors');
        }
    };

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const res = await api.get('/appointments');
            // Filter queue: approved appointments (and maybe not completed yet?)
            // Assuming 'approved' is waiting for consultation. 'completed' is done.
            setQueue(res.data.filter(a => a.status === 'approved'));
        } catch (err) {
            toast.error('Failed to load queue');
        } finally {
            setLoading(false);
        }
    };

    const fetchMedicines = async () => {
        try {
            const res = await api.get('/medicines');
            setMedicines(res.data);
        } catch (err) {
            console.error('Failed to load medicines');
        }
    };

    const handleViewMRF = async (patientId) => {
        console.log('handleViewMRF clicked with ID:', patientId);
        if (!patientId) {
            console.error('No patient ID provided');
            return;
        }
        try {
            const res = await api.get(`/users/profile/${patientId}`);
            console.log('Profile fetched:', res.data);
            if (!res.data) {
                throw new Error('Empty profile data');
            }
            setPatientProfile(res.data);
            setShowMRFModal(true);
        } catch (err) {
            console.error('Error fetching profile:', err);
            toast.error('Failed to load patient profile');
        }
    };

    const handleStart = (app) => {
        setSelectedApp(app);
        // Reset form
        setForm({
            bloodPressure: '', temperature: '', oxygenSaturation: '',
            heartRate: '', bmi: '', bmiIntervention: '',
            diagnosis: '', management: '',
            referredToPhysician: false, physicianName: '',
            firstAidDone: 'n', firstAidWithin30Mins: 'n/a',
            doctorId: currentUser?.role === 'doctor' ? currentUser.userId : ''
        });
        setPrescribed([]);
    };

    const handlePrescribe = (med) => {
        if (!prescribed.find(p => p.medicineId === med._id)) {
            setPrescribed([...prescribed, {
                medicineId: med._id,
                name: med.name,
                quantity: 1,
                max: med.quantityInStock,
                appointmentId: selectedApp._id
            }]);
        }
        setMedSearch('');
    };

    const updatePrescription = (id, qty) => {
        setPrescribed(prescribed.map(p => p.medicineId === id ? { ...p, quantity: parseInt(qty) } : p));
    };

    const removePrescription = (id) => {
        setPrescribed(prescribed.filter(p => p.medicineId !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Deduct inventory first
            if (prescribed.length > 0) {
                await api.post('/medicines/deduct', { prescribed });
            }

            // Save consultation
            await api.patch(`/appointments/${selectedApp._id}/consultation`, {
                ...form,
                medicinesPrescribed: prescribed,
                consultationCompletedAt: new Date()
            });

            toast.success('Consultation completed');
            setSelectedApp(null);
            fetchQueue();
            fetchMedicines(); // Update stock
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to complete consultation');
        }
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="consultation-page">
            {!selectedApp ? (
                <>
                    <div className="page-header">
                        <h1>Consultation Queue</h1>
                        <p>Select a patient to start consultation.</p>
                    </div>

                    <div className="queue-list">
                        {queue.length === 0 ? (
                            <div className="no-data">No patients in queue.</div>
                        ) : (
                            queue.map(app => (
                                <div key={app._id} className="queue-card">
                                    <div className="patient-info">
                                        <div className="avatar">
                                            {app.patientId?.profilePicture ? (
                                                <img src={getImageUrl(app.patientId.profilePicture)} alt="" className="avatar-img" />
                                            ) : (
                                                app.patientId?.firstName ? app.patientId.firstName[0] : 'P'
                                            )}
                                        </div>
                                        <div>
                                            <h3>
                                                <span
                                                    className="clickable"
                                                    style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log('Clicked name:', app.patientId?._id);
                                                        handleViewMRF(app.patientId?._id);
                                                    }}
                                                    title="View Medical Record"
                                                >
                                                    {app.patientId ? `${app.patientId.firstName} ${app.patientId.lastName}` : 'Unknown'}
                                                </span>
                                            </h3>
                                            <span className="purpose">{app.purpose}</span>
                                        </div>
                                    </div>
                                    <div className="queue-actions">
                                        <div className="time-waiting">
                                            <Clock size={16} /> {new Date(app.appointmentDate).toLocaleDateString()}
                                        </div>
                                        {app.purpose === 'Medical Certificate' ? (
                                            <button className="btn-secondary" onClick={() => handleStart(app)}>
                                                <FileText size={16} /> Certificate
                                            </button>
                                        ) : (
                                            <button className="btn-primary" onClick={() => handleStart(app)}>
                                                Start <ChevronRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div className="consultation-view">
                    <div className="consultation-header">
                        <button className="btn-secondary" onClick={() => setSelectedApp(null)}>Cancel</button>
                        <div className="header-patient-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                                {selectedApp.patientId?.profilePicture ? (
                                    <img src={getImageUrl(selectedApp.patientId.profilePicture)} alt="" className="avatar-img" />
                                ) : (
                                    selectedApp.patientId?.firstName ? selectedApp.patientId.firstName[0] : 'P'
                                )}
                            </div>
                            <h2 style={{ margin: 0 }}>Consultation: {selectedApp.patientId?.firstName} {selectedApp.patientId?.lastName}</h2>
                        </div>
                    </div>

                    {selectedApp.purpose === 'Medical Certificate' ? (
                        <div className="certificate-view">
                            <div className="cert-preview">
                                <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', marginBottom: '1rem' }}>
                                    {selectedApp.patientId?.profilePicture ? (
                                        <img src={getImageUrl(selectedApp.patientId.profilePicture)} alt="" className="avatar-img" />
                                    ) : (
                                        selectedApp.patientId?.firstName ? selectedApp.patientId.firstName[0] : 'P'
                                    )}
                                </div>
                                <FileText size={48} className="text-primary" />
                                <h3>Medical Certificate Ongoing</h3>
                                <p><strong>Patient:</strong> {selectedApp.patientId?.firstName} {selectedApp.patientId?.lastName}</p>
                                <p><strong>Purpose:</strong> {selectedApp.purpose}</p>
                                <p><strong>Date:</strong> {new Date(selectedApp.appointmentDate).toLocaleDateString()}</p>
                                <div className="cert-actions">
                                    <div className="doctor-assignment" style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '300px' }}>
                                        <label style={{ display: 'block', textAlign: 'left', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Assign Attending Doctor</label>
                                        <select 
                                            value={form.doctorId} 
                                            onChange={e => setForm({ ...form, doctorId: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                                            required
                                        >
                                            <option value="">Select Doctor...</option>
                                            {doctors.map(doc => (
                                                <option key={doc._id} value={doc._id}>Dr. {doc.firstName} {doc.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        className="btn-primary big"
                                        disabled={!form.doctorId}
                                        onClick={async () => {
                                            try {
                                                await api.patch(`/appointments/${selectedApp._id}`, { 
                                                    status: 'completed',
                                                    doctorId: form.doctorId 
                                                });
                                                toast.success('Medical Certificate completed');
                                                setSelectedApp(null);
                                                fetchQueue();
                                            } catch (err) {
                                                toast.error('Failed to complete certificate');
                                            }
                                        }}
                                    >
                                        Mark as Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="consultation-form">
                            <div className="form-section">
                                <h3><Activity size={20} /> Vitals</h3>
                                <div className="grid-2">
                                    <div className="input-group">
                                        <label>Blood Pressure</label>
                                        <input value={form.bloodPressure} onChange={e => setForm({ ...form, bloodPressure: e.target.value })} placeholder="e.g. 120/80" />
                                    </div>
                                    <div className="input-group">
                                        <label>Temperature (°C)</label>
                                        <input value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} placeholder="36.5" />
                                    </div>
                                    <div className="input-group">
                                        <label>Heart Rate (bpm)</label>
                                        <input value={form.heartRate} onChange={e => setForm({ ...form, heartRate: e.target.value })} placeholder="72" />
                                    </div>
                                    <div className="input-group">
                                        <label>Sat (%)</label>
                                        <input value={form.oxygenSaturation} onChange={e => setForm({ ...form, oxygenSaturation: e.target.value })} placeholder="98" />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3><Stethoscope size={20} /> Clinician Assignment</h3>
                                <div className="input-group full">
                                    <label>Attending Doctor</label>
                                    <select 
                                        value={form.doctorId} 
                                        onChange={e => setForm({ ...form, doctorId: e.target.value })}
                                        required
                                        className="doctor-select"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                    >
                                        <option value="">Select Attending Doctor...</option>
                                        {doctors.map(doc => (
                                            <option key={doc._id} value={doc._id}>Dr. {doc.firstName} {doc.lastName}</option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                        * This name will appear on the patient's records and medical certificates.
                                    </p>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3><FileText size={20} /> Assessment</h3>
                                <div className="input-group full">
                                    <label>Diagnosis</label>
                                    <textarea rows={3} value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} required />
                                </div>
                                <div className="input-group full">
                                    <label>Management Plan</label>
                                    <textarea rows={3} value={form.management} onChange={e => setForm({ ...form, management: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3><Activity size={20} /> Prescription</h3>
                                <div className="med-search">
                                    <Search size={18} className="search-icon" />
                                    <input
                                        className="med-search-input"
                                        placeholder="Search medicine to prescribe..."
                                        value={medSearch}
                                        onChange={e => setMedSearch(e.target.value)}
                                    />
                                    {medSearch && (
                                        <div className="med-results">
                                            {medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())).slice(0, 5).map(m => (
                                                <div key={m._id} className="med-result-item" onClick={() => handlePrescribe(m)}>
                                                    {m.name} ({m.quantityInStock} avail)
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="prescribed-list">
                                    {prescribed.map(p => (
                                        <div key={p.medicineId} className="prescribed-item">
                                            <span>{p.name}</span>
                                            <div className="qty-control">
                                                <input type="number" min="1" max={p.max} value={p.quantity} onChange={e => updatePrescription(p.medicineId, e.target.value)} />
                                                <button type="button" className="btn-icon danger" onClick={() => removePrescription(p.medicineId)}><X size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary big">Complete Consultation</button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* MRF Modal */}
            {
                showMRFModal && patientProfile && (
                    <div className="modal-overlay">
                        <div className="modal-card wide">
                            <div className="modal-header">
                                <h3>🩺 Medical Record Form</h3>
                                <button className="close-btn" onClick={() => setShowMRFModal(false)}><X size={24} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="mrf-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                                    <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                                        {patientProfile.profilePicture ? (
                                            <img src={getImageUrl(patientProfile.profilePicture)} alt="" className="avatar-img" />
                                        ) : (
                                            patientProfile.firstName ? patientProfile.firstName[0] : 'P'
                                        )}
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, color: 'var(--text-main)' }}>{patientProfile.firstName} {patientProfile.middleName} {patientProfile.lastName}</h2>
                                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>{patientProfile.role?.charAt(0).toUpperCase() + patientProfile.role?.slice(1)} • {patientProfile.idNumber || 'No ID Number'}</p>
                                    </div>
                                </div>
                                <div className="mrf-section">
                                    <p><strong>Name:</strong> {patientProfile.firstName} {patientProfile.middleName} {patientProfile.lastName}</p>
                                    <p><strong>Email:</strong> {patientProfile.email}</p>
                                    <p><strong>Birthday:</strong> {patientProfile.birthday ? new Date(patientProfile.birthday).toLocaleDateString() : '—'}</p>
                                    <p><strong>Sex:</strong> {patientProfile.sex}</p>
                                    <p><strong>Contact:</strong> {patientProfile.contactNumber}</p>
                                    <p><strong>Address:</strong> {patientProfile.homeAddress}</p>
                                    <p><strong>Blood Type:</strong> {patientProfile.bloodType}</p>
                                    <p><strong>Emergency Contact:</strong> {patientProfile.emergencyContact?.name} ({patientProfile.emergencyContact?.relationship}) - {patientProfile.emergencyContact?.phone}</p>

                                    <h4>Medical History</h4>
                                    <p><strong>Allergies:</strong> {patientProfile.allergies?.join(', ') || '—'}</p>
                                    <p><strong>Conditions:</strong> {patientProfile.medicalHistory?.join(', ') || '—'}</p>
                                    <p><strong>Current Meds:</strong> {patientProfile.currentMedications?.join(', ') || '—'}</p>

                                    <h4>Personal & Social History</h4>
                                    <p><strong>Smoker:</strong> {patientProfile.personalSocialHistory?.smoking || '—'} ({patientProfile.personalSocialHistory?.smokingSticks || 0} sticks/day)</p>
                                    <p><strong>Drinker:</strong> {patientProfile.personalSocialHistory?.drinking || '—'}</p>

                                    <h4>Past Medical History</h4>
                                    <p><strong>Illnesses:</strong> {Object.entries(patientProfile.pastMedicalHistory || {}).filter(([_, v]) => v).map(([k]) => k).join(', ') || '—'}</p>

                                    <h4>Immunization</h4>
                                    <p><strong>Vaccines:</strong> {Object.entries(patientProfile.immunization || {}).filter(([_, v]) => v).map(([k]) => k).join(', ') || '—'}</p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-primary" onClick={() => setShowMRFModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default ConsultationPage;
