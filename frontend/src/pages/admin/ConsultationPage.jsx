import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../services/api'; // Use api instance and getImageUrl
import { toast } from 'react-toastify';
import CourseSelect from '../../components/ui/CourseSelect';
import {
    Users, Calendar, FileText, CheckCircle, Clock,
    Activity, ChevronRight, Search, X, Stethoscope, Printer, AlertTriangle
} from 'lucide-react';
import { printMedicalCertificate } from '../../utils/printCertificate';
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
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [includeCertificate, setIncludeCertificate] = useState(false);

    // Consultation Form
    const [form, setForm] = useState({
        bloodPressure: '', temperature: '', oxygenSaturation: '',
        heartRate: '', bmi: '', bmiIntervention: '',
        height: '', weight: '', pulseRate: '', respiratoryRate: '', lmp: '',
        visualAcuityOS: '', visualAcuityOD: '',
        diagnosis: '', management: '', remarks: '',
        externalPrescription: '',
        p_age: '', p_sex: '', p_address: '', p_course: '', p_civilStatus: '',
        referredToPhysician: false, physicianName: '',
        firstAidDone: 'n', firstAidWithin30Mins: 'n/a',
        doctorId: '',
        issuedFor: '',
        isFit: true,
        validForAY: '',
        validForSemester: '',
        certificateType: 'normal'
    });
    const [warnings, setWarnings] = useState({});

    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

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
        fetchHistory(app.patientId?._id);
        // Reset form
        setForm({
            bloodPressure: '', temperature: '', oxygenSaturation: '',
            heartRate: '', bmi: '', bmiIntervention: '',
            height: '', weight: '', pulseRate: '', respiratoryRate: '', lmp: '',
            visualAcuityOS: '', visualAcuityOD: '',
            diagnosis: '', management: '', remarks: '',
            externalPrescription: '',
            p_age: app.patientId?.age || '',
            p_sex: app.patientId?.sex || '',
            p_address: app.patientId?.homeAddress || '',
            p_course: app.patientId?.course || '',
            p_civilStatus: app.patientId?.civilStatus || '',
            referredToPhysician: false, physicianName: '',
            firstAidDone: 'n', firstAidWithin30Mins: 'n/a',
            doctorId: currentUser?.role === 'doctor' ? currentUser.userId : '',
            issuedFor: app.purpose || '',
            isFit: true,
            validForAY: '',
            validForSemester: '',
            certificateType: 'normal'
        });
        setWarnings({});
        setPrescribed([]);
        setIncludeCertificate(false);
    };

    const fetchHistory = async (patientId) => {
        if (!patientId) return;
        try {
            setLoadingHistory(true);
            const res = await api.get(`/appointments/patient/${patientId}`);
            // Show only completed consultations with actual medical data
            const past = res.data.filter(a => 
                a.status === 'completed' && 
                (a.diagnosis || a.management || (a.medicinesPrescribed && a.medicinesPrescribed.length > 0))
            );
            setHistory(past);
        } catch (err) {
            console.error('Failed to load patient history:', err);
        } finally {
            setLoadingHistory(false);
        }
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

    const handleViewPastPrescription = (past) => {
        // Mock a selectedApp and form for the modal
        const mockApp = {
            ...past,
            patientId: selectedApp?.patientId?._id === past.patientId?._id ? selectedApp.patientId : past.patientId 
        };
        // We need to ensure the doctor name is available
        // The modal uses form.doctorId
        setForm({
            ...form,
            externalPrescription: past.externalPrescription,
            p_age: past.p_age || '',
            p_sex: past.p_sex || '',
            p_address: past.p_address || '',
            doctorId: past.doctorId?._id || past.doctorId
        });
        setSelectedApp(mockApp);
        setShowPrescriptionModal(true);
    };

    const handlePrintPrescription = () => {
        const doctor = doctors.find(d => d._id === form.doctorId);
        const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '________________';

        // Create a hidden iframe for clean printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        const html = `
            <html>
                <head>
                    <title>Prescription - ${selectedApp?.patientId?.firstName} ${selectedApp?.patientId?.lastName}</title>
                    <style>
                        @page { size: 4.25in 5.5in; margin: 0; }
                        body { 
                            margin: 0; 
                            padding: 0.3in; 
                            font-family: 'Times New Roman', serif;
                            width: 4.25in;
                            height: 5.5in;
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                        }
                        .slip-header {
                            display: flex;
                            align-items: center;
                            gap: 15px;
                            border-bottom: 2px solid black;
                            padding-bottom: 10px;
                            margin-bottom: 15px;
                        }
                        .slip-titles {
                            flex: 1;
                            text-align: center;
                        }
                        .slip-titles h2 { margin: 0; font-size: 14px; }
                        .slip-titles p { margin: 2px 0; font-size: 10px; }
                        .slip-doc-type { margin-top: 5px; font-size: 12px; font-weight: bold; text-decoration: underline; text-align: center; width: 100%; display: block; }
                        .slip-patient-data { margin-bottom: 15px; font-size: 11px; }
                        .slip-row { display: flex; gap: 20px; border-bottom: 1px solid black; margin-bottom: 8px; padding-bottom: 2px; }
                        .fill-line { flex: 1; }
                        .rx-content { flex: 1; position: relative; margin-top: 20px; }
                        .rx-symbol { font-size: 40px; font-weight: bold; position: absolute; top: -5px; }
                        .rx-body { padding-top: 30px; padding-left: 15px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
                        .slip-footer { border-top: 2px solid black; padding-top: 15px; margin-top: auto; }
                        .physician { text-align: center; margin-left: auto; width: 220px; }
                        .sig-line { border-bottom: 1px solid black; font-weight: bold; font-size: 14px; padding-bottom: 2px; }
                        .physician p { margin: 2px 0; font-size: 10px; }
                        .metadata { display: flex; justify-content: space-between; font-size: 7px; color: #555; margin-top: 15px; border-top: 1px solid #ccc; padding-top: 5px; }
                    </style>
                </head>
                <body>
                    <div class="slip-header">
                        <img src="/logo.png" width="45" height="45" />
                        <div class="slip-titles">
                            <h2>BUKIDNON STATE UNIVERSITY</h2>
                            <p>Malaybalay City, Bukidnon 8700</p>
                            <p>Tel (088) 813-5661; Fax (088) 813-2717</p>
                        </div>
                    </div>
                    <span class="slip-doc-type">PRESCRIPTION SLIP</span>
                    
                    <div class="slip-patient-data">
                        <div class="slip-row">
                            <span class="fill-line"><b>Name:</b> ${selectedApp?.patientId?.firstName} ${selectedApp?.patientId?.lastName}</span>
                            <span style="min-width: 60px;"><b>Age:</b> ${form.p_age || '—'}</span>
                            <span style="min-width: 60px;"><b>Sex:</b> ${form.p_sex || '—'}</span>
                        </div>
                        <div class="slip-row">
                            <span class="fill-line"><b>Address:</b> ${form.p_address || '—'}</span>
                            <span style="min-width: 100px;"><b>Date:</b> ${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div class="rx-content">
                        <div class="rx-symbol">Rx</div>
                        <div class="rx-body">${form.externalPrescription || ''}</div>
                    </div>

                    <div class="slip-footer">
                        <div class="physician">
                            <div class="sig-line">${doctorName}</div>
                            <p>University Physician</p>
                        </div>
                        <div class="metadata">
                            <span>Doc Code: OSS-F-MC-009</span>
                            <span>Rev No: 03</span>
                            <span>Issue Date: 09/28/2020</span>
                            <span>Page 1 of 1</span>
                        </div>
                    </div>
                </body>
            </html>
        `;

        doc.write(html);
        doc.close();

        // Use a short delay to ensure the content is ready for printing
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        const requiredVitals = ['bloodPressure', 'temperature', 'pulseRate', 'respiratoryRate', 'height', 'weight'];
        const missingVitals = requiredVitals.filter(f => !form[f]);
        
        if (missingVitals.length > 0) {
            toast.error('Please fill in all Vital Signs before completing.');
            return;
        }

        if (!form.diagnosis) {
            toast.error('Please enter a Diagnosis/Doctor\'s Note.');
            return;
        }

        try {
            // Deduct inventory first
            if (prescribed.length > 0) {
                await api.post('/medicines/deduct', { prescribed });
            }

            // Save consultation
            await api.patch(`/appointments/${selectedApp._id}/consultation`, {
                ...form,
                medicinesPrescribed: prescribed,
                hasMedicalCertificate: includeCertificate,
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
                                            {app.patientId?.avatar ? (
                                                <img src={getImageUrl(app.patientId.avatar)} alt="" className="avatar-img" />
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
                    <div className="consultation-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button className="btn-secondary" onClick={() => setSelectedApp(null)}>Cancel</button>
                            <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                                {selectedApp.patientId?.avatar ? (
                                    <img src={getImageUrl(selectedApp.patientId.avatar)} alt="" className="avatar-img" />
                                ) : (
                                    selectedApp.patientId?.firstName ? selectedApp.patientId.firstName[0] : 'P'
                                )}
                            </div>
                            <h2 style={{ margin: 0 }}>Consultation: {selectedApp.patientId?.firstName} {selectedApp.patientId?.lastName}</h2>
                        </div>
                        
                    </div>

                    <div className="consultation-layout" style={{ display: 'block' }}>
                        <div className="consultation-main">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <button 
                                    className="btn-secondary" 
                                    onClick={() => {
                                        fetchHistory(selectedApp.patientId?._id);
                                        setShowHistoryModal(true);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                                >
                                    <Clock size={18} /> View History
                                </button>
                            </div>
                            {selectedApp.purpose === 'Medical Certificate' ? (
                                <div className="certificate-view" style={{ background: 'var(--bg-card)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                                    <div className="cert-preview" style={{ width: '100%', margin: '0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                                                    {selectedApp.patientId?.avatar ? (
                                                        <img src={getImageUrl(selectedApp.patientId.avatar)} alt="" className="avatar-img" />
                                                    ) : (
                                                        selectedApp.patientId?.firstName ? selectedApp.patientId.firstName[0] : 'P'
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedApp.patientId?.firstName} {selectedApp.patientId?.lastName}</h3>
                                                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem' }}>Purpose: {selectedApp.purpose}</p>
                                                </div>
                                            </div>
                                            <div className="cert-type-selector" style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-body)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                                                <button 
                                                    className={form.certificateType === 'normal' ? 'btn-primary' : 'btn-ghost'}
                                                    onClick={() => setForm({...form, certificateType: 'normal'})}
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                >Normal Cert</button>
                                                <button 
                                                    className={form.certificateType === 'pathologic' ? 'btn-primary' : 'btn-ghost'}
                                                    onClick={() => setForm({...form, certificateType: 'pathologic'})}
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                >Pathologic Cert</button>
                                            </div>
                                        </div>

                                        <div className="cert-form-grid">
                                            <div className="input-group">
                                                <label>Issued For</label>
                                                <input value={form.issuedFor} onChange={e => setForm({ ...form, issuedFor: e.target.value })} placeholder="Purpose" />
                                            </div>
                                            {form.certificateType === 'normal' && (
                                                <>
                                                    <div className="input-group">
                                                        <label>Status</label>
                                                        <select value={form.isFit ? 'true' : 'false'} onChange={e => setForm({ ...form, isFit: e.target.value === 'true' })}>
                                                            <option value="true">Fit</option>
                                                            <option value="false">Not Fit</option>
                                                        </select>
                                                    </div>
                                                    <div className="input-group">
                                                        <label>AY</label>
                                                        <input value={form.validForAY} onChange={e => setForm({ ...form, validForAY: e.target.value })} placeholder="2024-2025" />
                                                    </div>
                                                    <div className="input-group">
                                                        <label>Semester</label>
                                                        <select value={form.validForSemester} onChange={e => setForm({ ...form, validForSemester: e.target.value })}>
                                                            <option value="">Select...</option>
                                                            <option value="1st">1st Sem</option>
                                                            <option value="2nd">2nd Sem</option>
                                                            <option value="Summer">Summer</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="patient-overrides">
                                            <h3>Certificate Information (Fillable)</h3>
                                            <div className="overrides-grid">
                                                <div className={`input-group ${!form.p_age ? 'has-warning' : ''}`}>
                                                    <label>Age {!form.p_age && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.p_age} onChange={e => setForm({ ...form, p_age: e.target.value })} placeholder="Age" />
                                                </div>
                                                <div className={`input-group ${!form.p_sex ? 'has-warning' : ''}`}>
                                                    <label>Sex {!form.p_sex && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.p_sex} onChange={e => setForm({ ...form, p_sex: e.target.value })} placeholder="Sex" />
                                                </div>
                                                <div className={`input-group ${!form.p_civilStatus ? 'has-warning' : ''}`}>
                                                    <label>Civil Status {!form.p_civilStatus && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.p_civilStatus} onChange={e => setForm({ ...form, p_civilStatus: e.target.value })} placeholder="Single" />
                                                </div>
                                                <div className={`input-group ${!form.p_address ? 'has-warning' : ''}`}>
                                                    <label>Resident of {!form.p_address && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.p_address} onChange={e => setForm({ ...form, p_address: e.target.value })} placeholder="Address" />
                                                </div>
                                                <div className={`input-group ${!form.p_course ? 'has-warning' : ''}`}>
                                                    <label>Taking up (Course) {!form.p_course && <span className="warning-text">(Empty)</span>}</label>
                                                    <CourseSelect name="p_course" value={form.p_course} onChange={e => setForm({ ...form, p_course: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="vitals-section" style={{ marginBottom: '1rem' }}>
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '1rem' }}><Activity size={18} /> Vitals & Measurements</h3>
                                            <div className="vitals-grid">
                                                <div className={`input-group ${!form.bloodPressure ? 'has-warning' : ''}`}>
                                                    <label>BP {!form.bloodPressure && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.bloodPressure} onChange={e => setForm({ ...form, bloodPressure: e.target.value })} placeholder="120/80" />
                                                </div>
                                                <div className={`input-group ${!form.temperature ? 'has-warning' : ''}`}>
                                                    <label>Temp (°C) {!form.temperature && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} placeholder="36.5" />
                                                </div>
                                                <div className={`input-group ${!form.pulseRate ? 'has-warning' : ''}`}>
                                                    <label>PR (bpm) {!form.pulseRate && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.pulseRate} onChange={e => setForm({ ...form, pulseRate: e.target.value })} placeholder="72" />
                                                </div>
                                                <div className={`input-group ${!form.respiratoryRate ? 'has-warning' : ''}`}>
                                                    <label>RR (cpm) {!form.respiratoryRate && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.respiratoryRate} onChange={e => setForm({ ...form, respiratoryRate: e.target.value })} placeholder="18" />
                                                </div>
                                                <div className={`input-group ${!form.height ? 'has-warning' : ''}`}>
                                                    <label>Height (cm) {!form.height && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} placeholder="170" />
                                                </div>
                                                <div className={`input-group ${!form.weight ? 'has-warning' : ''}`}>
                                                    <label>Weight (kg) {!form.weight && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="65" />
                                                </div>
                                                <div className="input-group">
                                                    <label>BMI</label>
                                                    <input value={form.bmi} onChange={e => setForm({ ...form, bmi: e.target.value })} placeholder="22.5" />
                                                </div>
                                                <div className="input-group">
                                                    <label>LMP</label>
                                                    <input value={form.lmp} onChange={e => setForm({ ...form, lmp: e.target.value })} placeholder="Date" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="assessment-section" style={{ marginBottom: '1rem' }}>
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '1rem' }}><FileText size={18} /> Clinical Assessment</h3>
                                            
                                            {form.certificateType === 'normal' ? (
                                                <div className="grid-2">
                                                    <div className="input-group">
                                                        <label>Visual Acuity (OS)</label>
                                                        <input value={form.visualAcuityOS} onChange={e => setForm({ ...form, visualAcuityOS: e.target.value })} placeholder="20/20" />
                                                    </div>
                                                    <div className="input-group">
                                                        <label>Visual Acuity (OD)</label>
                                                        <input value={form.visualAcuityOD} onChange={e => setForm({ ...form, visualAcuityOD: e.target.value })} placeholder="20/20" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid-2">
                                                    <div className="input-group">
                                                        <label>Diagnosis (Pathologic)</label>
                                                        <textarea rows={3} value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="Enter clinical diagnosis..." />
                                                    </div>
                                                    <div className="input-group">
                                                        <label>Remarks</label>
                                                        <textarea rows={3} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Enter additional remarks..." />
                                                    </div>
                                                </div>
                                            )}

                                            {form.certificateType === 'normal' && (
                                                <div className="input-group" style={{ marginTop: '0.75rem' }}>
                                                    <label>Remarks (Optional)</label>
                                                    <textarea rows={2} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks for normal certificate..." />
                                                </div>
                                            )}
                                        </div>

                                        <div className="cert-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', marginTop: '2rem' }}>
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
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button
                                                    className="btn-secondary big"
                                                    style={{ flex: 1 }}
                                                    onClick={() => {
                                                        const docObj = doctors.find(d => d._id === form.doctorId);
                                                        printMedicalCertificate({ ...selectedApp, ...form, doctorId: docObj || selectedApp.doctorId }, form.certificateType);
                                                    }}
                                                >
                                                    <Printer size={18} /> Preview & Print
                                                </button>
                                                <button
                                                    className="btn-primary big"
                                                    style={{ flex: 1 }}
                                                    disabled={!form.doctorId}
                                                    onClick={async () => {
                                                        // Validation for Certificate
                                                        const requiredVitals = ['bloodPressure', 'temperature', 'pulseRate', 'respiratoryRate', 'height', 'weight'];
                                                        const requiredCert = ['p_age', 'p_sex', 'p_address', 'p_course', 'p_civilStatus', 'issuedFor'];
                                                        
                                                        const missingVitals = requiredVitals.filter(f => !form[f]);
                                                        const missingCert = requiredCert.filter(f => !form[f]);

                                                        if (missingVitals.length > 0 || missingCert.length > 0) {
                                                            toast.error('Please fill in all Vitals and Certificate Information fields.');
                                                            return;
                                                        }

                                                        if (form.certificateType === 'pathologic' && !form.diagnosis) {
                                                            toast.error('Diagnosis is required for Pathologic certificates.');
                                                            return;
                                                        }

                                                        try {
                                                            await api.patch(`/appointments/${selectedApp._id}/consultation`, {
                                                                ...form,
                                                                medicinesPrescribed: [],
                                                                status: 'completed',
                                                                consultationCompletedAt: new Date()
                                                            });
                                                            toast.success('Medical Certificate completed');
                                                            setSelectedApp(null);
                                                            fetchQueue();
                                                        } catch (err) {
                                                            toast.error('Failed to complete certificate');
                                                        }
                                                    }}
                                                >
                                                    Complete & Save
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="consultation-form">
                                    <div className="form-section">
                                        <h3><Activity size={20} /> Vitals & Measurements</h3>
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
                                                <label>Heart Rate / PR (bpm)</label>
                                                <input value={form.pulseRate} onChange={e => setForm({ ...form, pulseRate: e.target.value })} placeholder="72" />
                                            </div>
                                            <div className="input-group">
                                                <label>Respiratory Rate (cpm)</label>
                                                <input value={form.respiratoryRate} onChange={e => setForm({ ...form, respiratoryRate: e.target.value })} placeholder="18" />
                                            </div>
                                            <div className="input-group">
                                                <label>Height (cm)</label>
                                                <input value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} placeholder="170" />
                                            </div>
                                            <div className="input-group">
                                                <label>Weight (kg)</label>
                                                <input value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="65" />
                                            </div>
                                            <div className="input-group">
                                                <label>Sat (%)</label>
                                                <input value={form.oxygenSaturation} onChange={e => setForm({ ...form, oxygenSaturation: e.target.value })} placeholder="98" />
                                            </div>
                                            <div className="input-group">
                                                <label>BMI</label>
                                                <input value={form.bmi} onChange={e => setForm({ ...form, bmi: e.target.value })} placeholder="22.5" />
                                            </div>
                                            <div className="input-group">
                                                <label>LMP (Last Menstrual Period)</label>
                                                <input value={form.lmp} onChange={e => setForm({ ...form, lmp: e.target.value })} placeholder="Date or N/A" />
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
                                                <div className={`input-group full ${!form.diagnosis ? 'has-warning' : ''}`}>
                                                    <label>Doctor's Note / Diagnosis {!form.diagnosis && <span className="warning-text">(Empty)</span>}</label>
                                                    <textarea rows={3} value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} required placeholder="Enter clinical assessment or doctor's observations..." />
                                                </div>
                                                <div className={`input-group full ${!form.management ? 'has-warning' : ''}`}>
                                                    <label>Home Instructions / Management {!form.management && <span className="warning-text">(Empty)</span>}</label>
                                                    <textarea rows={3} value={form.management} onChange={e => setForm({ ...form, management: e.target.value })} placeholder="Enter at-home care instructions..." />
                                                </div>
                                                <div className="input-group full">
                                                    <label>Additional Remarks</label>
                                                    <textarea rows={2} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Enter any extra remarks for the certificate..." />
                                                </div>
                                            </div>

                                            <div className="form-section">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <h3><FileText size={20} /> View or generate the Prescription</h3>
                                                    <button type="button" className="btn-secondary" onClick={() => setShowPrescriptionModal(true)} disabled={!form.externalPrescription}>
                                                        <Printer size={18} /> Preview & Print
                                                    </button>
                                                </div>
                                                <div className="input-group full">
                                                    <label>Prescribed Medicines (External/Printable)</label>
                                                    <textarea 
                                                        rows={4} 
                                                        value={form.externalPrescription} 
                                                        onChange={e => setForm({ ...form, externalPrescription: e.target.value })} 
                                                        placeholder="Enter medicines to be printed on the prescription slip..."
                                                    />
                                                </div>
                                                <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem', marginTop: '1rem' }}>
                                                <div className={`input-group ${!form.p_age ? 'has-warning' : ''}`}>
                                                    <label>Age {!form.p_age && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.p_age} onChange={e => setForm({ ...form, p_age: e.target.value })} placeholder="Age" />
                                                </div>
                                                <div className={`input-group ${!form.p_sex ? 'has-warning' : ''}`}>
                                                    <label>Sex {!form.p_sex && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.p_sex} onChange={e => setForm({ ...form, p_sex: e.target.value })} placeholder="Sex" />
                                                </div>
                                                <div className={`input-group ${!form.p_address ? 'has-warning' : ''}`}>
                                                    <label>Address {!form.p_address && <span className="warning-text">(Empty)</span>}</label>
                                                    <input value={form.p_address} onChange={e => setForm({ ...form, p_address: e.target.value })} placeholder="Address" />
                                                </div>
                                                </div>
                                            </div>

                                            <div className="form-section">
                                                <h3><Activity size={20} /> Inventory (In-Clinic Dispensing)</h3>
                                                <div className="med-search">
                                                    <Search size={18} className="search-icon" />
                                                    <input
                                                        className="med-search-input"
                                                        placeholder="Search clinic inventory to dispense..."
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

                                            <div className="form-section">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <h3><FileText size={20} /> Medical Certificate</h3>
                                                    <button 
                                                        type="button" 
                                                        className={`btn-${includeCertificate ? 'secondary' : 'primary'}`} 
                                                        onClick={() => setIncludeCertificate(!includeCertificate)}
                                                    >
                                                        {includeCertificate ? 'Remove Certificate' : 'Issue Medical Certificate'}
                                                    </button>
                                                </div>
                                                
                                                {includeCertificate && (
                                                    <div style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                                            <div className="cert-type-selector" style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                                                <button type="button" className={form.certificateType === 'normal' ? 'btn-primary' : 'btn-ghost'} onClick={() => setForm({...form, certificateType: 'normal'})} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Normal Cert</button>
                                                                <button type="button" className={form.certificateType === 'pathologic' ? 'btn-primary' : 'btn-ghost'} onClick={() => setForm({...form, certificateType: 'pathologic'})} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Pathologic Cert</button>
                                                            </div>
                                                        </div>
                                                        <div className="cert-form-grid">
                                                            <div className="input-group">
                                                                <label>Issued For</label>
                                                                <input value={form.issuedFor} onChange={e => setForm({ ...form, issuedFor: e.target.value })} placeholder="Purpose" />
                                                            </div>
                                                            {form.certificateType === 'normal' && (
                                                                <>
                                                                    <div className="input-group">
                                                                        <label>Status</label>
                                                                        <select value={form.isFit ? 'true' : 'false'} onChange={e => setForm({ ...form, isFit: e.target.value === 'true' })}>
                                                                            <option value="true">Fit</option>
                                                                            <option value="false">Not Fit</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="input-group">
                                                                        <label>AY</label>
                                                                        <input value={form.validForAY} onChange={e => setForm({ ...form, validForAY: e.target.value })} placeholder="2024-2025" />
                                                                    </div>
                                                                    <div className="input-group">
                                                                        <label>Semester</label>
                                                                        <select value={form.validForSemester} onChange={e => setForm({ ...form, validForSemester: e.target.value })}>
                                                                            <option value="">Select...</option>
                                                                            <option value="1st">1st Sem</option>
                                                                            <option value="2nd">2nd Sem</option>
                                                                            <option value="Summer">Summer</option>
                                                                        </select>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        
                                                        {form.certificateType === 'normal' && (
                                                            <div className="grid-2" style={{ marginTop: '1rem' }}>
                                                                <div className="input-group">
                                                                    <label>Visual Acuity (OS)</label>
                                                                    <input value={form.visualAcuityOS} onChange={e => setForm({ ...form, visualAcuityOS: e.target.value })} placeholder="20/20" />
                                                                </div>
                                                                <div className="input-group">
                                                                    <label>Visual Acuity (OD)</label>
                                                                    <input value={form.visualAcuityOD} onChange={e => setForm({ ...form, visualAcuityOD: e.target.value })} placeholder="20/20" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                    <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
                                        {includeCertificate && (
                                            <button 
                                                type="button"
                                                className="btn-secondary big" 
                                                style={{ flex: 1 }}
                                                onClick={() => {
                                                    const docObj = doctors.find(d => d._id === form.doctorId);
                                                    printMedicalCertificate({ ...selectedApp, ...form, doctorId: docObj || selectedApp.doctorId }, form.certificateType);
                                                }}
                                            >
                                                <Printer size={18} /> Preview & Print Certificate
                                            </button>
                                        )}
                                        <button type="submit" className="btn-primary big" style={{ flex: includeCertificate ? 1 : 'unset', width: includeCertificate ? 'auto' : '100%' }}>Complete Consultation {includeCertificate && '& Save'}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="modal-overlay">
                    <div className="modal-card wide">
                        <div className="modal-header">
                            <h3><Clock size={20} /> Consultation History</h3>
                            <button className="close-btn" onClick={() => setShowHistoryModal(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            {loadingHistory ? (
                                <div className="mini-loader">Loading history...</div>
                            ) : history.length === 0 ? (
                                <p className="no-history">No past consultations found.</p>
                            ) : (
                                <div className="history-timeline" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {history.map(past => (
                                        <div key={past._id} className="history-card">
                                            <div className="history-date">
                                                {new Date(past.consultationCompletedAt || past.appointmentDate).toLocaleDateString()}
                                            </div>
                                            <div className="history-diag">
                                                <strong>Doctor's Note</strong>
                                                {past.diagnosis || 'None'}
                                            </div>
                                            {past.management && (
                                                <div className="history-mgmt">
                                                    <strong>Instructions</strong>
                                                    {past.management}
                                                </div>
                                            )}
                                            {past.medicinesPrescribed?.length > 0 && (
                                                <div className="history-meds">
                                                    <strong>Inventory</strong>
                                                    {past.medicinesPrescribed.map(m => `${m.name} (x${m.quantity})`).join(', ')}
                                                </div>
                                            )}
                                            <div className="history-doctor">
                                                <Stethoscope size={12} /> Dr. {past.doctorId?.firstName} {past.doctorId?.lastName}
                                            </div>
                                            {past.externalPrescription && (
                                                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                                                    <button 
                                                        type="button" 
                                                        className="btn-secondary small" 
                                                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewPastPrescription(past);
                                                        }}
                                                    >
                                                        <Printer size={14} /> View Prescription
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-primary" onClick={() => setShowHistoryModal(false)}>Close</button>
                        </div>
                    </div>
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
                                        {patientProfile.avatar ? (
                                            <img src={getImageUrl(patientProfile.avatar)} alt="" className="avatar-img" />
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
                                    <p><strong>Classification:</strong> {patientProfile.patientType ? patientProfile.patientType.charAt(0).toUpperCase() + patientProfile.patientType.slice(1) : 'Student'}</p>
                                    <p><strong>Sex:</strong> {patientProfile.sex}</p>
                                    {patientProfile.patientType === 'student' && <p><strong>Course:</strong> {patientProfile.course || '—'}</p>}
                                    {patientProfile.patientType === 'faculty' && <p><strong>Department:</strong> {patientProfile.department || '—'}</p>}
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

                                    <h4>Family History</h4>
                                    <p><strong>Conditions:</strong> {Object.entries(patientProfile.familyHistory || {}).filter(([k, v]) => v && k !== 'otherSpecify' && k !== '_id').map(([k]) => k === 'other' ? (patientProfile.familyHistory.otherSpecify ? `Other: ${patientProfile.familyHistory.otherSpecify}` : 'Other') : k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')).join(', ') || '—'}</p>

                                    <h4>Past Medical History</h4>
                                    <p><strong>Illnesses:</strong> {Object.entries(patientProfile.pastMedicalHistory || {}).filter(([k, v]) => v && k !== 'otherSpecify' && k !== '_id').map(([k]) => k === 'other' ? (patientProfile.pastMedicalHistory.otherSpecify ? `Other: ${patientProfile.pastMedicalHistory.otherSpecify}` : 'Other') : k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())).join(', ') || '—'}</p>

                                    <h4>Immunization</h4>
                                    <p><strong>Vaccines:</strong> {Object.entries(patientProfile.immunization || {}).filter(([k, v]) => v && k !== 'otherSpecify' && k !== '_id').map(([k]) => k === 'other' ? (patientProfile.immunization.otherSpecify ? `Other: ${patientProfile.immunization.otherSpecify}` : 'Other') : k.replace(/([A-Z])/g, ' $1').trim()).join(', ') || '—'}</p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-primary" onClick={() => setShowMRFModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Prescription Print Modal */}
            {showPrescriptionModal && selectedApp && (
                <div className="modal-overlay">
                    <div className="modal-card wide">
                        <div className="modal-header">
                            <h3>Prescription Preview</h3>
                            <button className="close-btn" onClick={() => setShowPrescriptionModal(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body printable-area">
                            <div className="prescription-slip">
                                <header className="slip-header">
                                    <div className="slip-logo-placeholder">
                                        {/* You can put BSU Logo here */}
                                        <img src="/logo.png" alt="BSU Logo" style={{ width: '60px', height: '60px' }} />
                                    </div>
                                    <div className="slip-titles">
                                        <h2>BUKIDNON STATE UNIVERSITY</h2>
                                        <p>Malaybalay City, Bukidnon 8700</p>
                                        <p>Tel (088) 813-5661 to 5663; TeleFax (088) 813-2717</p>
                                        <p>www.buksu.edu.ph</p>
                                        <h3 className="slip-doc-type">PRESCRIPTION SLIP</h3>
                                    </div>
                                </header>

                                <div className="slip-patient-data">
                                    <div className="slip-row">
                                        <span className="fill-line"><strong>Name:</strong> {selectedApp.patientId?.firstName} {selectedApp.patientId?.lastName}</span>
                                        <span className="fixed"><strong>Age:</strong> {form.p_age || '—'}</span>
                                        <span className="fixed"><strong>Sex:</strong> {form.p_sex || '—'}</span>
                                    </div>
                                    <div className="slip-row">
                                        <span className="fill-line"><strong>Address:</strong> {form.p_address || '—'}</span>
                                        <span className="fixed"><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="slip-content">
                                    <div className="rx-symbol">Rx</div>
                                    <div className="rx-body">
                                        {form.externalPrescription.split('\n').map((line, i) => (
                                            <p key={i}>{line}</p>
                                        ))}
                                    </div>
                                </div>

                                <footer className="slip-footer">
                                    <div className="physician-signature">
                                        <div className="sig-line">
                                            <strong>{doctors.find(d => d._id === form.doctorId) ? `Dr. ${doctors.find(d => d._id === form.doctorId).firstName} ${doctors.find(d => d._id === form.doctorId).lastName}` : 'Dr. ____________________'}</strong>
                                        </div>
                                        <p>University Physician</p>
                                    </div>
                                    
                                    <div className="slip-metadata">
                                        <div className="meta-item">Document Code:<br/>OSS-F-MC-009</div>
                                        <div className="meta-item">Revision No:<br/>03</div>
                                        <div className="meta-item">Issue No:<br/>01</div>
                                        <div className="meta-item">Issue Date:<br/>09/28/2020</div>
                                        <div className="meta-item">Page No:<br/>1 of 1</div>
                                    </div>
                                </footer>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowPrescriptionModal(false)}>Close</button>
                            <button className="btn-primary" onClick={handlePrintPrescription}>
                                <Printer size={18} /> Print Prescription
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultationPage;
