import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Ensure this points to your configured Axios instance
import { toast } from 'react-toastify';
import { FileText, Search, Calendar, ChevronDown, ChevronRight, Download } from 'lucide-react';
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

    useEffect(() => {
        fetchData();
    }, [activeTab]);

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

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleString();
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="admin-reports-page">
            <div className="page-header">
                <h1>Reports Dashboard</h1>
                <p>View patient consultations and medical certificates.</p>
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
                        placeholder="Search patient name, diagnosis..."
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
                                    {/* <button className="btn-icon" title="Download PDF"><Download size={18}/></button> */}
                                </div>
                            </div>

                            {expandedId === item._id && (
                                <div className="report-details">
                                    <div className="details-grid">
                                        <div className="detail-item full-width">
                                            <label>Report ID</label>
                                            <p>{item._id}</p>
                                        </div>
                                        {activeTab === 'consultations' ? (
                                            <>
                                                <div className="detail-item full-width">
                                                    <label>Chief Complaint</label>
                                                    <p>{item.chiefComplaint || '—'}</p>
                                                </div>
                                                <div className="detail-item full-width">
                                                    <label>Diagnosis</label>
                                                    <p>{item.diagnosis || '—'}</p>
                                                </div>
                                                <div className="detail-item full-width">
                                                    <label>Management / Treatment</label>
                                                    <p>{item.management || '—'}</p>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Blood Pressure</label>
                                                    <p>{item.bloodPressure || '—'}</p>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Temperature</label>
                                                    <p>{item.temperature ? `${item.temperature}°C` : '—'}</p>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Heart Rate</label>
                                                    <p>{item.heartRate ? `${item.heartRate} bpm` : '—'}</p>
                                                </div>
                                                <div className="detail-item full-width">
                                                    <label>Prescribed Medicines</label>
                                                    {item.medicinesPrescribed && item.medicinesPrescribed.length > 0 ? (
                                                        <ul className="meds-list">
                                                            {item.medicinesPrescribed.map((med, idx) => (
                                                                <li key={idx}>{med.name} (x{med.quantity})</li>
                                                            ))}
                                                        </ul>
                                                    ) : <p>—</p>}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="detail-item full-width">
                                                    <label>Purpose</label>
                                                    <p>{item.purpose || 'Medical Certificate'}</p>
                                                </div>
                                                <div className="detail-item full-width">
                                                    <label>Generated On</label>
                                                    <p>{formatDate(item.appointmentDate)}</p>
                                                </div>
                                                {/* Add more certificate specific fields if any */}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminReports;
