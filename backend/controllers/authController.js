const User = require('../models/User');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const logActivity = require('../utils/logActivity');
const crypto = require('crypto');
const sendEmail = require('../utils/mailer');

// Local signup
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, idNumber, contactNumber } = req.body;

    if (!firstName || !lastName || !email || !password || !idNumber || !contactNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      idNumber,
      contactNumber,
      role: 'patient',
      isVerified: true, // Auto-verify due to Render email limitations
      verificationToken
    });

    await newUser.save();

    // Send Verification Email (Best Effort)
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

    try {
      await sendEmail({
        to: newUser.email,
        subject: 'Welcome to Buksu Medical Clinic',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #3b82f6;">Welcome to Buksu Medical Clinic!</h2>
            <p>Hi ${newUser.firstName},</p>
            <p>Thank you for registering. Your account is active and you can now log in.</p>
            <p style="font-size: 0.8rem; color: #999;">Note: Email verification is currently disabled.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.warn('Email sending failed (likely due to Render restrictions), but signup proceeded:', emailError.message);
    }

    // Log the user signup
    await logActivity(
      newUser._id,
      `${newUser.firstName} ${newUser.lastName}`,
      'patient',
      'user_signup_pending',
      'auth',
      newUser._id,
      { email: newUser.email }
    );

    res.json({ message: 'Signup successful! You can now log in.' });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Signup failed' });
  }
};

// Superadmin login (for existing superadmin users)
const superadminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Superadmin only.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Log superadmin login
    await logActivity(
      user._id,
      `${user.firstName} ${user.lastName}`,
      'superadmin',
      'user_login',
      'auth',
      user._id,
      { email: user.email, role: 'superadmin' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Superadmin login successful', token, userId: user._id, role: user.role });
  } catch (err) {
    console.error('Superadmin login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Local login
const login = async (req, res) => {
  try {
    // Log incoming login attempt for debugging (remove in production)
    console.log('Login attempt body:', req.body);
    const { email, password } = req.body;

    // Validate input and provide clearer error messages
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Check if email is verified
    if (!user.isVerified && user.password) { // Google users don't have password and are verified
      return res.status(401).json({
        error: 'Your account is not verified. Please check your email for the verification link.',
        unverified: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Log successful login
    await logActivity(
      user._id,
      `${user.firstName} ${user.lastName}`,
      user.role,
      'user_login',
      'auth',
      user._id,
      { email: user.email }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Login successful', token, userId: user._id, role: user.role });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Token validation
const validateToken = async (req, res) => {
  res.json({ valid: true });
};

// Google signup
const googleSignup = async (req, res) => {
  try {
    const {
      googleId, firstName, lastName, middleName, email, password, role,
      idNumber, sex, civilStatus, birthday, age, homeAddress, contactNumber,
      emergencyContact, bloodType, allergies, medicalHistory, currentMedications,
      familyHistory, recaptchaToken
    } = req.body;

    // Verify reCAPTCHA
    const recaptchaRes = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET,
          response: recaptchaToken
        }
      }
    );

    if (!recaptchaRes.data.success) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      googleId, firstName, lastName, middleName, email, password: hashedPassword, role,
      idNumber, sex, civilStatus, birthday, age, homeAddress, contactNumber,
      emergencyContact, bloodType, allergies, medicalHistory, currentMedications, familyHistory,
      isVerified: true // Google users are pre-verified
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set cookie for browser access (e.g. diagnostic endpoints)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site if needed, or 'lax' for standard nav
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({
      message: 'Signup successful',
      token,
      userId: newUser._id,
      role: newUser.role,
      googleId: newUser.googleId
    });
  } catch (err) {
    console.error('Google signup error:', err.message);
    res.status(500).json({ error: 'Signup failed' });
  }
};

// Google Calendar OAuth Callback
const googleCalendarCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state; // state should contain the user ID from redirect

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or userId' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Update user with access and refresh tokens
    await User.findByIdAndUpdate(userId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token || tokens.access_token // Fallback if no refresh token
    });

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/google-calendar-success?userId=${userId}`);
  } catch (err) {
    console.error('Google Calendar OAuth error:', err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/google-calendar-failure?error=${encodeURIComponent(err.message)}`);
  }
};

// Exchange short-lived cookie for JWT (secure OAuth flow)
const oauthTokenExchange = async (req, res) => {
  const token = req.cookies.oauthToken;
  if (!token) {
    return res.status(401).json({ error: 'OAuth exchange failed: Token missing or expired' });
  }

  // Clear the exchange cookie
  res.clearCookie('oauthToken');

  res.json({ token });
};

// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is missing' });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Log verification
    await logActivity(
      user._id,
      `${user.firstName} ${user.lastName}`,
      user.role,
      'email_verified',
      'auth',
      user._id,
      { email: user.email }
    );

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Email verification error:', err.message);
    res.status(500).json({ error: 'Email verification failed' });
  }
};

module.exports = {
  signup,
  superadminLogin,
  login,
  validateToken,
  googleSignup,
  googleCalendarCallback,
  oauthTokenExchange,
  verifyEmail
};
