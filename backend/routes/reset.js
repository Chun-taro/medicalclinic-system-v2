const express = require('express');
const router = express.Router();
const { sendResetToken, verifyResetToken, resetPassword } = require('../controllers/resetController');

//  Send reset token to email
router.post('/send-token', sendResetToken);

// Verify token
router.post('/verify-token', verifyResetToken);

//  Reset password
router.post('/reset-password', resetPassword);

module.exports = router;