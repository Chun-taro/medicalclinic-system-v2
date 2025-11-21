const User = require('../models/User');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');

// Local signup
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'patient'
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: 'Signup successful', token, userId: newUser._id, role: newUser.role });
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

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
      emergencyContact, bloodType, allergies, medicalHistory, currentMedications, familyHistory
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/google-calendar-success?userId=${userId}`);
  } catch (err) {
    console.error('Google Calendar OAuth error:', err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/google-calendar-failure?error=${encodeURIComponent(err.message)}`);
  }
};

module.exports = {
  signup,
  superadminLogin,
  login,
  validateToken,
  googleSignup,
  googleCalendarCallback
};
