const express = require('express');
const router = express.Router();
const { sendResetToken, verifyResetToken, resetPassword } = require('../controllers/resetController');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Brute-force protection for password reset endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Increased slightly
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait 15 minutes before trying again.' },
  keyGenerator: (req, res) => {
    return ipKeyGenerator(req, res) + '_' + (req.body?.email || '');
  }
});

//  Send reset token to email
router.post('/send-token', authLimiter, sendResetToken);

// Verify token
router.post('/verify-token', authLimiter, verifyResetToken);

//  Reset password
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;