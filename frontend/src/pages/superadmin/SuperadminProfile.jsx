import React, { useEffect, useState } from 'react';
import axios from 'axios';

import './Style/AdminProfile.css';
import { FaCamera } from 'react-icons/fa';
import SuperadminLayout from './SuperadminLayout';


export default function AdminProfile() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmin(res.data);
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
      <div className="fb-profile-container">
        <div className="fb-header-bar">
          <div className="fb-avatar-wrap">
            <img
              src={admin.avatar || '/avatar.png'}
              alt="Profile"
              className="fb-avatar"
            />
            <label className="fb-avatar-icon">
              <FaCamera />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                hidden
              />
            </label>
            {uploading && <p className="uploading-text">Uploading...</p>}
          </div>

          <div className="fb-header-info">
            <h1 className="fb-name">
              {admin.firstName}{' '}
              {admin.middleName ? `${admin.middleName} ` : ''}
              {admin.lastName}
            </h1>
            <p className="fb-subtitle">{admin.email}</p>
            
          </div>
        </div>
      </div>
    </SuperadminLayout>
  );
}