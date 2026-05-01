require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const requestLogger = require('./middleware/requestLogger');
const calendarRoutes = require('./routes/calendar');

const PORT = process.env.PORT || 5000;


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
const chatRoutes = require('./routes/chat');


require('./passport');

const app = express();
app.set('trust proxy', 1);

let server;
const sslOptions = {
  key: fs.existsSync('key.pem') ? fs.readFileSync('key.pem') : null,
  cert: fs.existsSync('cert.pem') ? fs.readFileSync('cert.pem') : null
};

if (sslOptions.key && sslOptions.cert) {
  server = https.createServer(sslOptions, app);
  console.log(`🔒 SSL Certificates found. Starting server with HTTPS on port ${PORT}...`);
} else {
  server = http.createServer(app);
  console.log(`🔓 No SSL Certificates found. Starting server with HTTP on port ${PORT}...`);
}

// CORS configuration for Socket.IO and Express
const CORS_OPTIONS = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
};

const io = socketIo(server, { cors: CORS_OPTIONS });

// Make io globally available for notifications
global.io = io;

// Inject Socket.IO into every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
      frameSrc: ["'self'", "https://www.google.com"],
      connectSrc: ["'self'", "https://www.google.com", "https://play.google.com", "https://*.stream-io-api.com", "wss://*.stream-io-api.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.stream-io-api.com", "https://api.qrserver.com"],
    },
  },
})); // security headers

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for testing (previous: 100)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

app.use(cors(CORS_OPTIONS));
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
app.use('/api/chat', chatRoutes);


// MongoDB connection
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error(' MONGO_URI is missing. Check your .env file.');
  process.exit(1);
}


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


// Socket.IO events
io.on('connection', (socket) => {
  console.log(' New client connected:', socket.id);

  socket.on('join', ({ userId, role }) => {
    socket.join(userId);
    console.log(` User ${userId} joined their room`);
    
    if (role === 'admin' || role === 'superadmin') {
      socket.join('staff');
      console.log(` Staff ${userId} joined staff room`);
    }
  });

  socket.on('disconnect', () => {
    console.log(' Client disconnected:', socket.id);
  });
});

// Serve frontend static files from the Vite build directory
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Final deployment heartbeat: using no-path app.use for foolproof Express 5 compatibility
// Handle React routing, return all requests to React app
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});