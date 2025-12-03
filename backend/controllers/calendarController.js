const { google } = require('googleapis');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');

// Helper function to create OAuth2 client with automatic token refresh
const createOAuth2Client = async (user) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  // Automatically refresh token if expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      // Refresh token was updated
      await User.findByIdAndUpdate(user._id, {
        googleRefreshToken: tokens.refresh_token,
      });
    }
    if (tokens.access_token) {
      // Access token was refreshed
      await User.findByIdAndUpdate(user._id, {
        googleAccessToken: tokens.access_token,
      });
    }
  });

  return oauth2Client;
};

// Sync approved appointments to Google Calendar
const syncApprovedAppointments = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.googleAccessToken) {
      console.log('No Google tokens for user, skipping calendar sync');
      return;
    }

    const appointments = await Appointment.find({
      patientId: userId,
      status: 'approved',
      googleCalendarEventId: { $exists: false } // Only sync appointments not already in calendar
    });

    if (appointments.length === 0) {
      console.log('No new appointments to sync');
      return;
    }

    const oauth2Client = await createOAuth2Client(user);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    for (const appointment of appointments) {
      try {
        // Create event data
        const dateStr = appointment.appointmentDate.toISOString().split('T')[0];
        const startDateTime = new Date(`${dateStr}T${appointment.time || '09:00'}:00`);
        const endDateTime = new Date(startDateTime.getTime() + (30 * 60 * 1000)); // 30 min default

        const event = {
          summary: `Medical Appointment - ${appointment.purpose || 'Consultation'}`,
          description: `Appointment at Medical Clinic\nPurpose: ${appointment.purpose || 'N/A'}\nReason: ${appointment.reasonForVisit || 'N/A'}`,
          start: { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Manila' },
          end: { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Manila' },
          reminders: { useDefault: true }
        };

        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: event,
        });

        // Store the Google Calendar event ID
        appointment.googleCalendarEventId = response.data.id;
        await appointment.save();

        console.log(`Synced appointment ${appointment._id} to Google Calendar`);
      } catch (err) {
        console.error(`Failed to sync appointment ${appointment._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error syncing appointments to calendar:', err.message);
  }
};

// Fetch upcoming events
const getEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ error: 'No Google tokens stored' });
    }

    // Sync approved appointments to Google Calendar before fetching events
    await syncApprovedAppointments(req.user.userId);

    const oauth2Client = await createOAuth2Client(user);
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

    const oauth2Client = await createOAuth2Client(user);
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
