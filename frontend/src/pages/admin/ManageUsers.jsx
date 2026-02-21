import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Search, UserCheck, UserX, Shield, Briefcase, Stethoscope, User } from 'lucide-react';
import './ManageUsers.css';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const { user: currentUser } = useAuth(); // To check if superadmin

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, activeTab, searchQuery]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let result = users;

        // Filter by tab
        if (activeTab !== 'all') {
            result = result.filter(u => u.role === activeTab);
        }

        // Filter by search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(u =>
                (u.firstName && u.firstName.toLowerCase().includes(q)) ||
                (u.lastName && u.lastName.toLowerCase().includes(q)) ||
                (u.email && u.email.toLowerCase().includes(q)) ||
                (u.idNumber && u.idNumber.toLowerCase().includes(q))
            );
        }

        setFilteredUsers(result);
    };

    const handleRoleChange = async (userId, newRole) => {
        if (newRole === 'superadmin' && currentUser.role !== 'superadmin') {
            toast.error('Only Super Admins can promote users to Super Admin.');
            return;
        }

        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
            toast.success('User role updated successfully');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Failed to update user role');
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'superadmin': return <Shield size={16} className="text-purple-600" />;
            case 'admin': return <Briefcase size={16} className="text-blue-600" />;
            case 'doctor': return <Stethoscope size={16} className="text-green-600" />;
            case 'nurse': return <UserCheck size={16} className="text-teal-600" />;
            default: return <User size={16} className="text-gray-600" />;
        }
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="manage-users-page">
            <div className="page-header">
                <h1>Manage Users</h1>
                <p>View and manage permissions for all system users.</p>
            </div>

            <div className="controls-container">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="tabs">
                    {['all', 'patient', 'doctor', 'nurse', 'admin', 'superadmin'].map(role => (
                        <button
                            key={role}
                            className={`tab-btn ${activeTab === role ? 'active' : ''}`}
                            onClick={() => setActiveTab(role)}
                        >
                            {role.charAt(0).toUpperCase() + role.slice(1)}s
                        </button>
                    ))}
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Email</th>
                            <th>ID Number</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="no-data">No users found.</td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user._id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar-sm">
                                                {user.profilePicture ? (
                                                    <img
                                                        src={getImageUrl(user.profilePicture)}
                                                        alt="Profile"
                                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    user.firstName ? user.firstName[0].toUpperCase() : 'U'
                                                )}
                                            </div>
                                            <div>
                                                <div className="user-name">{user.firstName} {user.lastName}</div>
                                                <div className="user-sub">{user.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="role-badge-container">
                                            {getRoleIcon(user.role)}
                                            <span className={`role-text role-${user.role}`}>{user.role}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.idNumber || '—'}</td>
                                    <td>
                                        <select
                                            className="role-select"
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                            disabled={user._id === currentUser.userId} // Prevent changing own role easily
                                        >
                                            <option value="patient">Patient</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="nurse">Nurse</option>
                                            <option value="admin">Admin</option>
                                            <option value="superadmin">Super Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageUsers;
