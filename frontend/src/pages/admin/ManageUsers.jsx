import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './Style/ManageUsers.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('admin');
  const [nameSearch, setNameSearch] = useState('');
  const [idSearch, setIdSearch] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);

        // Also fetch current user info to get their role
        const userRes = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUserRole(userRes.data.role);
      } catch (err) {
        console.error('Error fetching users:', err.response?.data || err.message);
        setError(err.response?.data?.error || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    // Check if trying to change to superadmin and current user is not superadmin
    if (newRole === 'superadmin' && currentUserRole !== 'superadmin') {
      setShowPopup(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(prev =>
        prev.map(user => (user._id === id ? { ...user, role: newRole } : user))
      );
    } catch (err) {
      console.error('Error updating role:', err.message);
      // Provide user-friendly error message without technical details
      // Check if server error message contains technical details and filter them out
      const serverError = err.response?.data?.error;
      let errorMessage = 'Unable to update user role. Please check your connection and try again.';

      if (serverError && !serverError.includes('localhost') && !serverError.includes('5000') && !serverError.includes('http')) {
        errorMessage = serverError;
      }

      alert(errorMessage);
    }
  };

  const renderTable = role => {
    const filtered = users.filter(user => {
      const matchesRole = role === 'admin' ? user.role !== 'patient' : user.role === role;
      const matchesName = nameSearch === '' || (user.name || `${user.firstName} ${user.lastName}`).toLowerCase().includes(nameSearch.toLowerCase());
      const matchesId = idSearch === '' || (user.idNumber && user.idNumber.toString().toLowerCase().includes(idSearch.toLowerCase()));
      return matchesRole && matchesName && matchesId;
    });
    return filtered.length === 0 ? (
      <p>No {role === 'admin' ? 'staff' : role}s found.</p>
    ) : (
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>ID Number</th>
            <th>Role</th>
            <th>Change Role</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(user => (
            <tr key={user._id}>
              <td>{user.name || `${user.firstName} ${user.lastName}`}</td>
              <td>{user.email}</td>
              <td>{user.idNumber}</td>
              <td>
                <span
                  className={`role-badge ${
                    user.role === 'admin' ? 'role-admin' : 'role-patient'
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </td>
              <td>
                <select
                  value={user.role}
                  onChange={e => handleRoleChange(user._id, e.target.value)}
                >
                  <option value="patient">patient</option>
                  <option value="admin">admin</option>
                  <option value="doctor">doctor</option>
                  <option value="nurse">nurse</option>
                  <option value="superadmin">superadmin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <AdminLayout>
      <h2>Manage Users</h2>
      <p>View, edit, or change user roles.</p>

      {/* Search Filters */}
      <div className="search-filters">
        <input
          type="text"
          placeholder="Search by name..."
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by ID number..."
          value={idSearch}
          onChange={(e) => setIdSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          {/* Tab Buttons */}
          <div className="tabs">
            <button
              className={activeTab === 'admin' ? 'active' : ''}
              onClick={() => setActiveTab('admin')}
            >
              Admins
            </button>
            <button
              className={activeTab === 'patient' ? 'active' : ''}
              onClick={() => setActiveTab('patient')}
            >
              Patients
            </button>
          </div>

          {/*  Tab Content */}
          <div className="tab-content">
            {activeTab === 'admin' && renderTable('admin')}
            {activeTab === 'patient' && renderTable('patient')}
            {activeTab === 'doctor' && renderTable('doctor')}
            {activeTab === 'nurse' && renderTable('nurse')}
            {activeTab === 'superadmin' && renderTable('superadmin')}
          </div>
        </>
      )}

      {/* Custom Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <div className="popup-icon">🔒</div>
              <h3>Super Admin Access Required</h3>
            </div>
            <div className="popup-body">
              <p>You need Super Admin privileges to modify user roles.</p>
              <p>Please contact your Super Administrator for assistance.</p>
            </div>
            <div className="popup-footer">
              <button className="popup-btn-primary" onClick={() => setShowPopup(false)}>Understood</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}