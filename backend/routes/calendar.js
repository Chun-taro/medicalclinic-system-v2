const express = require('express');
const { google } = require('googleapis');
const { auth } = require('../middleware/auth');
const { getEvents, createEvent } = require('../controllers/calendarController');
const { googleCalendarCallback } = require('../controllers/authController');

const router = express.Router();

// GET upcoming events
router.get('/events', auth, getEvents);

// POST create new event
router.post('/events', auth, createEvent);

// GET Google Calendar OAuth URL
router.get('/oauth/url', auth, (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: req.user.userId // Pass user ID as state for callback
    });

    res.json({ authUrl });
  } catch (err) {
    console.error('OAuth URL generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
});

// GET OAuth callback
router.get('/oauth/callback', googleCalendarCallback);

module.exports = router;