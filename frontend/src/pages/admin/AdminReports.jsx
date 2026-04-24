import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Ensure this points to your configured Axios instance
import { toast } from 'react-toastify';
import { FileText, Search, Calendar, ChevronDown, ChevronRight, Download, Printer, Activity, Heart, Thermometer, Wind, Stethoscope, User, Clock, FileBadge, X } from 'lucide-react';
import './AdminReports.css';

const AdminReports = () => {
    const [consultations, setConsultations] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('consultations');
    const [expandedId, setExpandedId] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showExportConfirm, setShowExportConfirm] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [medSearch, setMedSearch] = useState('');
    const [prescribed, setPrescribed] = useState([]);
    const [prescriptionForm, setPrescriptionForm] = useState({
        externalPrescription: '',
        p_age: '',
        p_sex: '',
        p_address: '',
        doctorId: ''
    });

    useEffect(() => {
        fetchData();
        fetchDoctors();
        fetchMedicines();
    }, [activeTab]);

    const fetchMedicines = async () => {
        try {
            const res = await api.get('/medicines');
            setMedicines(res.data);
        } catch (err) {
            console.error('Failed to load medicines');
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/users?role=doctor');
            setDoctors(res.data);
        } catch (err) {
            console.error('Failed to load doctors');
        }
    };

    useEffect(() => {
        filterData();
    }, [consultations, searchQuery, dateRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const endpoint = activeTab === 'consultations'
                ? '/appointments/consultations'
                : '/appointments/medical-certificates';

            const res = await api.get(endpoint);
            // Sort by completed date descending
            const sorted = res.data.sort((a, b) => new Date(b.consultationCompletedAt || b.appointmentDate) - new Date(a.consultationCompletedAt || a.appointmentDate));
            setConsultations(sorted);
        } catch (err) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let result = consultations;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item => {
                const name = item.patientId ? `${item.patientId.firstName} ${item.patientId.lastName}` : (item.firstName || '');
                return name.toLowerCase().includes(q) || (item.diagnosis && item.diagnosis.toLowerCase().includes(q));
            });
        }

        if (dateRange.start) {
            result = result.filter(item => new Date(item.consultationCompletedAt || item.appointmentDate) >= new Date(dateRange.start));
        }

        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59);
            result = result.filter(item => new Date(item.consultationCompletedAt || item.appointmentDate) <= endDate);
        }

        setFilteredData(result);
    };

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const handleDownload = async (id, type) => {
        try {
            const endpoint = type === 'consultation' 
                ? `/appointments/export/consultation/${id}`
                : `/appointments/export/certificate/${id}`;
            
            const filename = type === 'consultation' ? `Consultation_${id}.pdf` : `MedCert_${id}.pdf`;

            const res = await api.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Download started');
        } catch (err) {
            toast.error('Failed to download report');
        }
    };

    const handlePrintPrescription = (item) => {
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
                    <title>Prescription - ${item.patientId?.firstName} ${item.patientId?.lastName}</title>
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
                            <span class="fill-line"><b>Name:</b> ${item.patientId?.firstName} ${item.patientId?.lastName}</span>
                            <span style="min-width: 60px;"><b>Age:</b> ${item.p_age || item.patientId?.age || '—'}</span>
                            <span style="min-width: 60px;"><b>Sex:</b> ${item.p_sex || item.patientId?.sex || '—'}</span>
                        </div>
                        <div class="slip-row">
                            <span class="fill-line"><b>Address:</b> ${item.p_address || item.patientId?.homeAddress || '—'}</span>
                            <span style="min-width: 100px;"><b>Date:</b> ${new Date(item.consultationCompletedAt || item.appointmentDate).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div class="rx-content">
                        <div class="rx-symbol">Rx</div>
                        <div class="rx-body">${item.externalPrescription || 'No prescription text provided.'}</div>
                    </div>

                    <div class="slip-footer">
                        <div class="physician">
                            <div class="sig-line">Dr. ${item.doctorId?.firstName} ${item.doctorId?.lastName || '________________'}</div>
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

        iframe.onload = () => {
            iframe.contentWindow.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        };
    };

    const handleOpenPrescriptionModal = (item) => {
        setSelectedItem(item);
        setPrescriptionForm({
            externalPrescription: item.externalPrescription || '',
            p_age: item.p_age || item.patientId?.age || '',
            p_sex: item.p_sex || item.patientId?.sex || '',
            p_address: item.p_address || item.patientId?.homeAddress || '',
            doctorId: item.doctorId?._id || item.doctorId || ''
        });
        setPrescribed([]);
        setMedSearch('');
        setShowPrescriptionModal(true);
    };

    const handleAddMedicine = (med) => {
        if (prescribed.some(p => p.medicineId === med._id)) return;
        setPrescribed([...prescribed, {
            medicineId: med._id,
            name: med.name,
            quantity: 1,
            max: med.quantityInStock
        }]);
        setMedSearch('');
    };

    const updateMedQty = (id, val) => {
        setPrescribed(prescribed.map(p => 
            p.medicineId === id ? { ...p, quantity: parseInt(val) || 1 } : p
        ));
    };

    const removeMed = (id) => {
        setPrescribed(prescribed.filter(p => p.medicineId !== id));
    };

    const handleManualPrint = async () => {
        try {
            // 1. Deduct from inventory if meds were added
            if (prescribed.length > 0) {
                await api.post(`/appointments/${selectedItem._id}/prescribe`, {
                    prescribed: prescribed,
                    source: 'reports prescribe medicine'
                });
                toast.success('Inventory updated');
            }

            // 2. Prepare print data
            const printData = {
                ...selectedItem,
                externalPrescription: prescriptionForm.externalPrescription,
                p_age: prescriptionForm.p_age,
                p_sex: prescriptionForm.p_sex,
                p_address: prescriptionForm.p_address,
                doctorId: doctors.find(d => d._id === prescriptionForm.doctorId) || selectedItem.doctorId
            };

            // 3. Trigger printing
            handlePrintPrescription(printData);
            setShowPrescriptionModal(false);
            fetchMedicines(); // Refresh stock
            fetchData(); // Refresh history list to show new meds if any
        } catch (err) {
            toast.error('Failed to process prescription: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleExportSummary = async (force = false) => {
        // Explicitly check for boolean true to avoid event objects bypassing the check
        const isForced = force === true;

        // Confirmation if no date range is selected and not forced
        if (!isForced && !dateRange.start && !dateRange.end) {
            setShowExportConfirm(true);
            return;
        }

        setShowExportConfirm(false);

        try {
            const params = new URLSearchParams();
            if (dateRange.start) params.append('startDate', dateRange.start);
            if (dateRange.end) params.append('endDate', dateRange.end);

            const res = await api.get(`/appointments/export/summary?${params.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Clinic_Appointment_Summary.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Summary report downloaded');
        } catch (err) {
            toast.error('Failed to export summary');
        }
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleString();
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="admin-reports-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>Reports Dashboard</h1>
                    <p>View patient consultations and medical certificates.</p>
                </div>
            </div>

            <div className="reports-tabs">
                <button
                    className={`report-tab ${activeTab === 'consultations' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('consultations'); setSearchQuery(''); }}
                >
                    <FileText size={18} /> Consultations
                </button>
                <button
                    className={`report-tab ${activeTab === 'certificates' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('certificates'); setSearchQuery(''); }}
                >
                    <FileText size={18} /> Medical Certificates
                </button>
            </div>

            <div className="controls-panel">
                <div className="search-group">
                    <Search className="icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search patient name, doctor's note..."
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
                    <button className="btn-export-summary" onClick={handleExportSummary}>
                        <Download size={18} /> Export Summary
                    </button>
                </div>
            </div>

            <div className="reports-list">
                {filteredData.length === 0 ? (
                    <div className="no-data">No records found.</div>
                ) : (
                    filteredData.map(item => (
                        <div key={item._id} className={`report-card ${expandedId === item._id ? 'expanded' : ''}`}>
                            <div className="report-summary" onClick={() => toggleExpand(item._id)}>
                                <div className="summary-left">
                                    <div className="expand-icon">
                                        {expandedId === item._id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                    <div className="patient-details">
                                        <h3>{item.patientId ? `${item.patientId.firstName} ${item.patientId.lastName}` : (item.firstName + ' ' + item.lastName)}</h3>
                                        <span className="report-date">{formatDate(item.consultationCompletedAt || item.appointmentDate)}</span>
                                    </div>
                                </div>
                                <div className="summary-right">
                                    {activeTab === 'consultations' && (
                                        <span className="diagnosis-preview">{item.diagnosis || 'No Diagnosis'}</span>
                                    )}
                                    <button 
                                        className="btn-icon" 
                                        title="Download PDF"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(item._id, activeTab === 'consultations' ? 'consultation' : 'certificate');
                                        }}
                                    >
                                        <Download size={18}/>
                                    </button>
                                </div>
                            </div>

                            {expandedId === item._id && (
                                <div className="report-details-premium">
                                    <div className="report-header-quick">
                                        <div className="quick-item">
                                            <User size={16} />
                                            <span><b>Attending:</b> {item.doctorId ? `Dr. ${item.doctorId.firstName} ${item.doctorId.lastName}` : 'System Assigned'}</span>
                                        </div>
                                        <div className="quick-item">
                                            <Clock size={16} />
                                            <span><b>Time:</b> {formatDate(item.consultationCompletedAt || item.appointmentDate)}</span>
                                        </div>
                                        <div className="quick-item">
                                            <FileBadge size={16} />
                                            <span><b>ID:</b> {item._id}</span>
                                        </div>
                                    </div>

                                    {activeTab === 'consultations' ? (
                                        <div className="consultation-summary-detailed">
                                            <div className="vitals-summary-grid">
                                                <div className="vital-mini-card">
                                                    <Activity size={18} className="icon" style={{ color: '#ef4444' }} />
                                                    <div className="vital-info">
                                                        <label>BP</label>
                                                        <p>{item.bloodPressure || '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="vital-mini-card">
                                                    <Thermometer size={18} className="icon" style={{ color: '#f59e0b' }} />
                                                    <div className="vital-info">
                                                        <label>Temp</label>
                                                        <p>{item.temperature ? `${item.temperature}°C` : '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="vital-mini-card">
                                                    <Heart size={18} className="icon" style={{ color: '#ec4899' }} />
                                                    <div className="vital-info">
                                                        <label>Heart Rate</label>
                                                        <p>{item.heartRate ? `${item.heartRate} bpm` : '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="vital-mini-card">
                                                    <Wind size={18} className="icon" style={{ color: '#3b82f6' }} />
                                                    <div className="vital-info">
                                                        <label>O2 Sat</label>
                                                        <p>{item.oxygenSaturation ? `${item.oxygenSaturation}%` : '—'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="clinical-grid">
                                                <div className="clinical-section">
                                                    <h4><Stethoscope size={18} /> Chief Complaint / Notes</h4>
                                                    <div className="content-box bg-muted">
                                                        {item.additionalNotes || item.chiefComplaint || 'No complaints recorded.'}
                                                    </div>
                                                </div>

                                                <div className="clinical-section">
                                                    <h4><FileText size={18} /> Doctor's Note</h4>
                                                    <div className="content-box bg-primary-light">
                                                        {item.diagnosis || 'No note available.'}
                                                    </div>
                                                </div>

                                                <div className="clinical-section">
                                                    <h4><Activity size={18} /> Home Instructions</h4>
                                                    <div className="content-box bg-secondary-light">
                                                        {item.management || 'No instructions available.'}
                                                    </div>
                                                </div>

                                                <div className="clinical-section full-width">
                                                    <h4><Wind size={18} /> Medication & Prescription</h4>
                                                    <div className="inventory-summary">
                                                        {item.medicinesPrescribed && item.medicinesPrescribed.length > 0 ? (
                                                            <div className="meds-tags">
                                                                {item.medicinesPrescribed.map((med, idx) => (
                                                                    <span key={idx} className="med-tag">{med.name} (x{med.quantity})</span>
                                                                ))}
                                                            </div>
                                                        ) : <p className="text-muted">No medicines dispensed from inventory.</p>}
                                                        
                                                        <div className="report-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                                            <button 
                                                                className="btn-primary" 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenPrescriptionModal(item);
                                                                }}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                                            >
                                                                <Printer size={18} /> {item.externalPrescription ? 'Re-print Prescription' : 'Create & Print Prescription'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="certificate-summary-detailed">
                                            <div className="clinical-grid">
                                                <div className="clinical-section">
                                                    <h4><FileBadge size={18} /> Purpose of Certificate</h4>
                                                    <div className="content-box">
                                                        {item.purpose || 'Medical Certificate'}
                                                    </div>
                                                </div>
                                                <div className="clinical-section">
                                                    <h4><Clock size={18} /> Certificate Generation Date</h4>
                                                    <div className="content-box">
                                                        {formatDate(item.appointmentDate)}
                                                    </div>
                                                </div>
                                                <div className="clinical-section full-width">
                                                    <h4><FileText size={18} /> Clinical Remarks (if any)</h4>
                                                    <div className="content-box bg-muted">
                                                        {item.remarks || 'No additional remarks provided.'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            {/* Manual Prescription Modal */}
            {showPrescriptionModal && selectedItem && (
                <div className="modal-overlay">
                    <div className="modal-card wide">
                        <div className="modal-header">
                            <h3>Prescription Details</h3>
                            <button className="close-btn" onClick={() => setShowPrescriptionModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-2">
                                <div className="input-group">
                                    <label>Age</label>
                                    <input type="text" value={prescriptionForm.p_age} onChange={e => setPrescriptionForm({...prescriptionForm, p_age: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label>Sex</label>
                                    <input type="text" value={prescriptionForm.p_sex} onChange={e => setPrescriptionForm({...prescriptionForm, p_sex: e.target.value})} />
                                </div>
                            </div>
                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label>Address</label>
                                <input type="text" value={prescriptionForm.p_address} onChange={e => setPrescriptionForm({...prescriptionForm, p_address: e.target.value})} />
                            </div>
                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label>Attending Doctor</label>
                                <select value={prescriptionForm.doctorId} onChange={e => setPrescriptionForm({...prescriptionForm, doctorId: e.target.value})}>
                                    <option value="">Select Doctor</option>
                                    {doctors.map(doc => <option key={doc._id} value={doc._id}>Dr. {doc.firstName} {doc.lastName}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label>Prescription (External/Manual Slip)</label>
                                <textarea rows="4" value={prescriptionForm.externalPrescription} onChange={e => setPrescriptionForm({...prescriptionForm, externalPrescription: e.target.value})} placeholder="e.g. Paracetamol 500mg - 1 tab every 4 hours..."></textarea>
                            </div>

                            <div className="inventory-manual-section" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                                    <Activity size={18} /> Inventory Dispensing (Prescribe Dispense)
                                </h4>
                                <div className="med-search" style={{ position: 'relative', marginBottom: '1rem' }}>
                                    <Search className="search-icon" size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input 
                                        type="text" 
                                        className="med-search-input" 
                                        style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                                        placeholder="Search inventory to dispense..." 
                                        value={medSearch}
                                        onChange={e => setMedSearch(e.target.value)}
                                    />
                                    {medSearch && (
                                        <div className="med-results" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', zIndex: 10 }}>
                                            {medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())).slice(0, 5).map(m => (
                                                <div key={m._id} className="med-result-item" style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }} onClick={() => handleAddMedicine(m)}>
                                                    {m.name} ({m.quantityInStock} available)
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="prescribed-list">
                                    {prescribed.map(p => (
                                        <div key={p.medicineId} className="prescribed-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', border: '1px solid var(--border)' }}>
                                            <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
                                            <div className="qty-control" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max={p.max} 
                                                    value={p.quantity} 
                                                    onChange={e => updateMedQty(p.medicineId, e.target.value)}
                                                    style={{ width: '50px', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}
                                                />
                                                <button type="button" onClick={() => removeMed(p.medicineId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {prescribed.length > 0 && (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                            * Clicking 'Print Now' will deduct these items from inventory.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowPrescriptionModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleManualPrint}>
                                <Printer size={18} /> Print Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Confirmation Modal */}
            {showExportConfirm && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Export All History?</h3>
                            <button className="close-btn" onClick={() => setShowExportConfirm(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="warning-content">
                                <p>You haven't selected a date range. This will export <strong>every appointment</strong> in the system history, which may result in a large file.</p>
                                <p>Are you sure you want to proceed with the full export?</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" style={{ marginRight: '1rem' }} onClick={() => setShowExportConfirm(false)}>Cancel</button>
                            <button className="btn-primary" onClick={() => handleExportSummary(true)}>Export All History</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
