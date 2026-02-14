import React, { useEffect, useState } from 'react';
import axios from 'axios';

import './Style/AdminProfile.css';
import { FaCamera, FaEdit } from 'react-icons/fa';
import SuperadminLayout from './SuperadminLayout';


export default function SuperadminProfile() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
  });
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmin(res.data);
        setFormData({
          firstName: res.data.firstName || '',
          middleName: res.data.middleName || '',
          lastName: res.data.lastName || '',
        });
      } catch (err) {
        console.error('Error fetching admin profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);

  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('token');
    const res = await axios.post('http://localhost:5000/api/profile/avatar', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.status === 200) {
      setAdmin((prev) => ({ ...prev, avatar: res.data.avatar }));
    }
  } catch (err) {
    console.error(' Avatar upload failed:', err);
  } finally {
    setUploading(false);
  }
};

  const openEditModal = () => {
    if (!admin) return;
    setFormData({
      firstName: admin.firstName || '',
      middleName: admin.middleName || '',
      lastName: admin.lastName || '',
    });
    setUpdateError('');
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/profile', formData, { headers: { Authorization: `Bearer ${token}` } });
      setAdmin(res.data.user);
      setShowEditModal(false);
    } catch (err) {
      setUpdateError(err.response?.data?.error || 'Failed to update profile.');
    }
  };

  if (loading) {
    return (
      <SuperadminLayout>
        <p className="loading-text">Loading profile...</p>
      </SuperadminLayout>
    );
  }

  if (!admin) {
    return (
      <SuperadminLayout>
        <p className="error-text">Unable to load admin profile.</p>
      </SuperadminLayout>
    );
  }

  return (
    <SuperadminLayout>
      <div className="admin-profile-container">
        <h2 className="dashboard-heading">My Profile</h2>
        <div className="profile-card">
          <div className="profile-avatar-container">
            <img
              src={admin.avatar || '/avatar.png'}
              alt="Profile"
              className="profile-avatar"
            />
            <label className="avatar-upload-icon">
              <FaCamera />
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
            </label>
            {uploading && <p className="uploading-text">Uploading...</p>}
          </div>
          <div className="profile-details">
            <p><strong>Name:</strong> {admin.firstName} {admin.middleName || ''} {admin.lastName}</p>
            <p><strong>Email:</strong> {admin.email}</p>
            <p><strong>Role:</strong> <span className="role-badge">{admin.role}</span></p>
            <button className="edit-profile-btn" onClick={openEditModal}>
              <FaEdit /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content appointment-modal">
            <form onSubmit={handleProfileUpdate}>
              <div className="modal-header">
                <h3>Edit Profile</h3>
              </div>
              <div className="modal-body">
                <label>First Name:</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  required
                />
                <label>Middle Name:</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleFormChange}
                />
                <label>Last Name:</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  required
                />
                {updateError && <p className="error-text">{updateError}</p>}
              </div>
              <div className="modal-footer">
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SuperadminLayout>
  );
}