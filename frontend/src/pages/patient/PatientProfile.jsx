import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { User, Phone, MapPin, Calendar, Heart, Activity, FileText, Edit2, Camera, Save, X } from 'lucide-react';
import './PatientProfile.css';
// import avatarPlaceholder from '../../assets/profile-placeholder.png'; // Removed unused missing asset

const PatientProfile = () => {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({});

    // Fetch profile
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            setProfile(res.data);
            setFormData(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('avatar', file);

        try {
            const res = await api.post('/profile/avatar', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setProfile(prev => ({ ...prev, avatar: res.data.avatar }));
            // setAuthUser(prev => ({ ...prev, avatar: res.data.avatar })); // Removed
            toast.success('Profile picture updated');
        } catch (err) {
            toast.error('Failed to upload image');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleArrayChange = (e, field) => {
        const value = e.target.value.split(',').map(item => item.trim());
        setFormData({ ...formData, [field]: value });
    };

    const handleCheckboxChange = (e, parent, child) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [child]: e.target.checked
            }
        }));
    };

    const saveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await api.put('/profile', formData);
            setProfile(res.data.user || res.data);
            setFormData(res.data.user || res.data);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (err) {
            console.error('Update error:', err);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="profile-page">
            <div className="profile-header-card">
                <div className="profile-cover"></div>
                <div className="profile-user-info">
                    <div className="avatar-wrapper">
                        <img
                            src={getImageUrl(profile.avatar) || 'https://via.placeholder.com/150'}
                            alt="Profile"
                            className="profile-avatar"
                        />
                        <label className="avatar-edit-btn">
                            <Camera size={16} />
                            <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                        </label>
                    </div>
                    <div className="user-text">
                        <h1>{profile.firstName} {profile.middleName} {profile.lastName}</h1>
                        <p>{profile.email} • {profile.role}</p>
                    </div>
                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                                    <X size={16} /> Cancel
                                </button>
                                <button className="btn-primary" onClick={saveProfile} disabled={isSaving}>
                                    {isSaving ? (
                                        <span className="button-spinner small"></span>
                                    ) : (
                                        <><Save size={16} /> Save Changes</>
                                    )}
                                </button>
                            </>
                        ) : (
                            <button className="btn-primary" onClick={() => setIsEditing(true)}>
                                <Edit2 size={16} /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="profile-content-grid">
                {/* Left Col: Personal Info */}
                <div className="profile-section">
                    <div className="section-header">
                        <h3><User size={20} /> Personal Information</h3>
                    </div>
                    <div className="section-body form-grid-2">
                        <div className="form-group">
                            <label>First Name</label>
                            {isEditing ? <input className="form-control" name="firstName" value={formData.firstName || ''} onChange={handleChange} /> : <p className="read-only">{profile.firstName}</p>}
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            {isEditing ? <input className="form-control" name="lastName" value={formData.lastName || ''} onChange={handleChange} /> : <p className="read-only">{profile.lastName}</p>}
                        </div>
                        <div className="form-group">
                            <label>Middle Name</label>
                            {isEditing ? <input className="form-control" name="middleName" value={formData.middleName || ''} onChange={handleChange} /> : <p className="read-only">{profile.middleName || '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>Birthday</label>
                            {isEditing ? <input type="date" className="form-control" name="birthday" value={formData.birthday?.slice(0, 10) || ''} onChange={handleChange} /> : <p className="read-only">{profile.birthday?.slice(0, 10) || '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>Sex</label>
                            {isEditing ? (
                                <select className="form-control" name="sex" value={formData.sex || ''} onChange={handleChange}>
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            ) : <p className="read-only">{profile.sex || '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>Civil Status</label>
                            {isEditing ? (
                                <select className="form-control" name="civilStatus" value={formData.civilStatus || ''} onChange={handleChange}>
                                    <option value="">Select</option>
                                    <option value="single">Single</option>
                                    <option value="married">Married</option>
                                    <option value="widowed">Widowed</option>
                                </select>
                            ) : <p className="read-only">{profile.civilStatus || '—'}</p>}
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="profile-section">
                    <div className="section-header">
                        <h3><Phone size={20} /> Contact Details</h3>
                    </div>
                    <div className="section-body form-grid-2">
                        <div className="form-group">
                            <label>Phone Number</label>
                            {isEditing ? <input className="form-control" name="contactNumber" value={formData.contactNumber || ''} onChange={handleChange} /> : <p className="read-only">{profile.contactNumber || '—'}</p>}
                        </div>
                        <div className="form-group full-width">
                            <label>Address</label>
                            {isEditing ? <input className="form-control" name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} /> : <p className="read-only">{profile.homeAddress || '—'}</p>}
                        </div>
                        <div className="divider full-width"></div>
                        <div className="form-group full-width">
                            <h4 className="sub-header">Emergency Contact</h4>
                        </div>
                        <div className="form-group">
                            <label>Name</label>
                            {isEditing ? <input className="form-control" name="emergencyContact.name" value={formData.emergencyContact?.name || ''} onChange={handleChange} /> : <p className="read-only">{profile.emergencyContact?.name || '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>Relationship</label>
                            {isEditing ? <input className="form-control" name="emergencyContact.relationship" value={formData.emergencyContact?.relationship || ''} onChange={handleChange} /> : <p className="read-only">{profile.emergencyContact?.relationship || '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            {isEditing ? <input className="form-control" name="emergencyContact.phone" value={formData.emergencyContact?.phone || ''} onChange={handleChange} /> : <p className="read-only">{profile.emergencyContact?.phone || '—'}</p>}
                        </div>
                    </div>
                </div>

                {/* Medical Info */}
                <div className="profile-section full-width-col">
                    <div className="section-header">
                        <h3><Activity size={20} /> Medical Information</h3>
                    </div>
                    <div className="section-body form-grid-2">
                        <div className="form-group">
                            <label>Blood Type</label>
                            {isEditing ? (
                                <select className="form-control" name="bloodType" value={formData.bloodType || ''} onChange={handleChange}>
                                    <option value="">Select</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                </select>
                            ) : <p className="read-only">{profile.bloodType || '—'}</p>}
                        </div>
                        <div className="form-group full-width">
                            <label>Allergies</label>
                            {isEditing ? <input className="form-control" name="allergies" value={formData.allergies?.join(', ') || ''} onChange={(e) => handleArrayChange(e, 'allergies')} placeholder="Comma separated" /> : <p className="read-only">{profile.allergies?.join(', ') || 'None'}</p>}
                        </div>
                        <div className="form-group full-width">
                            <label>Current Medications</label>
                            {isEditing ? <input className="form-control" name="currentMedications" value={formData.currentMedications?.join(', ') || ''} onChange={(e) => handleArrayChange(e, 'currentMedications')} placeholder="Comma separated" /> : <p className="read-only">{profile.currentMedications?.join(', ') || 'None'}</p>}
                        </div>
                        <div className="form-group full-width">
                            <label>Medical History</label>
                            {isEditing ? <input className="form-control" name="medicalHistory" value={formData.medicalHistory?.join(', ') || ''} onChange={(e) => handleArrayChange(e, 'medicalHistory')} placeholder="Comma separated" /> : <p className="read-only">{profile.medicalHistory?.join(', ') || 'None'}</p>}
                        </div>
                    </div>
                </div>

            </div>

            {/* Personal & Social History */}
            <div className="profile-section full-width-col">
                <div className="section-header">
                    <h3><Activity size={20} /> Personal & Social History</h3>
                </div>
                <div className="section-body form-grid-2">
                    {/* Smoker */}
                    <div className="form-group">
                        <label>Smoker?</label>
                        {isEditing ? (
                            <select className="form-control" name="personalSocialHistory.smoking" value={formData.personalSocialHistory?.smoking || 'no'} onChange={handleChange}>
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                            </select>
                        ) : <p className="read-only">{profile.personalSocialHistory?.smoking || 'no'}</p>}
                    </div>

                    {/* Smoking Sticks/Day (Only show if smoker) */}
                    {(formData.personalSocialHistory?.smoking === 'yes' || profile.personalSocialHistory?.smoking === 'yes') && (
                        <div className="form-group">
                            <label>Sticks per Day</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    className="form-control"
                                    name="personalSocialHistory.smokingSticks"
                                    value={formData.personalSocialHistory?.smokingSticks || 0}
                                    onChange={handleChange}
                                />
                            ) : <p className="read-only">{profile.personalSocialHistory?.smokingSticks || 0} sticks/day</p>}
                        </div>
                    )}

                    {/* Drinker */}
                    <div className="form-group">
                        <label>Alcohol Drinker?</label>
                        {isEditing ? (
                            <select className="form-control" name="personalSocialHistory.drinking" value={formData.personalSocialHistory?.drinking || 'no'} onChange={handleChange}>
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                            </select>
                        ) : <p className="read-only">{profile.personalSocialHistory?.drinking || 'no'}</p>}
                    </div>
                </div>
            </div>

            {/* Past Medical History */}
            <div className="profile-section full-width-col">
                <div className="section-header">
                    <h3><Activity size={20} /> Past Medical History</h3>
                </div>
                <div className="section-body">
                    <div className="checkbox-grid">
                        {['asthma', 'heartProblems', 'seizures', 'pneumonia', 'typhoid', 'tuberculosis', 'chickenpox', 'measles', 'germanMeasles'].map(condition => (
                            <label key={condition} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    disabled={!isEditing}
                                    checked={formData.pastMedicalHistory?.[condition] || false}
                                    onChange={(e) => handleCheckboxChange(e, 'pastMedicalHistory', condition)}
                                />
                                {condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Immunization */}
            <div className="profile-section full-width-col">
                <div className="section-header">
                    <h3><Activity size={20} /> Immunization History</h3>
                </div>
                <div className="section-body">
                    <div className="checkbox-grid">
                        {['BCG', 'HepatitisB', 'Polio', 'DPT', 'MMR', 'Chickenpox', 'AntiRabies', 'TetanusBooster'].map(vaccine => (
                            <label key={vaccine} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    disabled={!isEditing}
                                    checked={formData.immunization?.[vaccine] || false}
                                    onChange={(e) => handleCheckboxChange(e, 'immunization', vaccine)}
                                />
                                {vaccine.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Family History */}
            <div className="profile-section full-width-col">
                <div className="section-header">
                    <h3><Heart size={20} /> Family History</h3>
                </div>
                <div className="section-body">
                    <div className="checkbox-grid">
                        {['diabetes', 'hypertension', 'heartDisease', 'cancer', 'other'].map(condition => (
                            <label key={condition} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    disabled={!isEditing}
                                    checked={formData.familyHistory?.[condition] || false}
                                    onChange={(e) => handleCheckboxChange(e, 'familyHistory', condition)}
                                />
                                {condition.charAt(0).toUpperCase() + condition.slice(1).replace(/([A-Z])/g, ' $1')}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

        </div>

    );
};

export default PatientProfile;
