import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { User, Mail, Shield, Camera, Edit2, Save, X } from 'lucide-react';
import { getImageUrl } from '../../services/api';
import './Profile.css';

const Profile = () => {
    const { user, login } = useAuth(); // login used to update context if needed
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Edit form state
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get('/profile');
            const data = res.data;
            setProfile(data);
            setFormData({
                firstName: data.firstName || '',
                middleName: data.middleName || '',
                lastName: data.lastName || ''
            });
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.put('/profile', formData);
            setProfile(res.data.user || res.data);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (err) {
            console.error('Update error:', err);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('avatar', file);

        try {
            const res = await api.post('/users/profile/avatar', uploadData, { // Or /profile/avatar
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile(prev => ({ ...prev, avatar: res.data.avatar }));
            toast.success('Avatar updated');
        } catch (err) {
            try {
                const res2 = await api.post('/profile/avatar', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setProfile(prev => ({ ...prev, avatar: res2.data.avatar }));
                toast.success('Avatar updated');
            } catch (e) {
                toast.error('Failed to upload avatar');
            }
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
    if (!profile) return <div className="error-message">Profile not found.</div>;

    return (
        <div className="profile-page">
            <div className="profile-header-card">
                <div className="avatar-section">
                    <div className="avatar-container">
                        {profile.avatar ? (
                            <img src={getImageUrl(profile.avatar)} alt="Profile" className="profile-avatar" />
                        ) : (
                            <div className="avatar-placeholder">{profile.firstName?.[0]}</div>
                        )}
                        <label className="camera-btn">
                            <Camera size={16} />
                            <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>
                <div className="info-section">
                    <h1>{profile.firstName} {profile.lastName}</h1>
                    <span className="role-badge">{profile.role}</span>
                    <p className="email"><Mail size={16} /> {profile.email}</p>
                </div>
            </div>

            <div className="profile-details-card">
                <div className="card-header">
                    <h2>Personal Information</h2>
                    {!isEditing && (
                        <button className="btn-secondary" onClick={() => setIsEditing(true)}>
                            <Edit2 size={16} /> Edit
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleUpdate} className="edit-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Middle Name</label>
                                <input
                                    value={formData.middleName}
                                    onChange={e => setFormData({ ...formData, middleName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                                <X size={16} /> Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={isSaving}>
                                {isSaving ? (
                                    <span className="button-spinner small"></span>
                                ) : (
                                    <><Save size={16} /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Full Name</label>
                            <p>{profile.firstName} {profile.middleName} {profile.lastName}</p>
                        </div>
                        <div className="info-item">
                            <label>Email Address</label>
                            <p>{profile.email}</p>
                        </div>
                        <div className="info-item">
                            <label>Account Role</label>
                            <div className="role-display"><Shield size={16} /> {profile.role}</div>
                        </div>
                        <div className="info-item">
                            <label>Member Since</label>
                            <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
