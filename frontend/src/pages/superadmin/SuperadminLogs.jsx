import { useEffect, useState } from 'react';
import axios from 'axios';
import SuperadminLayout from './SuperadminLayout';
import './Style/SuperadminLogs.css';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

export default function SuperadminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check user role
    const role = localStorage.getItem('role');
    if (role !== 'superadmin') {
      setError('Access denied. Only superadmins can view activity logs.');
      setLoading(false);
      return;
    }

    fetchLogs();

    const socket = io('http://localhost:5000');
    socket.on('new_log', (newLog) => {
      if (newLog && typeof newLog === 'object') {
        // Add the new log to the top of the list
        setLogs(prevLogs => [newLog, ...prevLogs]);
        // Show a notification
        toast.info(`New log: ${newLog.action?.replace(/_/g, ' ') || 'Update'}`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Run only once on component mount

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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
          })
        : "—";
    } catch (err) {
      return "—";
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'approve_appointment': return '✅';
      case 'reschedule_appointment': return '📅';
      case 'complete_consultation': return '🩺';
      case 'dispense_medicine': return '💊';
      case 'update_user_role': return '👤';
      case 'delete_appointment': return '🗑️';
      default: return '📝';
    }
  };

  // Apply filters
  const filteredLogs = logs.filter(log => {
    if (adminFilter) {
      const q = adminFilter.toLowerCase();
      const adminName = (log.adminId?.firstName || '') + ' ' + (log.adminId?.lastName || '');
      const actorName = (log.details?.userName || log.details?.patientName || log.details?.actorName || '').toString();
      const combined = `${adminName} ${actorName}`.trim();
      if (!combined.toLowerCase().includes(q)) return false;
    }

    if (actionFilter && log.action !== actionFilter) return false;

    if (startDateFilter) {
      const start = new Date(startDateFilter);
      const logDate = new Date(log.timestamp);
      if (logDate < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
    }

    if (endDateFilter) {
      const end = new Date(endDateFilter);
      const logDate = new Date(log.timestamp);
      if (logDate > new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <SuperadminLayout>
        <p className="loading-text">Loading activity logs...</p>
      </SuperadminLayout>
    );
  }

  if (error) {
    return (
      <SuperadminLayout>
        <div className="error-text" style={{ color: '#dc3545', padding: '20px' }}>
          <h3>⚠️ Access Denied</h3>
          <p>{error}</p>
        </div>
      </SuperadminLayout>
    );
  }

  return (
    <SuperadminLayout>
      <div className="reports-container">
        <h1 className="reports-title">📋 Activity Logs</h1>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-row">
            <div className="filter-group">
              <label>Admin Name:</label>
              <input
                type="text"
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                placeholder="Search by admin name..."
              />
            </div>
            <div className="filter-group">
              <label>Action:</label>
                      <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                        <option value="">All Actions</option>
                        <option value="approve_appointment">Approve Appointment</option>
                        <option value="reschedule_appointment">Reschedule Appointment</option>
                        <option value="complete_consultation">Complete Consultation</option>
                        <option value="dispense_medicine">Dispense Medicine</option>
                        <option value="update_user_role">Update User Role</option>
                        <option value="delete_appointment">Delete Appointment</option>
                        <option value="user_login">User Login</option>
                        <option value="user_signup">User Signup</option>
                        <option value="Submitted feedback">Submitted Feedback</option>
                        <option value="submit_feedback">Submit Feedback</option>
                        <option value="create_feedback">Create Feedback</option>
                      </select>
            </div>
            <div className="filter-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>End Date:</label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="logs-table-container">
          {filteredLogs.length === 0 ? (
            <p className="no-data">No activity logs found matching the filters.</p>
          ) : (
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Admin</th>
                  <th>Entity</th>
                  <th>Timestamp</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id} className={expandedId === log._id ? 'expanded' : ''}>
                    <td className="action-cell">
                      <span className="action-icon">{getActionIcon(log.action)}</span>
                      <span className="action-text">{log.action.replace('_', ' ').toUpperCase()}</span>
                    </td>
                    <td>
                      { (log.adminId?.firstName || log.details?.userName || log.details?.patientName || log.details?.actorName)
                        ? `${log.adminId?.firstName || log.details?.userName || log.details?.patientName || log.details?.actorName} ${log.adminId?.lastName || ''}`.trim()
                        : 'System'
                      }
                    </td>
                    <td>{log.entityType}</td>
                    <td>{formatDateTime(log.timestamp)}</td>
                    <td>
                      <button
                        className="details-toggle"
                        onClick={() => toggleExpand(log._id)}
                      >
                        {expandedId === log._id ? 'Hide' : 'Show'} Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Expanded Details Modal */}
          {expandedId && (
            <div className="modal-overlay" onClick={() => setExpandedId(null)}>
              <div className="modal-content logs-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={() => setExpandedId(null)}>✖</button>
                {(() => {
                  const log = filteredLogs.find(l => l._id === expandedId);
                  if (!log) return null;
                  return (
                    <div className="details-content">
                      <h4>📋 Activity Details</h4>
                      <div className="details-grid">
                        <p><strong>Admin:</strong> {log.adminId?.firstName} {log.adminId?.lastName}</p>
                        <p><strong>Action:</strong> {log.action.replace('_', ' ')}</p>
                        <p><strong>Entity:</strong> {log.entityType}</p>
                        <p><strong>Entity ID:</strong> {log.entityId}</p>
                        <p><strong>Timestamp:</strong> {formatDateTime(log.timestamp)}</p>

                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="details-section">
                            <h5>Details:</h5>
                            <pre className="details-json">{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </SuperadminLayout>
  );
}
