import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './Style/AllAppointments.css';

export default function AllAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  // Alert popup
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [userName, setUserName] = useState('');
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockModalData, setLockModalData] = useState({ editorName: '', editorId: '' });

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(res.data);
    } catch (err) {
      console.error('Error fetching appointments:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserName(`${res.data.firstName} ${res.data.lastName}`);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setUserName('Superadmin');
      }
    };
    fetchUserProfile();
  }, []);

  // Unlock appointment when modal is closed without clicking Cancel/Confirm
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (showModal && editId) {
        try {
          const token = localStorage.getItem('token');
          await axios.post(`http://localhost:5000/api/appointments/${editId}/unlock`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.error('Failed to unlock appointment on page unload:', err);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [showModal, editId]);

  // Apply client-side filters to appointments list
  const filteredAppointments = appointments.filter(app => {
    // Search query: match across name, email, phone, purpose
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const first = app.patientId?.firstName || app.firstName || '';
      const last = app.patientId?.lastName || app.lastName || '';
      const fullName = (first + ' ' + last).toLowerCase();
      const email = (app.patientId?.email || app.email || '').toLowerCase();
      const phone = (app.patientId?.contactNumber || app.phone || '').toLowerCase();
      const purpose = app.purpose.toLowerCase();
      if (!fullName.includes(q) && !email.includes(q) && !phone.includes(q) && !purpose.includes(q)) return false;
    }

    // Date filters (inclusive)
    if (startDateFilter) {
      const start = new Date(startDateFilter);
      const appDate = new Date(app.appointmentDate);
      if (appDate < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
    }
    if (endDateFilter) {
      const end = new Date(endDateFilter);
      const appDate = new Date(app.appointmentDate);
      if (appDate > new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)) return false;
    }

    // Purpose filter
    if (purposeFilter) {
      if (purposeFilter === 'checkup' && !app.purpose.startsWith('Checkup:')) return false;
      if (purposeFilter === 'medical-certificate' && app.purpose !== 'Medical Certificate') return false;
    }

    return true;
  });

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(prev => prev.filter(app => app._id !== id));
    } catch (err) {
      setAlertMessage('Failed to delete appointment');
      setShowAlert(true);
      console.error(err);
    }
  };

  const handleApprove = async id => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/appointments/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Appointment approved');
      fetchAppointments();
    } catch (err) {
      alert('Failed to approve appointment');
      console.error(err);
    }
  };

  const openEditModal = async appointment => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/appointments/${appointment._id}/lock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEditId(appointment._id);
      setEditDate(appointment.appointmentDate.split('T')[0]);
      setEditPurpose(appointment.purpose);
      setShowModal(true);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.editorName) {
        // Show lock conflict modal
        setLockModalData({
          editorName: errorData.editorName,
          editorId: errorData.editorId
        });
        setShowLockModal(true);
      } else {
        setAlertMessage(errorData?.error || 'Failed to lock appointment for editing');
        setShowAlert(true);
      }
      console.error(err);
    }
  };

  const handleReschedule = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/appointments/${editId}`, {
        appointmentDate: editDate,
        purpose: editPurpose
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Unlock the appointment after successful update
      await axios.post(`http://localhost:5000/api/appointments/${editId}/unlock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAlertMessage('Appointment rescheduled and patient notified');
      setShowAlert(true);
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      setAlertMessage('Failed to reschedule appointment');
      setShowAlert(true);
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <h2>All Appointments</h2>

      {/* Filters */}
      <div className="filters-container">
        <input
          type="text"
          placeholder="Search by name, email, phone, or purpose"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="date-group">
          <label>From:</label>
          <input
            type="date"
            value={startDateFilter}
            onChange={e => setStartDateFilter(e.target.value)}
          />
        </div>
        <div className="date-group">
          <label>To:</label>
          <input
            type="date"
            value={endDateFilter}
            onChange={e => setEndDateFilter(e.target.value)}
          />
        </div>
        <select value={purposeFilter} onChange={e => setPurposeFilter(e.target.value)}>
          <option value="">All Purposes</option>
          <option value="checkup">Checkup</option>
          <option value="medical-certificate">Medical Certificate</option>
        </select>
        <button onClick={() => { setSearchQuery(''); setStartDateFilter(''); setEndDateFilter(''); setPurposeFilter(''); }}>Clear</button>
      </div>

     {/* Tab Navigation */}
<div className="tab-header">
  <button
    className={`tab pending ${activeTab === 'pending' ? 'active' : ''}`}
    onClick={() => setActiveTab('pending')}
  >
     Pending
  </button>
  <button
    className={`tab approved ${activeTab === 'approved' ? 'active' : ''}`}
    onClick={() => setActiveTab('approved')}
  >
     Approved
  </button>
</div>


      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content appointment-modal">
            <div className="modal-header">
              <h3>Reschedule Appointment</h3>
              <p className="editor-info">Currently editing by: {userName}</p>
            </div>
            <div className="modal-body">
              <label>Date:</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
              <label>Purpose:</label>
              <input
                type="text"
                value={editPurpose}
                onChange={(e) => setEditPurpose(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button onClick={handleReschedule}>Confirm</button>
              <button onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  await axios.post(`http://localhost:5000/api/appointments/${editId}/unlock`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  setShowModal(false);
                } catch (err) {
                  console.error('Failed to unlock appointment:', err);
                  setAlertMessage('Failed to unlock appointment. Please try again.');
                  setShowAlert(true);
                }
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlert && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>{alertMessage}</p>
            <button onClick={() => setShowAlert(false)}>OK</button>
          </div>
        </div>
      )}

      {/* Lock Conflict Modal */}
      {showLockModal && (
        <div className="modal-overlay">
          <div className="modal-content appointment-modal">
            <div className="modal-header">
              <h3>⚠️ Appointment Locked</h3>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔒</div>
                <p style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#374151' }}>
                  This appointment is currently being edited by another user.
                </p>
                <div style={{
                  backgroundColor: '#f3f4f6',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  margin: '15px 0'
                }}>
                  <strong style={{ color: '#1f2937', fontSize: '1.2rem' }}>
                    {lockModalData.editorName}
                  </strong>
                  <br />
                  <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Currently editing this appointment
                  </span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                  Please wait for them to finish or contact an administrator if needed.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowLockModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Tables */}
      {loading ? (
        <p>Loading appointments...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <>
          {activeTab === 'pending' && (
            <>
              <h3>Pending Appointments</h3>
              <div className="appointment-table-wrapper">
                <table className="all-appointments-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Purpose</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
  {filteredAppointments.filter(app => app.status === 'pending').length === 0 ? (
    <tr>
      <td colSpan="7" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic', color: '#666' }}>
        No pending appointments
      </td>
    </tr>
  ) : (
    filteredAppointments.filter(app => app.status === 'pending').map(app => (
      <tr key={app._id}>
        <td>{app.patientId?.firstName || app.firstName || 'N/A'} {app.patientId?.lastName || app.lastName || ''}</td>
        <td>{new Date(app.appointmentDate).toLocaleString()}</td>
        <td>{app.patientId?.email || app.email || 'N/A'}</td>
        <td>{app.patientId?.contactNumber || app.phone || 'N/A'}</td>
        <td>{app.purpose}</td>
        <td><span className="status-tag pending">Pending</span></td>
        <td className="action-cell">
          <button onClick={() => handleApprove(app._id)} className="approve-btn">Approve</button>
          <button onClick={() => openEditModal(app)} className="edit-btn">Edit</button>
          <button onClick={() => handleDelete(app._id)} className="delete-btn">Delete</button>
        </td>
      </tr>
    ))
  )}
</tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'approved' && (
            <>
              <h3>Approved Appointments</h3>
              <div className="appointment-table-wrapper">
                <table className="all-appointments-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Purpose</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
  {filteredAppointments.filter(app => app.status === 'approved').length === 0 ? (
    <tr>
      <td colSpan="7" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic', color: '#666' }}>
        No approved appointments
      </td>
    </tr>
  ) : (
    filteredAppointments.filter(app => app.status === 'approved').map(app => (
      <tr key={app._id}>
        <td>{app.patientId?.firstName || app.firstName || 'N/A'} {app.patientId?.lastName || app.lastName || ''}</td>
        <td>{new Date(app.appointmentDate).toLocaleDateString()}</td>
        <td>{app.patientId?.email || app.email || 'N/A'}</td>
        <td>{app.patientId?.contactNumber || app.phone || 'N/A'}</td>
        <td>{app.purpose}</td>
        <td><span className="status-tag confirmed">Approved</span></td>
        <td className="action-cell">
          <button onClick={() => openEditModal(app)} className="edit-btn">Edit</button>
          <button onClick={() => handleDelete(app._id)} className="delete-btn">Delete</button>
        </td>
      </tr>
    ))
  )}
</tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
}
