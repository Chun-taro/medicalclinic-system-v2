const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

//  GET profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      console.warn(` User not found: ${req.user.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(' Get profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

//  UPDATE profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      console.warn(` Failed to update profile: ${req.user.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error(' Update profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

//  UPLOAD avatar to Cloudinary
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'avatars' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      bufferStream.pipe(uploadStream);
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { avatar: cloudinaryResult.secure_url },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      console.warn(` Failed to update avatar: ${req.user.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: cloudinaryResult.secure_url,
      user: updatedUser
    });
  } catch (err) {
    console.error(' Cloudinary upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar
};