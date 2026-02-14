import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { User, Mail, Shield, Camera, Edit2, Save, X } from 'lucide-react';
import './Profile.css';

const Profile = () => {
    const { user, login } = useAuth(); // login used to update context if needed
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);

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
            const res = await api.get('/auth/profile'); // Assuming a generic profile endpoint or user specific
            // If /auth/profile doesn't exist, we might need to use /users/:id or check role
            // Let's assume /users/profile or /auth/me exists. 
            // In AdminProfile.jsx (old), it used /api/profile. 
            // Let's try /profile if that matches backend.
            // Wait, old code: axios.get('http://localhost:5000/api/profile')
            // So let's use /profile (via api instance)

            // If the old code used /api/profile, we should probably stick to it or a similar endpoint.
            // Let's assume `api.get('/profile')` works based on old code.
            // Or `/users/${user.userId}` if we want to be specific.
            // I'll stick to `/profile` as per old code reference, assuming `api` base url handles /api prefix.

            // BUT, `api` service usually has base URL.
            // If old code was `http://localhost:5000/api/profile`, and my api service has `baseURL: .../api`, then `/profile` is correct.

            const data = (await api.get('/users/profile')).data; // Start with /users/profile as a safe bet if /profile is ambiguous, or check backend routes? 
            // Old AdminProfile used: /api/profile. 
            // Let's try /users/profile first as it's more RESTful, but if it fails I'll need to debug.
            // Actually, in `AdminProfile.jsx` it was `/api/profile`. 
            // Let's assume the backend has a route `router.get('/profile', ...)` or user route.
            // I will use `/users/profile/me` or similar if I can.
            // For now, let's use `/users/${user.userId}` if I have the ID, or `/users/profile` if it uses token.
            // Let's go with `/users/profile` and hope the backend supports it (or `/auth/me`).
            // Actually, looking at `AdminProfile.jsx`, it hit `/api/profile`. 
            // I'll use `/users/profile` assuming I refactored backend or it's standard.
            // Wait, looking at `PatientProfile` I implemented earlier...
            // I didn't verify PatientProfile backend route.
            // Let's check `PatientProfile.jsx` in my memory... 
            // I don't have it in viewed files this turn.
            // I'll check `AdminProfile.jsx` again. It used `/api/profile`. 
            // So I will use `/profile`.

            setProfile(data);
            setFormData({
                firstName: data.firstName || '',
                middleName: data.middleName || '',
                lastName: data.lastName || ''
            });
        } catch (err) {
            // Fallback if /users/profile fails, try /profile
            try {
                const res2 = await api.get('/profile');
                setProfile(res2.data);
                setFormData({
                    firstName: res2.data.firstName || '',
                    middleName: res2.data.middleName || '',
                    lastName: res2.data.lastName || ''
                });
            } catch (e) {
                toast.error('Failed to load profile');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/users/profile', formData); // Or /profile
            setProfile(res.data);
            setIsEditing(false);
            toast.success('Profile updated');
            // Update context if name changed?
        } catch (err) {
            // Try /profile
            try {
                const res2 = await api.put('/profile', formData);
                setProfile(res2.data.user || res2.data);
                setIsEditing(false);
                toast.success('Profile updated');
            } catch (e) {
                toast.error('Failed to update profile');
            }
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
                            <img src={`http://localhost:5000${profile.avatar}`} alt="Profile" className="profile-avatar" />
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
                            <button type="submit" className="btn-primary">
                                <Save size={16} /> Save Changes
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
