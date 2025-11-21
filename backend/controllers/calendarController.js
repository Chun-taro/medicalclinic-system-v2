const { google } = require('googleapis');
const User = require('../models/User');

// Fetch upcoming events
const getEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ error: 'No Google tokens stored' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(events.data.items);
  } catch (err) {
    console.error('Calendar API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};

// Create a new event
const createEvent = async (req, res) => {
  try {
    const { summary, description, start, end } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ error: 'No Google tokens stored' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary,
      description,
      start: { dateTime: new Date(start).toISOString(), timeZone: 'Asia/Manila' },
      end:   { dateTime: new Date(end).toISOString(), timeZone: 'Asia/Manila' },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    res.json({ message: 'Event created', event: response.data });
  } catch (err) {
    console.error('Calendar API error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

module.exports = { getEvents, createEvent };