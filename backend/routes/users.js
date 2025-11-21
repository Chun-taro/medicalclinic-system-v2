const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

const {
  getAllUsers,
  updateUserRole,
  getRoleByGoogleId,
  getProfileById,
  getProfile,
  updateProfile,
  uploadAvatar
} = require('../controllers/userController');

router.get('/', auth, getAllUsers);
router.put('/:id/role', auth, updateUserRole);
router.get('/role-by-google/:googleId', getRoleByGoogleId);
router.get('/profile', auth, getProfile);
router.get('/profile/:id', auth, getProfileById);
router.put('/profile', auth, updateProfile);
router.post('/profile/avatar', auth, uploadAvatar);

module.exports = router;