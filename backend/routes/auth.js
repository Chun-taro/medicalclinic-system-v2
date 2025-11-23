const express = require('express');
const router = express.Router();
const User = require('../models/User');

const {
  signup,
  superadminSignup,
  superadminLogin,
  login,
  googleSignup,
  validateToken
} = require('../controllers/authController');

const { auth } = require('../middleware/auth');
const passport = require('passport');
const jwt = require('jsonwebtoken');

//  Local Authentication
router.post('/signup', signup);
router.post('/superadmin-login', superadminLogin);
router.post('/login', login);
router.post('/google-signup', googleSignup);

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  res.json({ message: 'If your email is registered, a reset link has been sent.' });
});

//  Token Validation

router.get('/validate', auth, validateToken);

// Get current user info
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Google OAuth Flow


router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', async (err, user) => {
    if (err) return next(err);

    if (user?.isNewUser) {
      const { googleId, email, firstName, lastName } = user;
      return res.redirect(
        `http://localhost:3000/google-signup?googleId=${googleId}&email=${email}&firstName=${firstName}&lastName=${lastName}`
      );
    }

    req.logIn(user, async (err) => {
      if (err) return next(err);

      try {
        const token = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        const redirectUrl = new URL('http://localhost:3000/oauth-success');
        redirectUrl.searchParams.set('token', token);
        redirectUrl.searchParams.set('role', user.role);
        redirectUrl.searchParams.set('userId', user._id.toString());
        redirectUrl.searchParams.set('googleId', user.googleId);

        return res.redirect(redirectUrl.toString());
      } catch (tokenErr) {
        console.error('Token generation error:', tokenErr.message);
        return res.redirect('http://localhost:3000/oauth-failure');
      }
    });
  })(req, res, next);
});

module.exports = router;