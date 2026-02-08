const User = require('../models/User');
const logActivity = require('../utils/logActivity');
const { optimisticUpdate } = require('../utils/concurrencyControl');

// Get all users (admin or superadmin only)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'doctor' && req.user.role !== 'nurse') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Update user role (superadmin only)
const updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Superadmins only.' });
    }

    const { role } = req.body;
    const validRoles = ['patient', 'admin', 'doctor', 'nurse', 'superadmin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    // Get the user before updating to log the old role
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    const oldRole = existingUser.role;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    // Log the activity
    await logActivity(
      req.user.userId,
      `${req.user.firstName} ${req.user.lastName}`,
      req.user.role,
      'update_user_role',
      'user',
      req.params.id,
      {
        oldRole,
        newRole: role,
        userName: `${user.firstName} ${user.lastName}`
      }
    );

    res.json({ message: 'Role updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Get role by Google ID
const getRoleByGoogleId = async (req, res) => {
  try {
    const { googleId } = req.params;
    const user = await User.findOne({ googleId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

//  Get profile by user ID (admin or superadmin only)
const getProfileById = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Get profile of logged-in user
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Update profile of logged-in user
const updateProfile = async (req, res) => {
  try {
    const { version, ...updates } = req.body;

    const updatedUser = await optimisticUpdate(
      User,
      { _id: req.user.userId, version: version },
      { ...updates, $inc: { version: 1 } },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    // Log profile update
    await logActivity(
      req.user.userId,
      `${updatedUser.firstName} ${updatedUser.lastName}`,
      req.user.role,
      'update_user_profile',
      'user',
      req.user.userId,
      {
        fieldsUpdated: Object.keys(updates),
        updateTime: new Date()
      }
    );

    res.json({ message: 'Profile updated successfully', user: updatedUser, version: updatedUser.version });
  } catch (err) {
    if (err.message.includes('version conflict')) {
      return res.status(409).json({ error: 'Profile was modified by another process. Please refresh and try again.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    const imagePath = `/uploads/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(req.user.userId, { avatar: imagePath }, { new: true });

    // Log avatar upload
    await logActivity(
      req.user.userId,
      `${updatedUser.firstName} ${updatedUser.lastName}`,
      req.user.role,
      'upload_profile_picture',
      'user',
      req.user.userId,
      {
        fileName: req.file.filename,
        filePath: imagePath
      }
    );

    res.json({ message: 'Avatar updated', avatar: imagePath });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  getRoleByGoogleId,
  getProfileById,
  getProfile,
  updateProfile,
  uploadAvatar
};