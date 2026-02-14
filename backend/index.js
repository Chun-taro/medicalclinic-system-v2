require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const requestLogger = require('./middleware/requestLogger');
const calendarRoutes = require('./routes/calendar');


// Route imports
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const profileRoutes = require('./routes/profile');
const userRoutes = require('./routes/users');
const resetRoutes = require('./routes/reset');
const medicineRoutes = require('./routes/medicines');
const notificationRoutes = require('./routes/notification');
const systemRoutes = require('./routes/system');
const weatherRoutes = require('./routes/weather');
const logsRoutes = require('./routes/logs');
const feedbackRoutes = require('./routes/feedback');


require('./passport');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// Make io globally available for notifications
global.io = io;

// Inject Socket.IO into every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(helmet()); // security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Static file serving
app.use('/uploads', express.static('uploads'));

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/feedback', feedbackRoutes);


// MongoDB connection
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error(' MONGO_URI is missing. Check your .env file.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

mongoose.connect(uri)
  .then(() => {
    console.log(' Connected to MongoDB Atlas');
    server.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error(' MongoDB connection error:', err.message);
    process.exit(1);
  });

mongoose.connection.on('error', err => {
  console.error(' MongoDB runtime error:', err.message);
});

mongoose.set('debug', process.env.NODE_ENV !== 'production');

// Google OAuth callback is handled in routes/auth.js

// Debug route
const { auth } = require('./middleware/auth');
const User = require('./models/User');

app.get('/api/debug/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log(' New client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(` User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log(' Client disconnected:', socket.id);
  });
});