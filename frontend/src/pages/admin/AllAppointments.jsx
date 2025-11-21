import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './Style/appointment-table.css';

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
  const [nameFilter, setNameFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');

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

  // Apply client-side filters to appointments list
  const filteredAppointments = appointments.filter(app => {
    // Name filter: match patient name from patientId or appointment-level name
    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      const first = app.patientId?.firstName || app.firstName || '';
      const last = app.patientId?.lastName || app.lastName || '';
      const full = (first + ' ' + last).toLowerCase();
      if (!full.includes(q)) return false;
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
      alert('Failed to delete appointment');
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

  const openEditModal = appointment => {
    setEditId(appointment._id);
    setEditDate(appointment.appointmentDate.split('T')[0]);
    setEditPurpose(appointment.purpose);
    setShowModal(true);
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
      alert('Appointment rescheduled and patient notified');
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      alert('Failed to reschedule appointment');
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <h2>All Appointments</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by name"
          value={nameFilter}
          onChange={e => setNameFilter(e.target.value)}
        />
        <label style={{ fontSize: '12px' }}>From:</label>
        <input
          type="date"
          value={startDateFilter}
          onChange={e => setStartDateFilter(e.target.value)}
        />
        <label style={{ fontSize: '12px' }}>To:</label>
        <input
          type="date"
          value={endDateFilter}
          onChange={e => setEndDateFilter(e.target.value)}
        />
        <select value={purposeFilter} onChange={e => setPurposeFilter(e.target.value)}>
          <option value="">All Purposes</option>
          <option value="checkup">Checkup</option>
          <option value="medical-certificate">Medical Certificate</option>
        </select>
        <button onClick={() => { setNameFilter(''); setStartDateFilter(''); setEndDateFilter(''); setPurposeFilter(''); }}>Clear</button>
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
          <div className="modal-content">
            <h3>Reschedule Appointment</h3>
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
            <div style={{ marginTop: '10px' }}>
              <button onClick={handleReschedule}>Confirm</button>
              <button onClick={() => setShowModal(false)} style={{ marginLeft: '10px' }}>Cancel</button>
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
                <table className="appointment-table">
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
  {filteredAppointments.filter(app => app.status === 'pending').map(app => (
    <tr key={app._id}>
      <td>{app.patientId?.firstName || app.firstName || 'N/A'} {app.patientId?.lastName || app.lastName || ''}</td>
      <td>{new Date(app.appointmentDate).toLocaleDateString()}</td>
      <td>{app.patientId?.email || app.email || 'N/A'}</td>
      <td>{app.patientId?.contactNumber || app.phone || 'N/A'}</td>
      <td>{app.purpose}</td>
      <td><span className="status-tag pending">Pending</span></td>
      <td className="action-cell">
        <button onClick={() => handleApprove(app._id)}>✅</button>
        <button onClick={() => openEditModal(app)}>✏️</button>
        <button onClick={() => handleDelete(app._id)}>🗑️</button>
      </td>
    </tr>
  ))}
</tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'approved' && (
            <>
              <h3>Approved Appointments</h3>
              <div className="appointment-table-wrapper">
                <table className="appointment-table">
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
  {filteredAppointments.filter(app => app.status === 'approved').map(app => (
    <tr key={app._id}>
      <td>{app.patientId?.firstName || app.firstName || 'N/A'} {app.patientId?.lastName || app.lastName || ''}</td>
      <td>{new Date(app.appointmentDate).toLocaleDateString()}</td>
      <td>{app.patientId?.email || app.email || 'N/A'}</td>
      <td>{app.patientId?.contactNumber || app.phone || 'N/A'}</td>
      <td>{app.purpose}</td>
      <td><span className="status-tag confirmed">Approved</span></td>
      <td className="action-cell">
        <button onClick={() => openEditModal(app)}>✏️</button>
        <button onClick={() => handleDelete(app._id)}>🗑️</button>
      </td>
    </tr>
  ))}
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
