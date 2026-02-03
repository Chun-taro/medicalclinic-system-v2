import { useEffect, useState } from 'react';
import axios from 'axios';
import SuperadminLayout from './SuperadminLayout';
import './Style/ManageUsers.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ title: '', icon: '', messages: [] });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({ userId: null, newRole: '', userName: '', oldRole: '' });
  const [pendingChange, setPendingChange] = useState(null); // { userId, newRole }

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

  const handleRoleChange = (id, newRole) => {
    const userToChange = users.find(u => u._id === id);
    if (!userToChange || userToChange.role === newRole) {
      return;
    }

    if (newRole === 'superadmin' && currentUserRole !== 'superadmin') {
      setPopupData({
        title: 'Access Denied',
        icon: '🔒',
        messages: ['Only a Superadmin can assign others to be Superadmin.']
      });
      setShowPopup(true);
      return;
    }

    setPendingChange({ userId: id, newRole });
    setConfirmModalData({
      userId: id,
      newRole: newRole,
      userName: userToChange.name || `${userToChange.firstName} ${userToChange.lastName}`,
      oldRole: userToChange.role
    });
    setShowConfirmModal(true);
  };

  const executeRoleChange = async () => {
    const { userId, newRole } = confirmModalData;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(prev =>
        prev.map(user => (user._id === userId ? { ...user, role: newRole } : user))
      );
    } catch (err) {
      console.error('Error updating role:', err.message);
      const serverError = err.response?.data?.error;
      let errorMessage = 'Unable to update user role. Please check your connection and try again.';

      if (serverError && !serverError.includes('localhost') && !serverError.includes('5000') && !serverError.includes('http')) {
        errorMessage = serverError;
      }
      setPopupData({
        title: 'Update Failed',
        icon: '❌',
        messages: [errorMessage]
      });
      setShowPopup(true);
    } finally {
      setShowConfirmModal(false);
      setPendingChange(null);
    }
  };

  const renderTable = role => {
    const filtered = users.filter(user => {
      const matchesRole = user.role === role;
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = (user.name || `${user.firstName} ${user.lastName}`).toLowerCase();
        const email = user.email.toLowerCase();
        const idNumber = (user.idNumber && user.idNumber.toString().toLowerCase()) || '';
        const userRole = user.role.toLowerCase();
        if (!fullName.includes(q) && !email.includes(q) && !idNumber.includes(q) && !userRole.includes(q)) return false;
      }
      return matchesRole;
    });
    return filtered.length === 0 ? (
      <p>No {role}s found.</p>
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
                  className={`role-badge role-${user.role}`}
                  // Dynamically apply a class based on the user's role
                  // e.g., 'role-patient', 'role-admin', 'role-doctor', 'role-nurse', 'role-superadmin'
                  // The CSS for these classes will define their respective colors.

                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </td>
              <td>
                <select
                  value={pendingChange?.userId === user._id ? pendingChange.newRole : user.role}
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
    <SuperadminLayout>
      <h2>Manage Users</h2>
      <p>View, edit, or change user roles.</p>

      {/* Search Filters */}
      <div className="search-filters">
        <input
          type="text"
          placeholder="Search by name, email, ID number, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
            {['admin', 'doctor', 'nurse', 'superadmin', 'patient'].map(tab => (
              <button
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {/* Capitalize first letter and add 's' for plural */}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}s
              </button>
            ))}
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

      {/* Role Change Confirmation Modal */}
      {showConfirmModal && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <div className="popup-icon">🔄</div>
              <h3>Confirm Role Change</h3>
            </div>
            <div className="popup-body">
              <p>
                Are you sure you want to change the role of <strong>{confirmModalData.userName}</strong> from{' '}
                <strong>{confirmModalData.oldRole}</strong> to <strong>{confirmModalData.newRole}</strong>?
              </p>
            </div>
            <div className="popup-footer">
              <button className="popup-btn-secondary" onClick={() => {
                setShowConfirmModal(false);
                setPendingChange(null);
              }}>
                Cancel
              </button>
              <button className="popup-btn-primary" onClick={executeRoleChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <div className="popup-icon">{popupData.icon}</div>
              <h3>{popupData.title}</h3>
            </div>
            <div className="popup-body">
              {popupData.messages.map((msg, index) => <p key={index}>{msg}</p>)}
            </div>
            <div className="popup-footer">
              <button className="popup-btn-primary" onClick={() => setShowPopup(false)}>Understood</button>
            </div>
          </div>
        </div>
      )}
    </SuperadminLayout>
  );
}