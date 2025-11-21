import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import "./Style/Reports.css";

function useRealTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "consultations";

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [nameFilter, setNameFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");


  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const endpoint = activeTab === 'consultations'
          ? "http://localhost:5000/api/appointments/consultations"
          : "http://localhost:5000/api/appointments/medical-certificates";
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const sortedData = res.data.sort((a, b) => {
          const dateA = new Date(
            a.consultationCompletedAt || a.appointmentDate || 0
          );
          const dateB = new Date(
            b.consultationCompletedAt || b.appointmentDate || 0
          );
          return dateB - dateA;
        });

        setConsultations(sortedData);
        // Reset expandedId when tab changes
        setExpandedId(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const formatDateTime = (date) => {
    try {
      return date
        ? new Date(date).toLocaleString("en-US", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "—";
    } catch {
      return "—";
    }
  };

  const currentTime = useRealTime();

  // Check if consultation has been completed/filled
  const isConsultationComplete = (c) => {
    if (c.purpose === 'Medical Certificate') {
      return c.status === 'completed';
    }
    return !!(c.diagnosis || c.management || c.bloodPressure || c.temperature || c.heartRate);
  };

  const filteredData = consultations.filter(c => {
    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      const firstName = c.firstName || c.patientId?.firstName || '';
      const lastName = c.lastName || c.patientId?.lastName || '';
      const fullName = (firstName + ' ' + lastName).toLowerCase();
      if (!fullName.includes(q)) return false;
    }
    if (startDateFilter) {
      const start = new Date(startDateFilter);
      const consultDate = new Date(c.consultationCompletedAt || c.appointmentDate);
      if (consultDate < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
    }
    if (endDateFilter) {
      const end = new Date(endDateFilter);
      const consultDate = new Date(c.consultationCompletedAt || c.appointmentDate);
      if (consultDate > new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="reports-container">
        <div className="header-section">
          <h2>📊 Reports Dashboard</h2>
          <p>Monitor patient consultations.</p>
        </div>

        {loading ? (
          <p className="status-msg">Loading consultations...</p>
        ) : error ? (
          <p className="status-msg error">{error}</p>
        ) : (
          <>
            {/* Tabs */}
            <div className="tabs" style={{ display: 'flex', marginBottom: '20px' }}>
              <button
                className={`tab-button ${activeTab === 'consultations' ? 'active' : ''}`}
                onClick={() => setSearchParams({ tab: 'consultations' })}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: activeTab === 'consultations' ? '#007bff' : '#f8f9fa',
                  color: activeTab === 'consultations' ? 'white' : 'black',
                  cursor: 'pointer',
                  borderRadius: '5px 0 0 5px'
                }}
              >
                🩺 Consultations
              </button>
              <button
                className={`tab-button ${activeTab === 'medical-certificates' ? 'active' : ''}`}
                onClick={() => setSearchParams({ tab: 'medical-certificates' })}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: activeTab === 'medical-certificates' ? '#007bff' : '#f8f9fa',
                  color: activeTab === 'medical-certificates' ? 'white' : 'black',
                  cursor: 'pointer',
                  borderRadius: '0 5px 5px 0'
                }}
              >
                📄 Medical Certificates
              </button>
            </div>

            {/* Consultations */}
            <h3 className="section-title">
              {activeTab === 'consultations' ? '🩺 Past Consultations' : '📄 Medical Certificates'}
            </h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
                style={{ padding: '8px', minWidth: '180px' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                From <input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                To <input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
              </label>
              <button onClick={() => { setNameFilter(''); setStartDateFilter(''); setEndDateFilter(''); }}>Clear</button>
            </div>
            <div className="consultation-split-view">
              {/* Left list */}
              <div className="consultation-list">
              {filteredData.length > 0 ? (
                filteredData.map((c) => {
                    // use appointment-level name if present, otherwise fall back to populated patientId
                    const firstName = c.firstName || c.patientId?.firstName || 'Unknown';
                    const lastName = c.lastName || c.patientId?.lastName || '';
                    return (
                      <div
                        key={c._id}
                        className={`consultation-item ${
                          expandedId === c._id ? 'active' : ''
                        }`}
                        onClick={() => toggleExpand(c._id)}
                      >
                        <p className="patient-name">
                          {firstName} {lastName}
                        </p>
                        <p className="consult-date">
                          <strong>Date:</strong>{' '}
                          {formatDateTime(c.appointmentDate)}
                        </p>
                        <p className="consult-diagnosis">{activeTab === 'consultations' ? c.diagnosis : 'Medical Certificate'}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="empty-list">No {activeTab === 'consultations' ? 'consultations' : 'medical certificates'} found.</p>
                )}
              </div>

              {/* Right details */}
              <div className="consultation-details">
                {(() => {
                  const selected = consultations.find(
                    (c) => c._id === expandedId
                  );
                  if (!selected) return <p>Select a consultation to view details.</p>;

                  if (!isConsultationComplete(selected)) {
                    return (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>ℹ️ No consultation data</p>
                        <p>The admin has not filled in this consultation yet.</p>
                        {selected.purpose === 'Medical Certificate' && selected.status === 'completed' && (
                          <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 600 }}>📄 Medical Certificate</p>
                            <p>This appointment was completed for medical certificate generation.</p>
                            <p><strong>Report ID:</strong> {selected._id}</p>
                            <p><strong>Completed At:</strong> {formatDateTime(selected.consultationCompletedAt || selected.appointmentDate)}</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const firstName = selected.firstName || selected.patientId?.firstName || 'Unknown';
                  const lastName = selected.lastName || selected.patientId?.lastName || '';

                  return (
                    <div key={selected._id}>
                      <h4>
                        {firstName} {lastName}
                      </h4>
                      <p>
                        <strong>Report ID:</strong> {selected._id}
                      </p>
                      {activeTab === 'medical-certificates' ? (
                        <>
                          <p>
                            <strong>Purpose:</strong> {selected.purpose || '—'}
                          </p>
                          <button
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("token");
                                const response = await axios.get(`http://localhost:5000/api/appointments/${selected._id}/certificate-pdf`, {
                                  headers: { Authorization: `Bearer ${token}` },
                                  responseType: 'blob'
                                });

                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `medical_certificate_${selected._id}.pdf`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);
                              } catch (err) {
                                console.error('Error downloading certificate:', err);
                                alert('Failed to download certificate');
                              }
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginTop: '10px'
                            }}
                          >
                            Download PDF
                          </button>
                        </>
                      ) : (
                        <>
                          <p>
                            <strong>Diagnosis:</strong> {selected.diagnosis}
                          </p>
                          <p>
                            <strong>Management:</strong> {selected.management}
                          </p>
                          <p>
                            <strong>Chief Complaint:</strong>{" "}
                            {selected.chiefComplaint}
                          </p>

                          <p>
                            <strong>Prescribed Medicines:</strong>
                          </p>
                          <ul>
                            {Array.isArray(selected.medicinesPrescribed)
                              ? selected.medicinesPrescribed.map((med, idx) => (
                                  <li key={idx}>
                                    {med.name} ×{med.quantity}
                                  </li>
                                ))
                              : (
                                <li>{selected.medicinesPrescribed || "—"}</li>
                              )}
                          </ul>

                          <p>
                            <strong>Blood Pressure:</strong> {selected.bloodPressure || '—'}
                          </p>
                          <p>
                            <strong>Temperature:</strong> {selected.temperature || '—'}°C
                          </p>
                          <p>
                            <strong>Heart Rate:</strong> {selected.heartRate || '—'} bpm
                          </p>
                          <p>
                            <strong>O₂ Saturation:</strong> {selected.oxygenSaturation || '—'}%
                          </p>
                          <p>
                            <strong>BMI:</strong> {selected.bmi || '—'}
                          </p>
                          <p>
                            <strong>BMI Intervention:</strong> {selected.bmiIntervention || '—'}
                          </p>
                          <p>
                            <strong>Referred:</strong>{" "}
                            {selected.referredToPhysician
                              ? `Yes (${selected.physicianName || "—"})`
                              : "No"}
                          </p>
                          <p>
                            <strong>First Aid:</strong>{" "}
                            {selected.firstAidDone === "y" ? "Yes" : "No"} (
                            {selected.firstAidWithin30Mins})
                          </p>
                        </>
                      )}
                      <p>
                        <strong>Completed At:</strong>{" "}
                        {formatDateTime(
                          selected.consultationCompletedAt ||
                            selected.appointmentDate
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="footer-time">
              <p>🕒 Current time: {currentTime.toLocaleString()}</p>
            </div>
          </>
        )}


      </div>
    </AdminLayout>
  );
}
