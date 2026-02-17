const express = require('express');
const router = express.Router();
const User = require('../models/User');

const {
  signup,
  superadminSignup,
  superadminLogin,
  login,
  googleSignup,
  validateToken,
  oauthTokenExchange,
  verifyEmail
} = require('../controllers/authController');

const { auth } = require('../middleware/auth');
const passport = require('passport');
const jwt = require('jsonwebtoken');

//  Local Authentication
router.post('/signup', signup);
router.post('/superadmin-login', superadminLogin);
router.post('/login', login);
router.post('/google-signup', googleSignup);
router.get('/verify-email/:token', verifyEmail);

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  res.json({ message: 'If your email is registered, a reset link has been sent.' });
});

//  Token Validation


router.get('/validate', auth, validateToken);
router.post('/oauth-token-exchange', oauthTokenExchange);

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
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', async (err, user) => {
    if (err) return next(err);

    if (user?.isNewUser) {
      const { googleId, email, firstName, lastName } = user;
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      return res.redirect(
        `${frontendUrl}/oauth/google-signup?googleId=${googleId}&email=${email}&firstName=${firstName}&lastName=${lastName}`
      );
    }

    req.logIn(user, async (err) => {
      if (err) {
        console.error('Login error after passport auth:', err);
        return next(err);
      }

      try {
        const token = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        // Determine frontend URL more robustly
        let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        frontendUrl = frontendUrl.replace(/\/$/, '');

        console.log(`Redirecting user ${user.email} with role ${user.role} to ${frontendUrl}`);

        // Set short-lived secure cookie for token exchange
        res.cookie('oauthToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 5 * 60 * 1000 // 5 minutes
        });

        const redirectUrl = new URL(`${frontendUrl}/oauth/success`);
        redirectUrl.searchParams.set('role', user.role || 'patient');
        redirectUrl.searchParams.set('userId', user._id.toString());

        if (user.googleId) {
          redirectUrl.searchParams.set('googleId', user.googleId);
        }

        return res.redirect(redirectUrl.toString());
      } catch (tokenErr) {
        console.error('Token generation or redirect error:', tokenErr.message);
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        return res.redirect(`${frontendUrl}/oauth/failure?error=token_generation_failed`);
      }
    });
  })(req, res, next);
});

module.exports = router;