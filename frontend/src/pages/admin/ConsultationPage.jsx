import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './Style/consultation.css';

export default function ConsultationPage() {
  const [approvedAppointments, setApprovedAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [prescribedList, setPrescribedList] = useState([]);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [showMRFModal, setShowMRFModal] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);

  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedPDFAppointment, setSelectedPDFAppointment] = useState(null);

  const [form, setForm] = useState({
    bloodPressure: '',
    temperature: '',
    oxygenSaturation: '',
    heartRate: '',
    bmi: '',
    bmiIntervention: '',
    diagnosis: '',
    management: '',
    medicinesPrescribed: '',
    referredToPhysician: false,
    physicianName: '',
    firstAidDone: 'n',
    firstAidWithin30Mins: 'n/a'
  });

  const fetchApprovedAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const approved = res.data.filter(app => app.status === 'approved');
      setApprovedAppointments(approved);
    } catch (err) {
      console.error('Error fetching appointments:', err.message);
    }
  };

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/medicines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicineOptions(res.data);
    } catch (err) {
      console.error('Error fetching medicines:', err.message);
    }
  };

  const handleViewMRF = async (userId) => {
    if (!userId) {
      alert('User ID is missing for this appointment.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatientProfile(res.data);
      setShowMRFModal(true);
    } catch (err) {
      console.error('Error fetching patient profile:', err.message);
      alert('Failed to load patient profile');
    }
  };

  const handleGenerateCertificate = async (appointment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/appointments/${appointment._id}/certificate-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medical_certificate_${appointment._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Navigate to Reports page with medical-certificates tab
      window.location.href = '/admin-reports?tab=medical-certificates';
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Failed to download certificate');
    }
  };

  useEffect(() => {
    fetchApprovedAppointments();
    fetchMedicines();
  }, []);

  // Only disable body scrolling while a modal is open
  useEffect(() => {
    if (showModal || showMRFModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, showMRFModal]);

  const handleStartConsultation = appointment => {
    setSelectedAppointment(appointment);
    setPrescribedList([]);
    setShowModal(true);
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleQuantityChange = (medicineId, qty) => {
    setPrescribedList(prev =>
      prev.map(p =>
        p.medicineId === medicineId
          ? { ...p, quantity: parseInt(qty) || 0 }
          : p
      )
    );
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Authentication required');
    return;
  }

  const validPrescribedList = prescribedList.filter(med => parseInt(med.quantity) > 0);

  if (prescribedList.length > 0 && validPrescribedList.length === 0) {
    alert('Please set quantities for prescribed medicines or remove them.');
    return;
  }

  try {
    // Step 1: Deduct inventory if needed
    if (validPrescribedList.length > 0) {
      await axios.post(
        'http://localhost:5000/api/medicines/deduct',
        { prescribed: validPrescribedList },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    // Step 2: Save consultation
    await axios.patch(
      `http://localhost:5000/api/appointments/${selectedAppointment._id}/consultation`,
      {
        ...form,
        medicinesPrescribed: validPrescribedList,
        consultationCompletedAt: new Date().toISOString()
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert(' Consultation saved and inventory updated');
    setSelectedAppointment(null);
    setShowModal(false);
    fetchApprovedAppointments();
    fetchMedicines();
  } catch (err) {
    console.error('Error saving consultation:', err);
    alert(err.response?.data?.error || ' Failed to save consultation or deduct inventory');
  }
};

  const filteredMedicines = medicineOptions.filter(med =>
    med.name.toLowerCase().includes(medicineSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="consultation-container">
        <h2>Consultation Queue</h2>
        {/* Filters */}
        <div className="filters-row" style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by patient name..."
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
            style={{ padding: '8px', minWidth: 220 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>From</span>
            <input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>To</span>
            <input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
          </label>
          <button onClick={() => { setNameFilter(''); setStartDateFilter(''); setEndDateFilter(''); }} style={{ marginLeft: 6 }}>Clear</button>
        </div>

        {approvedAppointments.length === 0 ? (
          <p>No approved appointments waiting for consultation.</p>
        ) : (
          // apply filters client-side
          (() => {
            const filtered = approvedAppointments.filter(app => {
              // name filter
              if (nameFilter) {
                const q = nameFilter.toLowerCase();
                const fullName = `${app.patientId?.firstName || ''} ${app.patientId?.lastName || ''}`.toLowerCase();
                if (!fullName.includes(q)) return false;
              }

              // date filter
              if (startDateFilter) {
                const start = new Date(startDateFilter);
                const appDate = new Date(app.appointmentDate);
                // compare dates ignoring time
                if (appDate < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
              }
              if (endDateFilter) {
                const end = new Date(endDateFilter);
                const appDate = new Date(app.appointmentDate);
                if (appDate > new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)) return false;
              }

              return true;
            });

            return (
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Purpose</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => (
                    <tr key={app._id}>
                      <td>
                        <span
                          className="clickable-name"
                          onClick={() => handleViewMRF(app.patientId?._id)}
                        >
                          {app.patientId?.firstName} {app.patientId?.lastName}
                        </span>
                      </td>
                      <td>{app.patientId?.email}</td>
                      <td>{new Date(app.appointmentDate).toLocaleDateString()}</td>
                      <td>{app.purpose}</td>
                      <td className="action-cell">
                        {app.purpose === 'Medical Certificate' ? (
                          <button onClick={() => { setSelectedPDFAppointment(app); setShowPDFModal(true); }}>📄 Certificate</button>
                        ) : (
                          <button onClick={() => handleStartConsultation(app)}>🩺 Start</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
          </table>
            );
          })()
        )}

        {/* MRF Modal */}
        {showMRFModal && patientProfile && (
          <div className="modal-overlay">
  <div className="modal-content">
    <button className="close-button" onClick={() => setShowMRFModal(false)}>✖</button>
    <h3>🩺 Medical Record Form</h3>
    <div className="mrf-section">
      {/* Personal Info */}
      <p><strong>Name:</strong> {patientProfile.firstName} {patientProfile.middleName} {patientProfile.lastName}</p>
      <p><strong>Email:</strong> {patientProfile.email}</p>
      <p><strong>Birthday:</strong> {patientProfile.birthday?.slice(0, 10)}</p>
      <p><strong>Sex:</strong> {patientProfile.sex}</p>
      <p><strong>Civil Status:</strong> {patientProfile.civilStatus}</p>
      <p><strong>Address:</strong> {patientProfile.homeAddress}</p>
      <p><strong>Contact:</strong> {patientProfile.contactNumber}</p>
      <p><strong>Blood Type:</strong> {patientProfile.bloodType}</p>

      {/* Emergency */}
      <p><strong>Emergency Contact:</strong> {patientProfile.emergencyContact?.name} ({patientProfile.emergencyContact?.relationship}) - {patientProfile.emergencyContact?.phone}</p>

      {/* Medical */}
      <p><strong>Allergies:</strong> {patientProfile.allergies?.join(', ') || '—'}</p>
      <p><strong>Medical History:</strong> {patientProfile.medicalHistory?.join(', ') || '—'}</p>
      <p><strong>Current Medications:</strong> {patientProfile.currentMedications?.join(', ') || '—'}</p>

      {/* Family History */}
      <p><strong>Family History:</strong> {
        Object.entries(patientProfile.familyHistory || {}).map(([key, val]) =>
          typeof val === 'boolean' ? (val ? `${key}, ` : '') : val ? `Other: ${val}` : ''
        )
      }</p>

      {/* Personal-Social History */}
      <h4>🧠 Personal-Social History</h4>
      <p><strong>Smoker:</strong> {patientProfile.personalSocialHistory?.smoking || '—'}</p>
      <p><strong>Sticks/Day:</strong> {patientProfile.personalSocialHistory?.smokingSticks || '—'}</p>
      <p><strong>Drinker:</strong> {patientProfile.personalSocialHistory?.drinking || '—'}</p>
      <p><strong>Drinking Since:</strong> {patientProfile.personalSocialHistory?.drinkingStartYear || '—'}</p>
      <p><strong>Drinking Frequency:</strong> {patientProfile.personalSocialHistory?.drinkingFrequency || '—'}</p>

      {/* Past Medical History */}
      <h4>🩹 Past Medical History</h4>
      <p><strong>Conditions:</strong> {
        Object.entries(patientProfile.pastMedicalHistory || {}).filter(([_, v]) => v).map(([k]) => `${k}, `)
      }</p>

      {/* Admissions & Operations */}
      <h4>🏥 Hospitalization</h4>
      <p><strong>Admissions:</strong> {patientProfile.admissionCount || '—'} ({patientProfile.admissionReason || '—'})</p>
      <p><strong>Operation Date:</strong> {patientProfile.operationDate?.slice(0, 10) || '—'}</p>
      <p><strong>Procedure:</strong> {patientProfile.operationProcedure || '—'}</p>

      {/* Immunization */}
      <h4>💉 Immunization History</h4>
      <p><strong>Vaccines:</strong> {
        Object.entries(patientProfile.immunization || {}).filter(([_, v]) => v).map(([k]) => `${k}, `)
      }</p>
      <p><strong>Last Admission:</strong> {patientProfile.lastAdmissionDate?.slice(0, 10) || '—'} ({patientProfile.lastAdmissionTypeLocation || '—'})</p>
    </div>
  </div>
</div>
        )}

        {/* PDF Modal */}
        {showPDFModal && selectedPDFAppointment && (
          <div className="modal-overlay">
            <div className="consultation-modal">
              <button className="close-button" onClick={() => setShowPDFModal(false)}>✖</button>
              <h3 className="modal-title">📄 Print Medical Certificate</h3>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Patient: {selectedPDFAppointment.patientId?.firstName} {selectedPDFAppointment.patientId?.lastName}</p>
                <p>Purpose: {selectedPDFAppointment.purpose}</p>
                <p>Date: {new Date(selectedPDFAppointment.appointmentDate).toLocaleDateString()}</p>
                <button
                  onClick={() => {
                    handleGenerateCertificate(selectedPDFAppointment);
                    setShowPDFModal(false);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '20px'
                  }}
                >
                  🖨️ Print Certificate
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && selectedAppointment && (
  <div className="modal-overlay">
    <div className="consultation-modal">
  <button className="close-button" onClick={() => setShowModal(false)}>✖</button>
  <form onSubmit={handleSubmit} className="consultation-form">
    <h3 className="modal-title">🩺 Consultation Form</h3>

    {/* Vital Signs */}
    <div className="form-section">
      <h4 className="section-label">Vital Signs</h4>
      <input name="bloodPressure" placeholder="Blood Pressure" value={form.bloodPressure} onChange={handleChange} />
      <input name="temperature" placeholder="Temperature (°C)" value={form.temperature} onChange={handleChange} />
      <input name="oxygenSaturation" placeholder="Oxygen Saturation (%)" value={form.oxygenSaturation} onChange={handleChange} />
      <input name="heartRate" placeholder="Heart Rate (bpm)" value={form.heartRate} onChange={handleChange} />
      <input name="bmi" placeholder="BMI" value={form.bmi} onChange={handleChange} />
      <input name="bmiIntervention" placeholder="BMI Intervention" value={form.bmiIntervention} onChange={handleChange} />
    </div>

    {/* Clinical Assessment */}
    <div className="form-section">
      <h4 className="section-label">Clinical Assessment</h4>
      <textarea name="diagnosis" placeholder="Diagnosis" value={form.diagnosis} onChange={handleChange} rows={3} />
      <textarea name="management" placeholder="Management Plan" value={form.management} onChange={handleChange} rows={3} />
    </div>

    {/* Prescribe Medicines */}
    <div className="form-section">
      <h4 className="section-label">Prescribe Medicines</h4>
      <input
        type="text"
        placeholder="Type medicine name..."
        value={medicineSearch}
        onChange={e => setMedicineSearch(e.target.value)}
        onBlur={() => setTimeout(() => setMedicineSearch(''), 200)}
        className="medicine-autocomplete"
      />
      {medicineSearch && (
        <ul className="autocomplete-suggestions">
          {filteredMedicines
            .filter(med => !prescribedList.some(p => p.medicineId === med._id))
            .slice(0, 5)
            .map(med => (
              <li
                key={med._id}
                onClick={() => {
                  setPrescribedList(prev => [
                    ...prev,
                    {
                      medicineId: med._id,
                      name: med.name,
                      quantity: 0,
                      expiryDate: med.expiryDate
                    }
                  ]);
                  setMedicineSearch('');
                }}
              >
                {med.name} ({med.quantityInStock} caps) — Exp: {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : '—'}
              </li>
            ))}
        </ul>
      )}

      {prescribedList.length > 0 && (
        <div className="prescribed-list">
          <h5>Prescribed Medicines:</h5>
          {prescribedList.map(p => (
            <div key={p.medicineId} className="prescribed-row">
              <div className="medicine-info">
                <span className="medicine-name">{p.name}</span>
                <span className="expiry-date">Exp: {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '—'}</span>
              </div>
              <div className="quantity-controls">
                <label>Quantity:</label>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={p.quantity}
                  onChange={e => handleQuantityChange(p.medicineId, e.target.value)}
                  placeholder="0"
                  className="quantity-input"
                />
                <span className="capsules-label">capsules</span>
              </div>
              <button
                type="button"
                className="remove-medicine"
                onClick={() => setPrescribedList(prev => prev.filter(m => m.medicineId !== p.medicineId))}
                title="Remove medicine"
              >
                ❌ Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Referral */}
    <div className="form-section">
      <h4 className="section-label">Referral</h4>
      <label className="checkbox-label">
        <input type="checkbox" name="referredToPhysician" checked={form.referredToPhysician} onChange={handleChange} />
        Referred to Physician
      </label>
      <input name="physicianName" placeholder="Physician Name" value={form.physicianName} onChange={handleChange} />
    </div>

    {/* First Aid */}
    <div className="form-section">
      <h4 className="section-label">First Aid</h4>
      <label>First Aid Done Within 30 Minutes</label>
      <select name="firstAidWithin30Mins" value={form.firstAidWithin30Mins} onChange={handleChange}>
        <option value="y">Yes</option>
        <option value="n">No</option>
        <option value="n/a">N/A</option>
      </select>
    </div>

    <button type="submit">✅ Save Consultation</button>
  </form>
</div>
  </div>
)}
      </div>
    </AdminLayout>
  );
}