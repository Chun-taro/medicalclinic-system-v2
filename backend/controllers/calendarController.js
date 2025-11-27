const { google } = require('googleapis');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');

// Fetch upcoming events
const getEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ error: 'No Google tokens stored' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
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
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
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

// Create event from notification
const createEventFromNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ error: 'No Google tokens stored' });
    }

    const notification = await Notification.findById(notificationId).populate('appointmentId');
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!notification.appointmentId) {
      return res.status(400).json({ error: 'Notification not linked to an appointment' });
    }

    const appointment = notification.appointmentId;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Combine appointmentDate and time
    const dateStr = appointment.appointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const startDateTime = new Date(`${dateStr}T${appointment.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (30 * 60 * 1000)); // 30 min default

    const event = {
      summary: `Appointment Notification: ${notification.status}`,
      description: notification.message,
      start: { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Manila' },
      end: { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Manila' },
      reminders: { useDefault: true }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    // Mark notification as read after syncing
    notification.read = true;
    await notification.save();

    res.json({ message: 'Event created from notification', event: response.data });
  } catch (err) {
    console.error('Sync notification to calendar error:', err.message);
    res.status(500).json({ error: 'Failed to sync notification to calendar' });
  }
};

module.exports = { getEvents, createEvent, createEventFromNotification };
