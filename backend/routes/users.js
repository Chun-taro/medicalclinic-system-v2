const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

const {
  getAllUsers,
  updateUserRole,
  getRoleByGoogleId,
  getProfileById,
  getProfile,
  updateProfile,
  uploadAvatar,
  deactivateUser,
  reactivateUser,
  getUserLoginHistory
} = require('../controllers/userController');

// Admin/superadmin only routes
router.get('/', auth, requireRole('superadmin', 'admin'), getAllUsers);
router.put('/:id/role', auth, requireRole('superadmin', 'admin'), updateUserRole);
router.put('/:id/deactivate', auth, requireRole('superadmin', 'admin'), deactivateUser);
router.put('/:id/reactivate', auth, requireRole('superadmin', 'admin'), reactivateUser);
router.get('/:id/login-history', auth, requireRole('superadmin', 'admin'), getUserLoginHistory);

// Public/non-authenticated route for Google OAuth
router.get('/role-by-google/:googleId', getRoleByGoogleId);

// Authenticated user routes
router.get('/profile', auth, getProfile);
router.get('/profile/:id', auth, getProfileById);
router.put('/profile', auth, updateProfile);
router.post('/profile/avatar', auth, uploadAvatar);

module.exports = router;