const express = require('express');
const multer = require('multer');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  uploadAvatar
} = require('../controllers/profileController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', auth, getProfile);
router.put('/', auth, updateProfile);
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

// Protected route
router.get('/profile', auth, (req, res) => {
  // Example payload — in real app, fetch from DB using req.user.userId
  res.json({
    userId: req.user.userId,
    role: req.user.role,
    firstName: 'Demo',
    middleName: '',
    lastName: 'User',
    avatar: '/images/avatar.png'
  });
});


module.exports = router;